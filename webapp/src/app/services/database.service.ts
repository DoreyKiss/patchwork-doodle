import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    /** Firebase Realtime Database instance */
    rt!: AngularFireDatabase;

    constructor(
        private fireDatabase: AngularFireDatabase
    ) {
        this.rt = this.fireDatabase;
        if (!environment.production) {
            this.rt.database.useEmulator('localhost', 9000);
        }
    }
}
