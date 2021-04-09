import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { CreateRoomRequest, CreateRoomResponse, GameActionRequest, JoinRoomRequest, JoinRoomResponse, RoomResponse } from 'functions/src/shared/requests';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FunctionsService {
    /** Creates a new game room with the given name and game type. */
    createRoom: (req: CreateRoomRequest) => Observable<CreateRoomResponse>;
    /** Joins to the given room. User is added to the list of room participants. */
    joinRoom: (req: JoinRoomRequest) => Observable<JoinRoomResponse>;
    /** Performs the given action within a game like placing a card, or indicating readiness. */
    gameAction: (req: GameActionRequest) => Observable<RoomResponse>;

    constructor(
        fs: AngularFireFunctions
    ) {
        this.createRoom = fs.httpsCallable<CreateRoomRequest, CreateRoomResponse>('room-create');
        this.joinRoom = fs.httpsCallable<JoinRoomRequest, JoinRoomResponse>('room-join');
        this.gameAction = fs.httpsCallable<GameActionRequest, RoomResponse>('game-action');
    }
}
