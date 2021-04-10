import { Injector } from '@angular/core';
import { Injectable } from '@angular/core';
import { RoomBaseService } from 'src/app/services/room-base.service';

@Injectable({
    providedIn: 'root'
})
export class RoomService extends RoomBaseService {
    constructor(
        injector: Injector
    ) {
        super(injector);
    }
}
