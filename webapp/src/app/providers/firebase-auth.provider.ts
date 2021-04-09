
import { InjectionToken, Provider } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import { environment } from 'src/environments/environment';

function firebaseAuthFactory(): firebase.auth.Auth {
    const auth = firebase.auth();
    if (!environment.production) {
        auth.useEmulator('http://localhost:9099/');
    }

    return auth;
}

/**
 * Injection token for firebase auth service `firebase.auth.Auth` to use instead of this AngularFire counterpart.
 * Used because AngularFire auth does not seem to work correctly with emulators.
 */
export const FIREBASE_AUTH_TOKEN = new InjectionToken<firebase.auth.Auth>('Firebase auth service without AngularFire.', {
    providedIn: 'root',
    factory: firebaseAuthFactory,
});

/**
 * Provides an initialized instance of `firebase.auth.Auth` to use instead of this AngularFire counterpart.
 * Used because AngularFire auth does not seem to work correctly with emulators.
 */
export const FirebaseAuthProvider: Provider = {
    provide: FIREBASE_AUTH_TOKEN,
    useFactory: firebaseAuthFactory,
};


