import { Injectable, Injector } from '@angular/core';
import { DbPath } from 'functions/src/shared/helpers/databaseHelper';
import { PwdDbPrivateState } from 'functions/src/shared/patchworkDoodle/patchworkDoodleDbModel';
import { ReplaySubject } from 'rxjs';
import { RoomBaseService } from 'src/app/services/room-base.service';

@Injectable({
    providedIn: 'root'
})
export class RoomService extends RoomBaseService {

    privateStateSubject = new ReplaySubject<PwdDbPrivateState | null>(1);

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    protected subscribeToDb(roomDbId: string): void {
        super.subscribeToDb(roomDbId);

        if (!this.auth.user) { // TODO check, this should be available here
            this.log.error('User is not available!');
            return;
        }

        const privateStateSubscription = this.db
            .object<PwdDbPrivateState>(DbPath.roomPrivateState(roomDbId, this.auth.user.uid))
            .valueChanges()
            .subscribe(this.privateStateSubject);
        this.subscriptions.push(privateStateSubscription);
    }
}
