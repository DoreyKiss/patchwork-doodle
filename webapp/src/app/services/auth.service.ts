import firebase from 'firebase/app';
import 'firebase/auth';
import { Injectable, NgZone } from '@angular/core';
import { DbUser } from 'functions/src/shared/dbmodel';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { NGXLogger } from 'ngx-logger';
import { ReplaySubject, Subscription } from 'rxjs';
import { DatabaseService } from './database.service';
import { FIREBASE_AUTH_TOKEN } from '../providers/firebase-auth.provider';
import { Inject } from '@angular/core';

export type User = DbUser & {
    uid: string;
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user?: User;
    userChanged = new ReplaySubject<User>(1);
    private dbSubscription?: Subscription;

    constructor(
        private databaseService: DatabaseService,
        private zone: NgZone,
        private log: NGXLogger,
        @Inject(FIREBASE_AUTH_TOKEN) private auth: firebase.auth.Auth
    ) {
        this.auth.onAuthStateChanged({
            next: user => this.onAuthStateChanged(user),
            error: (err) => console.error('Authentication error', err),
            complete: () => { },
        });
    }

    async loginAnonymously(): Promise<boolean> {
        await this.auth.signInAnonymously();
        return this.user !== undefined;
    }

    logout(): Promise<void> {
        return this.auth.signOut();
    }

    async updateDisplayName(newDisplayName: string): Promise<void> {
        if (!this.user?.uid) {
            this.log.warn('No user to update.');
            return;
        }

        await this.databaseService.rt
            .object<DbUser>(DbPath.user(this.user.uid))
            .update({ displayName: newDisplayName });
    }

    private onAuthStateChanged(user: firebase.User) {
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
            this.userChanged.next(this.user);
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
                    this.userChanged.next(this.user);
                }
            }));
    }
}
