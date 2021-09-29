import * as admin from 'firebase-admin';
import { CommonGameSteps, DbRoom } from '../../shared/dbmodel';
import { assertNever } from '../../shared/helpers/assertNever';
import { DbPath, unfalsifyArray, unfalsifyObject } from '../../shared/helpers/databaseHelper';
import { remapRecord } from '../../shared/helpers/mapHelper';
import { shuffleInPlace } from '../../shared/helpers/shuffle';
import { DoodleCardAction, PatchworkDoodleAction } from '../../shared/patchworkDoodle/actions';
import { Card, cardsById, patchCards, singleTileCard, starterCards } from '../../shared/patchworkDoodle/cards';
import { PatchworkDoodleDbRoom, PwdDbPrivateState, PwdDbPublicState, PwdStep } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';
import { RoomResponse } from '../../shared/requests';
import { GameManagerBase } from '../gameManagerBase';
import { defaultRules } from './defaultRules';
import { DrawingBoard, DrawSuccess } from './drawingBoard';

export class PatchworkDoodleGameManager extends GameManagerBase {

    createSpecificRoom(genericRoom: DbRoom): PatchworkDoodleDbRoom {
        const doodleDbRoom: PatchworkDoodleDbRoom = {
            ...genericRoom,
            meta: {
                ...genericRoom.meta,
                rules: defaultRules,
            },
            public: {
                ...genericRoom.public,
                step: CommonGameSteps.lobby,
                board: [],
                tokenPosition: -1,
            },
            internal: {
                ...genericRoom.internal,
                deck: [],
                discardPile: []
            },
            private: {}
        };

        return doodleDbRoom;
    }

    action(action: PatchworkDoodleAction): Promise<RoomResponse> {
        switch (action.type) {
            case 'start': return this.startAction();
            case 'doodle_card': return this.doodleCardAction(action);
            default:
                assertNever(action, false);
                return Promise.resolve(this.errorResponse('Invalid action!'));
        }
    }

    protected unfalsify(room: PatchworkDoodleDbRoom): void {
        super.unfalsify(room);

        room.private = unfalsifyObject(room.private);
        for (const record of Object.values(room.private)) {
            record.doodledCards = unfalsifyArray(record.doodledCards);
        }

        const internal = room.internal;
        if (internal) {
            internal.deck = unfalsifyArray(internal.deck);
            internal.discardPile = unfalsifyArray(internal.discardPile);
        }

        const pub = room.public;
        if (pub) {
            pub.board = unfalsifyArray(pub.board);
        }
    }

    private async startAction(): Promise<RoomResponse> {
        const roomReference = admin.database().ref(DbPath.room(this.roomDbId));

        return await this.roomTransaction(roomReference, (room: PatchworkDoodleDbRoom, abort, response) => {
            if (!this.assertOwner(room, response)) {
                abort();
            }

            // Convert all users to players. // TODO remove this when users can switch manually.
            room.meta.players = remapRecord(room.meta.users, () => true);
            const players = room.meta.players;

            // Init board
            const deck = this.createDeck(room.meta.rules.deckSize);
            const discardPile: string[] = [];
            const starterCardIds = this.draw(Object.keys(players).length, shuffleInPlace([...starterCards.map(x => x.id)]), []);
            const emptyBoard = new DrawingBoard(room.meta.rules).serializeBoard();

            // Init states
            room.private = remapRecord(players, (_key, _value, index) => ({
                serializedBoard: emptyBoard,
                startingCard: starterCardIds[index],
                doodledCards: []
            }));
            room.internal = {
                deck: deck,
                discardPile: discardPile
            };
            room.public = {
                step: PwdStep.doodle_starting_card,
                board: [],
                tokenPosition: -1,
                readyStates: remapRecord(players, () => false)
            };

            // Prepare round
            const board = room.public.board;
            const int = room.internal;
            const cardCount = room.meta.rules.boardCardCount - board.length;
            room.public.board = [...board, ...this.draw(cardCount, int.deck, int.discardPile)];
            room.public.tokenPosition = 0;

            return room;
        });
    }

    private async doodleCardAction(action: DoodleCardAction): Promise<RoomResponse> {
        const roomReference = admin.database().ref(DbPath.room(this.roomDbId));
        return await this.roomTransaction(roomReference, (room: PatchworkDoodleDbRoom, abort, response) => {
            if (!this.assertUserIsPlayer(room, response)) { abort(); }

            // TODO uncommented for test reasons
            // if (!this.assertPlayerNotReady(room, response)) { abort(); }

            const priv = room.private[this.userId];
            const pub = room.public;

            if (![PwdStep.doodle_starting_card, PwdStep.doodle_card].includes(pub.step as PwdStep)) {
                this.updateResponseError(response, 'Cannot doodle card in the current step!');
                abort();
            }

            if (!this.assertDoodledCardIsValid(pub, priv, action)) {
                this.updateResponseError(response, 'Doodled card is not valid!');
                abort();
            }

            const doodledCard = cardsById.get(action.cardId) as Card;
            const doodleBoard = new DrawingBoard(room.meta.rules, priv.serializedBoard);

            // TODO handle cut power
            const doodleResult = doodleBoard.tryDraw(doodledCard.display, action.x, action.y, action.rotationCount, action.isFlipped);
            if (!doodleResult.success) {
                this.updateResponseError(response, doodleResult.error);
                abort();
            }

            priv.doodledCards.push({
                originalCardId: action.cardId,
                display: (doodleResult as DrawSuccess).display,
                x: action.x,
                y: action.y
            });

            pub.readyStates[this.userId] = true;
            priv.serializedBoard = doodleBoard.serializeBoard();

            if (Object.values(pub.readyStates).every(isReady => isReady)) {
                this.drawStepFinished(room);
            }

            return room;
        });
    }

    private drawStepFinished(room: PatchworkDoodleDbRoom) {
        const pub = room.public;
        switch (pub.step) {
            case PwdStep.doodle_starting_card:
                pub.step = PwdStep.doodle_card;
                break;
            case PwdStep.doodle_card:
                pub.board.splice(pub.tokenPosition, 1);
                pub.step = PwdStep.doodle_card;
                break;
            default:
                throw new Error(`Invalid internal state after draw step: ${pub.step}`);
        }

        if (pub.board.length > room.meta.rules.roundRemainingCards) {
            pub.lastDieRoll = this.random(room.meta.rules.deckSize);
            pub.tokenPosition = (pub.tokenPosition + pub.lastDieRoll) % pub.board.length;
        } else {
            pub.step = PwdStep.partial_results;
        }
        pub.readyStates = remapRecord(pub.readyStates, () => false);
    }

    private assertDoodledCardIsValid(pub: PwdDbPublicState, priv: PwdDbPrivateState, action: DoodleCardAction): boolean {
        let validCards: string[] = [];
        switch (pub.step) {
            case PwdStep.doodle_starting_card:
                validCards = [priv.startingCard];
                // TODO are powers valid here?
                break;
            case PwdStep.doodle_card:
                switch (action.power?.type) {
                    case 'neighbor':
                        validCards = [
                            pub.board[(pub.tokenPosition - 1 + pub.board.length) % pub.board.length],
                            pub.board[(pub.tokenPosition + 1) % pub.board.length]
                        ];
                        break;
                    case 'one':
                        validCards = [singleTileCard.id];
                        break;
                    default:
                        validCards = [pub.board[pub.tokenPosition]];
                        break;
                }
                break;
        }

        return validCards.includes(action.cardId);
    }

    private draw<TCard>(count: number, deck: TCard[], discardPile: TCard[]): TCard[] {
        const drawnCards: TCard[] = [];
        for (let i = 0; i < count; i++) {
            if (deck.length === 0) {
                deck.push(...discardPile.splice(0, discardPile.length));
                shuffleInPlace(deck);
            }
            const drawnCard = deck.pop();
            if (!drawnCard) {
                throw new Error('Not enough cards in deck!');
            }
            drawnCards.push(drawnCard);
        }

        return drawnCards;
    }

    private createDeck(size: number): string[] {
        const deck: string[] = [];
        const possibleCards = shuffleInPlace([...patchCards.values()]);

        for (let i = 0; i < size; i++) {
            deck.push(possibleCards[i % possibleCards.length].id);
        }
        shuffleInPlace(deck);
        return deck;
    }

    private random(maxExclusive: number): number;
    private random(minInclusive: number, maxExclusive: number): number;
    private random(...args: number[]): number {
        const min = args.length === 2 ? args[0] : 0;
        const max = args[args.length - 1];
        return min + Math.floor(Math.random() * (max - min));
    }
}
