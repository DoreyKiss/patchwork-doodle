import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'Patchwork doodle';

    constructor(public authService: AuthService) { }

    async loginClick(): Promise<void> {
        await this.authService.loginAnonymously();
    }

    async logoutClick(): Promise<void> {
        await this.authService.logout();
    }
}
