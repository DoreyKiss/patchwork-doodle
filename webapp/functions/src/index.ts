import * as admin from 'firebase-admin';

admin.initializeApp();
exports.user = require('./api/userFunctions');
exports.room = require('./api/roomFunctions');
exports.game = require('./api/gameFunctions');
