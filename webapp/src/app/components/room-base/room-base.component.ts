import { Component, Injector, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomType } from 'functions/src/shared/dbmodel';
import { createRoomDatabaseId } from 'functions/src/shared/helpers/roomHelper';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { ClientUser, RoomBaseService } from 'src/app/services/room-base.service';

@Component({
    selector: 'app-room-base',
    template: ''
})
export class RoomBaseComponent implements OnInit, OnDestroy {
    // Imports
    route: ActivatedRoute;
    router: Router;
    auth: AuthService;
    log: NGXLogger;
    ngZone: NgZone;

    // Fields
    roomId!: string;
    roomDbId!: string;
    roomType!: RoomType;
    roomUsers = new BehaviorSubject<ClientUser[]>([]);

    /** Saved subscriptions to unsubscribe at ngOnDestroy. */
    protected subscriptions: Subscription[] = [];

    #roomService: RoomBaseService;

    constructor(
        injector: Injector,
        roomService: RoomBaseService
    ) {
        this.route = injector.get(ActivatedRoute);
        this.router = injector.get(Router);
        this.auth = injector.get(AuthService);
        this.log = injector.get(NGXLogger);
        this.ngZone = injector.get(NgZone);
        this.#roomService = roomService;
    }

    /**
     * Subscribe to user changed.
     * Redirect user if not logged in.
     * Join room.
     * Subscribe to room users changed.
     */
    async ngOnInit(): Promise<void> {
        this.log.info('OnInit');

        // Require user logged in
        const user = await this.auth.userSubject.pipe(take(1)).toPromise();
        if (!user) {
            await this.redirectToLoginIfNeeded();
            return;
        }
        this.subscriptions.push(
            this.auth.userSubject.subscribe(() => this.ngZone.run(() => void this.redirectToLoginIfNeeded()))
        );

        // Require room id in path
        const roomId = this.route.snapshot.paramMap.get('id');
        if (!roomId) {
            this.log.warn('No room id found, returning to home.');
            await this.redirectToHome();
            return;
        }
        this.roomId = roomId;
        this.roomDbId = createRoomDatabaseId(this.roomType, roomId);

        // If we end up on the same route but different room id, reload the component.
        this.subscriptions.push(this.route.paramMap.subscribe(paramMap => {
            if (this.roomId !== paramMap.get('id')) {
                // TODO this is somewhat of a hack to reload the component. Consider finding another way.
                void this.ngOnDestroy().then(() => this.ngOnInit());
            }
        }));

        // Join room if everything is fine
        const success = await this.#roomService.joinRoom(this.roomDbId);

        this.subscriptions.push(
            this.#roomService.usersSubject.subscribe(this.roomUsers)
        );

        // Go back to home if cannot join room
        if (!success) {
            await this.redirectToHome();
        }
    }

    /**
     * When component is destroyed,
     * Unsubscribe from events.
     * Leave room.
     */
    async ngOnDestroy(): Promise<void> {
        this.subscriptions.forEach(x => x.unsubscribe());
        this.subscriptions = [];
        this.log.info('ngOnDestroy');
        await this.#roomService.leaveRoom();
    }

    private async redirectToHome(): Promise<void> {
        await this.router.navigate(['']);
    }

    private async redirectToLoginIfNeeded(): Promise<void> {
        if (!this.auth.user) {
            this.log.warn('User is logged out, navigate to login.');
            await this.router.navigate(['login']);
        }
    }
}
