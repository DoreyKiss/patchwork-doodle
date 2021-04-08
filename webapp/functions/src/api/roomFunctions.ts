/* eslint-disable @typescript-eslint/no-unused-vars */
import { Reference } from '@firebase/database-types';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { nanoid } from 'nanoid';
import { getGameManager } from '../game/gameManagerMapping';
import { DbRoom, DbRoomUsers } from '../shared/dbmodel';
import { DbPath } from '../shared/helpers/databaseHelper';
import { createRoomDatabaseId } from '../shared/helpers/roomHelper';
import { CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse } from '../shared/requests';
const euFunctions = functions.region('europe-west1');

/**
 * Creates a database value at the given reference if it does not exist.
 * Takes firebase retry mechanism into account, as the value can be null locally, even if it has a value on the server.
 * @param reference The reference.
 * @param createValue Generator for the new value.
 * @returns Promise of whether a new value have been created.
 */
async function createIfNotExist<TValue>(reference: Reference, createValue: () => TValue): Promise<boolean> {
    let isValueCreated = false;
    await reference.transaction((currentValue: DbRoom) => {
        if (currentValue !== null) {
            return;
        } else {
            return createValue();
        }
    }, (err, committed) => isValueCreated = committed, false);
    return isValueCreated;
}

/**
 * Creates game room of the given type.
 */
export const create = euFunctions.https.onCall(async (data: CreateRoomRequest, context) => {
    functions.logger.info('create');
    const maxTries = 10;
    let tryCount = -1;

    const userId = context.auth?.uid;
    if (!userId) {
        return { success: false } as CreateRoomResponse;
    }

    while (++tryCount < maxTries) {
        const id = nanoid(8);
        const roomDbId = createRoomDatabaseId(data.type, id);
        if (roomDbId === null) {
            return { success: false } as CreateRoomResponse;
        }

        const gameManager = getGameManager(data.type, roomDbId, userId);
        const genericRoom: DbRoom = {
            meta: {
                createdAt: admin.database.ServerValue.TIMESTAMP as number,
                name: data.name,
                owner: userId,
                users: false,
                players: {},
                spectators: {}
            },
            connections: false,
            private: false,
            internal: false,
            public: false
        };
        const newRoom = gameManager.createSpecificRoom(genericRoom);

        const isRoomCreated = await createIfNotExist(admin.database().ref(DbPath.room(roomDbId)), () => newRoom);

        if (isRoomCreated) {
            const response: CreateRoomResponse = {
                success: true,
                databaseId: roomDbId,
                type: data.type,
                id: id
            };
            return response;
        }
    }

    return { success: false } as CreateRoomResponse;
});

/**
 * Handles user join request for the given room. Sets up user presence in the database.
 */
export const join = euFunctions.https.onCall(async (data: JoinRoomRequest, context) => {
    functions.logger.info('join');

    const userId = context.auth?.uid;
    const roomDbId = data.databaseId;
    if (!userId) {
        return { success: false } as JoinRoomResponse;
    }

    const userDisplayName = (await admin.database().ref(DbPath.user(userId)).child('displayName').get()).val() as string ?? 'Unknown user';

    await admin.database().ref(DbPath.roomUsers(roomDbId)).transaction((users: DbRoomUsers | null) => {
        functions.logger.info(users);
        if (users === null) {
            functions.logger.warn(`Room ${roomDbId} does not exist!`);
            return users;
        }

        if (users === false) {
            users = {};
        }

        users[userId] = { name: userDisplayName };
        return users;
    });

    return { success: true } as JoinRoomResponse;
});

/**
 * Handles user disconnect from a room. 
 */
export const onUserDisconnect = euFunctions.database.ref('rooms/{roomDbId}/meta/connections/{userId}').onWrite(async (change, context) => {
    const roomDbId = context.params['roomDbId'] as string;
    const userId = context.params['userId'] as string;

    const valueAfter = change.after.val();
    if (valueAfter === null) {
        const userReference = admin.database().ref(DbPath.roomUser(roomDbId, userId));
        await userReference.remove();
    }
});
