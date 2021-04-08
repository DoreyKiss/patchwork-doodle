import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { customAlphabet } from 'nanoid';
import { DbPath } from '../shared/helpers/databaseHelper';
import { DbUser } from '../shared/dbmodel';
const nanoid_5digit = customAlphabet('0123456789', 5);
const euFunctions = functions.region('europe-west1');

/**
 * Adds user record to the database on user creation.
 */
export const onCreate = euFunctions.auth.user().onCreate(async user => {
    functions.logger.info('user-onCreate', { user });
    const newUser: DbUser = {
        displayName: `Player ${nanoid_5digit()}`,
        rooms: {}
    };
    await admin.database().ref(DbPath.user(user.uid)).set(newUser);
});

/**
 * Removes user record from database on user deletion.
 */
export const onDelete = euFunctions.auth.user().onDelete(async user => {
    functions.logger.info('user-onDelete', { user });
    await admin.database().ref(DbPath.user(user.uid)).remove();
});
