import firebase from 'firebase';
import { Injectable, Injector } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { DbRoomUsers } from 'functions/src/shared/dbmodel';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';
import { FunctionsService } from './functions.service';

@Injectable({
    providedIn: 'root'
})
export class RoomBaseService {
    // Imports
    dbService: DatabaseService;
    auth: AuthService;
    log: NGXLogger;
    functions: FunctionsService;

    usersSubject = new BehaviorSubject<{ name: string, id: string; }[]>([]);

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
        let { success: success } = await this.functions.joinRoom({ databaseId: roomDbId }).toPromise();
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
     * TODO Allow actually leaving the room.
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
        const usersSubscription = this.db.object<DbRoomUsers>(DbPath.roomUsers(roomDbId))
            .valueChanges()
            .subscribe((users) => {
                if (users) {
                    this.usersSubject.next(Object.entries(users).map(x => ({ id: x[0], name: x[1].name })));
                } else {
                    this.usersSubject.next([]);
                }
            });
        this.subscriptions.push(usersSubscription);
    }

    private addPresence(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            if (!this.auth.user) {
                this.log.error('User info not available!');
                resolve(false); return;
            }
            if (!this.roomDbId) {
                this.log.error('Room id not available!');
                resolve(false); return;
            }
            if (this.currentConn) {
                this.log.error('There is an existing connection already!');
                resolve(false); return;
            }

            this.log.info('Adding presence...');
            const connectionsRef = this.db.database.ref(DbPath.roomConnection(this.roomDbId, this.auth.user.uid));
            const connectedRef = this.db.database.ref('.info/connected');
            connectedRef.on('value', async snapshot => {
                if (snapshot.val() !== true) {
                    resolve(false);
                    return;
                }

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
