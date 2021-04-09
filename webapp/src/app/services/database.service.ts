import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

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
    }
}
