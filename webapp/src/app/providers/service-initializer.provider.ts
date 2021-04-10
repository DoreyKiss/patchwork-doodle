import { TranslateService } from '@ngx-translate/core';
import { Provider, APP_INITIALIZER } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

function initializeServices(
    translate: TranslateService,
    storage: LocalStorageService
) {
    return async (): Promise<void> => {
        translate.setDefaultLang('en');
        const promises: Promise<void>[] = [
            translate.use(storage.uiLanguage).toPromise(),
        ];
        await Promise.all(promises);
    };
}

export const ServiceInitializer: Provider = {
    provide: APP_INITIALIZER,
    useFactory: initializeServices,
    deps: [TranslateService, LocalStorageService],
    multi: true
};
