import { Injectable, Injector } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import firebase from 'firebase';
import { DbRoomConnections, DbRoomUser, DbRoomUsers } from 'functions/src/shared/dbmodel';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';
import { FunctionsService } from './functions.service';

export type ClientUser = DbRoomUser & {
    id: string;
    isConnected: boolean;
};

@Injectable({
    providedIn: 'root'
})
export abstract class RoomBaseService {
    // Imports
    dbService: DatabaseService;
    auth: AuthService;
    log: NGXLogger;
    functions: FunctionsService;

    usersSubject = new BehaviorSubject<ClientUser[]>([]);

    private roomDbId?: string;
    private db: AngularFireDatabase;
    private currentConn: firebase.database.Reference | null = null;
    private subscriptions: Subscription[] = [];

    constructor(
        injector: Injector
    ) {
        this.dbService = injector.get(DatabaseService);
        this.auth = injector.get(AuthService);
        this.log = injector.get(NGXLogger);
        this.functions = injector.get(FunctionsService);
        this.db = this.dbService.rt;
    }

    /**
     * Call room-join function.
     * Add user presence to room.
     * Subscribe to room in database.
     */
    async joinRoom(roomDbId: string): Promise<boolean> {
        this.log.info('Join room');
        this.roomDbId = roomDbId;
        let { success } = await this.functions.joinRoom({ databaseId: roomDbId }).toPromise();
        if (success) {
            success = await this.addPresence();
        }

        if (success) {
            this.subscribeToDb(roomDbId);
        } else {
            await this.leaveRoom();
        }

        return success;
    }

    /**
     * Remove user presence from room.
     */
    async leaveRoom(): Promise<void> {
        this.log.info('Leave room');
        if (this.currentConn) {
            try {
                await this.currentConn.remove();
            } catch (error) {
                this.log.warn('Failed to remove current connection from room');
            }
            this.currentConn = null;
        }
    }

    private subscribeToDb(roomDbId: string) {
        this.log.info('subscribeToDb');
        const usersSubscription = this.db
            .object<DbRoomUsers>(DbPath.roomUsers(roomDbId))
            .valueChanges();

        const connectionSubscription = this.db
            .object<DbRoomConnections>(DbPath.roomConnections(roomDbId))
            .valueChanges();

        const combinedUserSubscription = combineLatest([usersSubscription, connectionSubscription])
            .subscribe(([users, connections]) => {
                if (users) {
                    this.usersSubject.next(Object.entries(users).map(([id, user]) => ({
                        id,
                        name: user.name,
                        isConnected: (connections && connections[id] !== undefined) ?? false
                    })));
                } else {
                    this.usersSubject.next([]);
                }
            });

        this.subscriptions.push(combinedUserSubscription);
    }

    private addPresence(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            if (!this.auth.user) {
                this.log.error('User info not available!');
                return resolve(false);
            }
            if (!this.roomDbId) {
                this.log.error('Room id not available!');
                return resolve(false);
            }
            if (this.currentConn) {
                this.log.error('There is an existing connection already!');
                return resolve(false);
            }

            this.log.info('Adding presence...');
            const connectionsRef = this.db.database.ref(DbPath.roomConnection(this.roomDbId, this.auth.user.uid));
            const connectedRef = this.db.database.ref('.info/connected');
            connectedRef.on('value', async snapshot => {
                this.log.info(`.info/connected = ${snapshot.val() as string}`);
                if (snapshot.val() !== true) {
                    // Do not do anything while disconnected from db.
                    // TODO Probably some timeout is needed in case the app is offline.
                    return;
                }

                // We are connected, so we do not need connected events anymore.
                // Either currentConn is set up to handle it, or we cannot connect to the room anyway.
                connectedRef.off();

                try {
                    this.currentConn = await connectionsRef.push();
                    await this.currentConn.onDisconnect().remove();
                    await this.currentConn.set(true);
                    this.log.info('Added presence.');
                    resolve(true);
                } catch (error) {
                    this.log.error('Adding presence failed!');
                    resolve(false);
                }
            });
        });
    }

}
