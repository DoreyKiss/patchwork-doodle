import * as admin from 'firebase-admin';

admin.initializeApp({
    databaseURL: 'https://patchwork-doodle-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'patchwork-doodle',
    storageBucket: 'patchwork-doodle.appspot.com',
});
exports.user = require('./api/userFunctions');
exports.room = require('./api/roomFunctions');
exports.game = require('./api/gameFunctions');
