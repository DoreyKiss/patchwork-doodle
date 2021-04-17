import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DbRoom } from '../shared/dbmodel';
import { ErrorResponse, GameActionRequest, RoomResponse } from '../shared/requests';

export const EMPTY_ERROR_RESPONSE: RoomResponse = { success: false };
export const SUCCESS_RESPONSE: RoomResponse = { success: true };

class AbortError extends Error { }

export abstract class GameManagerBase {
    roomDbId!: string;
    userId!: string;

    init(roomDbId: string, userId: string): void {
        this.roomDbId = roomDbId;
        this.userId = userId;
    }

    abstract createSpecificRoom(genericRoom: DbRoom): DbRoom;

    abstract action(action: GameActionRequest): Promise<RoomResponse>;

    protected errorResponse(message: string): ErrorResponse {
        const result: ErrorResponse = {
            success: false,
            message: message
        };
        return result;
    }

    /**
     * Executes a transaction on a room reference.
     * Updates the response with the appropriate error message if the room does not exist, or if there is an unknown error.
     */
    public async roomTransaction<RoomType extends DbRoom>(
        roomRef: admin.database.Reference,
        response: RoomResponse,
        updater: (room: RoomType, abort: (message?: string) => never) => RoomType | null | undefined
    ): Promise<void> {
        let roomExist = false;
        await roomRef.transaction((room: RoomType) => {
            roomExist = room !== null;
            if (room === null) {
                return room; // Room can be null on first local try, so we do not cancel the transaction here, instead keep track of room state.
            }

            try {
                const abort = (msg?: string) => { throw new AbortError(msg); };
                return updater(room, abort);
            }
            catch (err) {
                if (err instanceof AbortError) {
                    functions.logger.warn(`Transaction aborted: ${err.message}`, { roomDbId: this.roomDbId, userId: this.userId });
                } else {
                    functions.logger.error('Error during room transaction!', { roomDbId: this.roomDbId, userId: this.userId, error: err });
                }
                return; // Cancel transaction, report unknown error.
            }
        }, (err, committed) => this.assertCommitted(committed, response), false);

        if (response.success && !roomExist) {
            this.updateResponseError(response, 'Room does not exist!');
        }
    }

    protected assertRoom(room: DbRoom, response: RoomResponse): boolean {
        if (room === null) {
            this.updateResponseError(response, 'Room does not exist!');
            return false;
        }
        return true;
    }

    protected assertOwner(room: DbRoom, response: RoomResponse): boolean {
        if (room.meta.owner !== this.userId) {
            this.updateResponseError(response, 'Only room owner can perform this action!');
            return false;
        }
        return true;
    }

    protected assertCommitted(committed: boolean, response: RoomResponse): void {
        if (response.success && !committed) {
            this.updateResponseError(response, 'Unknown error!');
        }
    }

    protected updateResponseError(response: RoomResponse, message: string): void {
        response.success = false;
        // Force typescript to recognize that response is now ErrorResponse...
        if (response.success) { throw new Error(); }
        response.message = message;
    }
}
