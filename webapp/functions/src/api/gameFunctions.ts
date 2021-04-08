import * as functions from 'firebase-functions';
import { getGameManager } from '../game/gameManagerMapping';
import { parseRoomId } from '../shared/helpers/roomHelper';
import { GameActionRequest, ErrorResponse } from '../shared/requests';
const euFunctions = functions.region('europe-west1');

export const action = euFunctions.https.onCall(async (data: GameActionRequest, context) => {
    const roomInfo = parseRoomId(data.roomDbId);
    if (!roomInfo) {
        return { success: false } as ErrorResponse;
    }
    if (!context.auth?.uid) {
        return { success: false } as ErrorResponse;
    }

    const gameManager = getGameManager(roomInfo.type, data.roomDbId, context.auth.uid);
    if (!gameManager) {
        return { success: false } as ErrorResponse;
    }

    return await gameManager.action(data);
});
