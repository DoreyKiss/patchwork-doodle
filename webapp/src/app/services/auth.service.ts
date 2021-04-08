import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { DbUser } from 'functions/src/shared/dbmodel';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DatabaseService } from './database.service';

export type User = DbUser & {
    uid: string;
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user?: User;
    private dbSubscription?: Subscription;

    constructor(
        private auth: AngularFireAuth,
        private databaseService: DatabaseService,
        private zone: NgZone,
        private log: NGXLogger
    ) { }

    async _init(): Promise<void> {
        if (!environment.production) {
            await this.auth.useEmulator('http://localhost:9099/');
        }

        await this.auth.onAuthStateChanged({
            next: user => this.onAuthStateChanged(user),
            error: (err) => console.error('Authentication error', err),
            complete: () => { },
        });
    }

    // async updateDisplayName(newDisplayName: string): Promise<void> {
    //     if (!this.user?.uid) {
    //         this.log.info('No user to update.');
    //         return;
    //     }

    //     await Promise.resolve();
    //     // await this.databaseService.rt
    //     //     .object<DbUser>(DbPath.user(this.user.uid))
    //     //     .update({ displayName: newDisplayName });
    // }

    async loginAnonymously(): Promise<boolean> {
        await this.auth.signInAnonymously();
        return this.user !== undefined;
    }

    logout(): Promise<void> {
        return this.auth.signOut();
    }

    private onAuthStateChanged(user: firebase.default.User) {
        this.log.info('START auth state changed', user);
        this.zone.run(() => {
            if (user) {
                // logged in
                this.user = { uid: user.uid, rooms: {} };
                if (this.user.uid) {
                    this.listenToDbChanges(this.user.uid);
                }
            } else {
                // not logged in
                this.user = undefined;
                this.unsubscribeFromDbChanges();
            }
        });
        this.log.info('END auth changed', this.user);
    }

    private unsubscribeFromDbChanges() {
        this.dbSubscription?.unsubscribe();
        this.dbSubscription = undefined;
    }

    private listenToDbChanges(userId: string): void {
        this.unsubscribeFromDbChanges();

        this.dbSubscription = this.databaseService.rt
            .object<DbUser>(DbPath.user(userId))
            .valueChanges()
            .subscribe(value => this.zone.run(() => {
                if (!this.user) {
                    console.warn('DB update received for not logged-out user.');
                    return;
                }
                console.log(value);
                if (value) {
                    this.user = { uid: this.user.uid, ...value };
                }
            }));
    }
}
