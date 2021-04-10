import { Injector } from '@angular/core';
import { Component } from '@angular/core';
import { RoomBaseComponent } from 'src/app/components/room-base/room-base.component';
import { RoomService } from '../services/room.service';

@Component({
    selector: 'app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss']
})
export class RoomComponent extends RoomBaseComponent {

    constructor(
        injector: Injector,
        public roomService: RoomService
    ) {
        super(injector, roomService);
        this.roomType = 'patchwork_doodle';
    }

}
