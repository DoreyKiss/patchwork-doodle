import { Component, Injector, OnInit } from '@angular/core';
import { DoodleCardAction, StartGameAction } from 'functions/src/shared/patchworkDoodle/actions';
import { patchCharacters } from 'functions/src/shared/patchworkDoodle/cards';
import { RoomBaseComponent } from 'src/app/components/room-base/room-base.component';
import { FunctionsService } from 'src/app/services/functions.service';
import { RoomService } from '../services/room.service';

@Component({
    selector: 'app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss']
})
export class RoomComponent extends RoomBaseComponent implements OnInit {

    cardId = '';
    x = '0';
    y = '0';
    rotationCount = '0';
    isFlipped = '0';
    board: string[] = [];

    constructor(
        injector: Injector,
        public roomService: RoomService,
        private functionsService: FunctionsService
    ) {
        super(injector, roomService);
        this.roomType = 'patchwork_doodle';
    }

    async ngOnInit(): Promise<void> {
        await super.ngOnInit();
        const privateStateSubscription = this.roomService.privateStateSubject.subscribe(s => {
            this.board = s?.serializedBoard.split(patchCharacters.lineBreakChar) ?? [];
            this.cardId = s?.startingCard ?? this.cardId;
        });
        this.subscriptions.push(privateStateSubscription);
    }

    async start(): Promise<void> {
        const startAction: StartGameAction = { roomDbId: this.roomDbId, type: 'start' };
        const result = await this.functionsService.gameAction(startAction).toPromise();
        this.log.info('Start action result', result);
    }

    async testDraw(): Promise<void> {
        const doodleAction: DoodleCardAction = {
            type: 'doodle_card',
            roomDbId: this.roomDbId,
            cardId: this.cardId,
            isFlipped: parseInt(this.isFlipped) === 1,
            rotationCount: parseInt(this.rotationCount),
            x: parseInt(this.x),
            y: parseInt(this.y),
            power: undefined
        };

        const result = await this.functionsService.gameAction(doodleAction).toPromise();
        this.log.info('Test draw result', result);
    }
}
