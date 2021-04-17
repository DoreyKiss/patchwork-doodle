import { Component, Injector } from '@angular/core';
import { StartGameAction } from 'functions/src/shared/patchworkDoodle/actions';
import { RoomBaseComponent } from 'src/app/components/room-base/room-base.component';
import { FunctionsService } from 'src/app/services/functions.service';
import { RoomService } from '../services/room.service';

@Component({
    selector: 'app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss']
})
export class RoomComponent extends RoomBaseComponent {

    constructor(
        injector: Injector,
        public roomService: RoomService,
        private functionsService: FunctionsService
    ) {
        super(injector, roomService);
        this.roomType = 'patchwork_doodle';
    }

    async start(): Promise<void> {
        const startAction: StartGameAction = { roomDbId: this.roomDbId, type: 'start' };
        await this.functionsService.gameAction(startAction).toPromise();
    }
}
