import * as admin from 'firebase-admin';
import { DbRoom } from '../../shared/dbmodel';
import { RoomResponse } from '../../shared/requests';
import { EMPTY_ERROR_RESPONSE, GameManagerBase } from '../gameManagerBase';
import { PatchworkDoodleDbRoom, PwdStep } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';
import { assertNever } from '../../shared/helpers/assertNever';
import { PatchworkDoodleAction } from '../../shared/patchworkDoodle/actions';
import { DbPath } from '../../shared/helpers/databaseHelper';

export class PatchworkDoodleGameManager extends GameManagerBase {

    createSpecificRoom(genericRoom: DbRoom): PatchworkDoodleDbRoom {
        const doodleDbRoom: PatchworkDoodleDbRoom = {
            ...genericRoom,
            meta: {
                ...genericRoom.meta,
                rules: {
                    boardSize: { width: 5, height: 5 },
                },
            },
            public: { step: PwdStep.lobby },
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

            room.private = Object.fromEntries(Object.keys(room.meta.players).map(x => [x, {
                test: `private userInfo for ${x}`
            }]));
            room.internal = {
                test: 'test internal'
            };
            room.public = {
                step: PwdStep.draw_starting_card,
            };

            return room;
        });

        return response;
    }
}