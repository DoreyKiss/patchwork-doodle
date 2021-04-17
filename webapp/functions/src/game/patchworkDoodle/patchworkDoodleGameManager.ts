import * as admin from 'firebase-admin';
import { CommonGameSteps, DbRoom } from '../../shared/dbmodel';
import { assertNever } from '../../shared/helpers/assertNever';
import { DbPath } from '../../shared/helpers/databaseHelper';
import { shuffleInPlace } from '../../shared/helpers/shuffle';
import { PatchworkDoodleAction } from '../../shared/patchworkDoodle/actions';
import { patchCards } from '../../shared/patchworkDoodle/cards';
import { PatchworkDoodleDbRoom, PwdStep } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';
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
            public: { step: CommonGameSteps.lobby },
            internal: false,
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

    private async start(): Promise<RoomResponse> {
        const response: RoomResponse = { success: true };
        const roomReference = admin.database().ref(DbPath.room(this.roomDbId));

        await this.roomTransaction(roomReference, response, (room: PatchworkDoodleDbRoom, abort) => {
            if (!this.assertOwner(room, response)) {
                abort();
            }

            const deck = this.createDeck(room.meta.rules.deckSize);
            const discardPile: string[] = [];
            const board = this.draw(8, deck, discardPile);

            room.private = Object.fromEntries(Object.keys(room.meta.users).map(x => [x, { // TODO use 'players' instead of 'users'
                test: `private userInfo for ${x}`
            }]));
            room.internal = {
                deck: deck,
                discardPile: discardPile
            };
            room.public = {
                step: PwdStep.draw_starting_card,
                tokenPosition: 0,
                board: board
            };

            return room;
        });

        return response;
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
        const possibleCards = [...patchCards.values()];

        for (let i = 0; i < size; i++) {
            deck.push(possibleCards[i % possibleCards.length].id);
        }
        shuffleInPlace(deck);

        return deck;
    }

}
