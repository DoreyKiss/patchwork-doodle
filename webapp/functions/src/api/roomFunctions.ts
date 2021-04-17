/* eslint-disable @typescript-eslint/no-unused-vars */
import { Reference } from '@firebase/database-types';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { nanoid } from 'nanoid';
import { getDefaultGameManager, getGameManager } from '../game/gameManagerMapping';
import { CommonGameSteps, DbRoom, DbRoomUsers } from '../shared/dbmodel';
import { DbPath, deleteDbKey } from '../shared/helpers/databaseHelper';
import { createRoomDatabaseId } from '../shared/helpers/roomHelper';
import { CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse } from '../shared/requests';
import { realtimeDatabaseId } from './config';
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
        if (users === null) {
            return users;
        }

        if (users === false) {
            users = {};
        }

        functions.logger.info(`${userDisplayName}-${userId} joined Room ${roomDbId}.`); // This triggers locally for first change
        users[userId] = { name: userDisplayName };
        return users;
    });

    return { success: true } as JoinRoomResponse; // TODO return false if not successful
});

/**
 * Handles user disconnect from a room.
 * Deletes user if the game is in the lobby step.
 */
export const onUserDisconnect = euFunctions.database.instance(realtimeDatabaseId)
    .ref('/rooms/{roomDbId}/connections/{userId}')
    .onDelete(async (snapshot, context) => {
        const roomDbId = context.params['roomDbId'] as string;
        const userId = context.params['userId'] as string;

        const manager = getDefaultGameManager(roomDbId, userId);
        const roomRef = admin.database().ref(DbPath.room(roomDbId));
        await manager.roomTransaction(roomRef, { success: true }, (room, abort) => {
            const publicState = room.public;
            functions.logger.info(publicState, userId, roomDbId);

            // Only delete user from room users if the game is in the lobby step.
            if (!publicState || publicState.step === CommonGameSteps.lobby) {
                room.meta.users = deleteDbKey(room.meta.users, userId);
            }
            return room;
        });
    });
