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

        const rPublic = room.public;
        if (rPublic) {
            rPublic.board = unfalsifyArray(rPublic.board);
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

            const deck = this.createDeck(room.meta.rules.deckSize);
            const discardPile: string[] = [];
            const starterCardIds = this.draw(Object.keys(players).length, shuffleInPlace([...starterCards.map(x => x.id)]), []);
            const emptyBoard = new DrawingBoard(room.meta.rules).serializeBoard();

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

            this.prepareRound(room);

            return room;
        });
    }

    private async doodleCardAction(action: DoodleCardAction): Promise<RoomResponse> {
        const roomReference = admin.database().ref(DbPath.room(this.roomDbId));
        return await this.roomTransaction(roomReference, (room: PatchworkDoodleDbRoom, abort, response) => {
            if (!this.assertUserIsPlayer(room, response)) { abort(); }

            // TODO uncommented for test reasons
            // if (!this.assertPlayerNotReady(room, response)) { abort(); }

            // const rInternal = room.internal as PwdDbInternalState;
            const rPrivate = room.private[this.userId];
            const rPublic = room.public;

            if (![PwdStep.doodle_starting_card, PwdStep.doodle_card].includes(rPublic.step as PwdStep)) {
                this.updateResponseError(response, 'Cannot doodle card in the current step!');
                abort();
            }

            if (!this.assertDoodledCardIsValid(rPublic, rPrivate, action)) {
                this.updateResponseError(response, 'Doodled card is not valid!');
                abort();
            }

            const doodledCard = cardsById.get(action.cardId) as Card;
            const doodleBoard = new DrawingBoard(room.meta.rules, rPrivate.serializedBoard);

            // TODO handle cut power
            const doodleResult = doodleBoard.tryDraw(doodledCard.display, action.x, action.y, action.rotationCount, action.isFlipped);
            if (!doodleResult.success) {
                this.updateResponseError(response, doodleResult.error);
                abort();
            }

            rPrivate.doodledCards.push({
                originalCardId: action.cardId,
                display: (doodleResult as DrawSuccess).display,
                x: action.x,
                y: action.y
            });

            rPublic.readyStates[this.userId] = true;
            rPrivate.serializedBoard = doodleBoard.serializeBoard();

            if (Object.values(rPublic.readyStates).every(isReady => isReady)) {
                // TODO handle if everyBody is ready
                // this.log
            }

            return room;
        });
    }

    private assertDoodledCardIsValid(rPublic: PwdDbPublicState, rPrivate: PwdDbPrivateState, action: DoodleCardAction): boolean {
        let validCards: string[] = [];
        switch (rPublic.step) {
            case PwdStep.doodle_starting_card:
                validCards = [rPrivate.startingCard];
                // TODO are powers valid here?
                break;
            case PwdStep.doodle_card:
                switch (action.power?.type) {
                    case 'neighbor':
                        validCards = [
                            rPublic.board[rPublic.tokenPosition - 1 + rPublic.board.length % rPublic.board.length],
                            rPublic.board[rPublic.tokenPosition + 1 % rPublic.board.length]
                        ];
                        break;
                    case 'one':
                        validCards = [singleTileCard.id];
                        break;
                    default:
                        validCards = [rPublic.board[rPublic.tokenPosition]];
                        break;
                }
                break;
        }

        return validCards.includes(action.cardId);
    }

    /**
     * Place down 8 cards. Set the token to a random position
     */
    private prepareRound(room: PatchworkDoodleDbRoom): void {
        const board = room.public.board;
        const internal = room.internal;

        const cardCount = room.meta.rules.boardCardCount - board.length;
        room.public.board = [...board, ...this.draw(cardCount, internal.deck, internal.discardPile)];
        room.public.tokenPosition = 0;
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

}
