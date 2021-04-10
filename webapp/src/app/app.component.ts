import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { FunctionsService } from './services/functions.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'Patchwork doodle';

    constructor(
        public authService: AuthService,
        private router: Router,
        private functionsService: FunctionsService
    ) { }

    async loginClick(): Promise<void> {
        await this.authService.loginAnonymously();
    }

    async logoutClick(): Promise<void> {
        await this.authService.logout();
    }

    async createRoomClick(): Promise<void> {
        const response = await this.functionsService.createRoom({
            name: 'test room',
            type: 'patchwork_doodle'
        }).toPromise();

        if (response.success) {
            await this.router.navigate([`${response.type}/${response.id}`]);
        }
        console.log(response);
    }
}
