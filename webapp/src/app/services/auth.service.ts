import { Inject, Injectable, NgZone } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import { DbUser } from 'functions/src/shared/dbmodel';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { NGXLogger } from 'ngx-logger';
import { ReplaySubject, Subscription } from 'rxjs';
import { FIREBASE_AUTH_TOKEN } from '../providers/firebase-auth.provider';
import { DatabaseService } from './database.service';

export type User = DbUser & {
    uid: string;
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    /**
     * Represents the user's auth state. Possible values:
     * - undefined: Auth process has not finished.
     * - null: User is not currently logged in.
     * - other: User is logged in.
     */
    user: User | null | undefined;

    /** Represents the user's auth state over time. */
    userSubject = new ReplaySubject<User | null>(1);

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
        return !!this.user;
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

    private setUser(user: User | null) {
        this.user = user;
        this.userSubject.next(this.user);
    }

    private onAuthStateChanged(user: firebase.User) {
        this.log.info('START auth state changed', user);
        this.zone.run(() => {
            if (user) {
                // logged in
                this.setUser({ uid: user.uid, rooms: {} });
                if (user.uid) {
                    this.listenToDbChanges(user.uid);
                }
            } else {
                // not logged in
                this.setUser(null);
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
                    this.setUser({ uid: this.user.uid, ...value });
                }
            }));
    }
}
