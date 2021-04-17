import * as admin from 'firebase-admin';
import { CommonGameSteps, DbRoom } from '../../shared/dbmodel';
import { assertNever } from '../../shared/helpers/assertNever';
import { DbPath, unfalsifyArray } from '../../shared/helpers/databaseHelper';
import { shuffleInPlace } from '../../shared/helpers/shuffle';
import { PatchworkDoodleAction } from '../../shared/patchworkDoodle/actions';
import { patchCards, starterCards } from '../../shared/patchworkDoodle/cards';
import { PatchworkDoodleDbRoom, PwdDbInternalState, PwdDbPrivateState, PwdDbPublicState, PwdStep } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';
import { RoomResponse } from '../../shared/requests';
import { EMPTY_ERROR_RESPONSE, GameManagerBase } from '../gameManagerBase';
import { defaultRules } from './defaultRules';

export class PatchworkDoodleGameManager extends GameManagerBase {

    createSpecificRoom(genericRoom: DbRoom): PatchworkDoodleDbRoom {
        const doodleDbRoom: PatchworkDoodleDbRoom = {
            ...genericRoom,
            meta: {
                ...genericRoom.meta,
                rules: defaultRules,
            },
            public: {
                step: CommonGameSteps.lobby,
                board: []
            },
            internal: {
                deck: [],
                discardPile: []
            },
            private: false,
        };

        return doodleDbRoom;
    }

    action(action: PatchworkDoodleAction): Promise<RoomResponse> {
        switch (action.type) {
            case 'start': return this.start(); break;
            case 'doodle_card': console.log(action); break;
            default:
                assertNever(action, false);
                return Promise.resolve(this.errorResponse('Invalid action!'));
        }

        return Promise.resolve(EMPTY_ERROR_RESPONSE);
    }

    protected unfalsify(room: PatchworkDoodleDbRoom): void {
        super.unfalsify(room);

        const rPrivate = room.private;
        if (rPrivate) {
            for (let record of Object.values(rPrivate)) {
                record.doodledCards = unfalsifyArray(record.doodledCards);
            }
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

    private async start(): Promise<RoomResponse> {
        const response: RoomResponse = { success: true };
        const roomReference = admin.database().ref(DbPath.room(this.roomDbId));

        await this.roomTransaction(roomReference, response, (room: PatchworkDoodleDbRoom, abort) => {
            if (!this.assertOwner(room, response)) {
                abort();
            }

            // Convert all users to players. // TODO remove this when users can switch manually.
            room.meta.players = Object.fromEntries(Object.keys(room.meta.users).map(x => [x, true]));
            const players = room.meta.players;

            const deck = this.createDeck(room.meta.rules.deckSize);
            const discardPile: string[] = [];
            const starterCardIds = this.draw(Object.keys(players).length, shuffleInPlace([...starterCards.map(x => x.id)]), []);

            room.private = Object.fromEntries(Object.keys(players).map((userId, index) => [userId, {
                startingCard: starterCardIds[index],
                doodledCards: []
            } as PwdDbPrivateState]));

            room.internal = {
                deck: deck,
                discardPile: discardPile
            };

            room.public = {
                step: PwdStep.doodle_starting_card,
                board: []
            };

            this.prepareRound(room);

            return room;
        });

        return response;
    }

    /**
     * Place down 8 cards. Set the token to a random position
     */
    private prepareRound(room: PatchworkDoodleDbRoom): void {
        const roomPublic = room.public as PwdDbPublicState;
        const internal = room.internal as PwdDbInternalState;
        const board = roomPublic.board as string[];
        const meta = room.meta;

        const cardCount = meta.rules.boardCardCount - board.length;
        roomPublic.board = [...board, ...this.draw(cardCount, internal.deck, internal.discardPile)];
        roomPublic.tokenPosition = 0;
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
