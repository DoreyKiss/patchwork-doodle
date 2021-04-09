import * as admin from 'firebase-admin';

admin.initializeApp({
    databaseURL: 'https://patchwork-doodle-default-rtdb.europe-west1.firebasedatabase.app'
});
exports.user = require('./api/userFunctions');
exports.room = require('./api/roomFunctions');
exports.game = require('./api/gameFunctions');
