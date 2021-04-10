import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { LOCAL_STORAGE, StorageService as NgxStorageService } from 'ngx-webstorage-service';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    get uiLanguage(): string { return this.getOrSet('uiLanguage', 'en'); }
    set uiLanguage(value: string) { this.set('uiLanguage', value); }

    constructor(
        @Inject(LOCAL_STORAGE) private localStorage: NgxStorageService
    ) { }

    private set(key: string, value: string): void {
        this.localStorage.set(key, value);
    }

    private getOrSet(key: string, defaultValue: string): string {
        let result: string;
        if (this.localStorage.has(key)) {
            result = this.localStorage.get(key);
        } else {
            this.localStorage.set(key, defaultValue);
            result = defaultValue;
        }
        return result;
    }
}
