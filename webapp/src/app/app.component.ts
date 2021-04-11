import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { FunctionsService } from './services/functions.service';
import { LocalStorageService } from './services/local-storage.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Patchwork doodle';
    userName = '';

    private subscriptions: Subscription[] = [];

    constructor(
        public authService: AuthService,
        private translateService: TranslateService,
        private localStorageService: LocalStorageService,
        private router: Router,
        private functionsService: FunctionsService
    ) { }

    ngOnInit(): void {
        this.subscriptions.push(this.authService.userSubject.subscribe(u => this.userName = u?.displayName ?? ''));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(x => x.unsubscribe());
        this.subscriptions = [];
    }

    async login(): Promise<void> {
        await this.authService.loginAnonymously();
    }

    async logout(): Promise<void> {
        await this.authService.logout();
    }

    async updateUserDisplayName(): Promise<void> {
        await this.authService.updateDisplayName(this.userName);
    }

    async createRoom(): Promise<void> {
        const response = await this.functionsService.createRoom({
            name: 'test room',
            type: 'patchwork_doodle'
        }).toPromise();

        if (response.success) {
            await this.router.navigate([`${response.type}/${response.id}`]);
        }
        console.log(response);
    }

    async changeLanguage(code: string): Promise<void> {
        await this.translateService.use(code).toPromise();
        this.localStorageService.uiLanguage = code;
    }
}
