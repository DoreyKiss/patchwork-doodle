import { Provider, APP_INITIALIZER } from '@angular/core';

function initializeServices(
    // authService: AuthService,
    // functionsService: FunctionsService,
    // translate: TranslateService,
    // cookies: StorageService
) {
    return async (): Promise<void> => {
        // translate.setDefaultLang('en');
        const promises: Promise<void>[] = [
            // translate.use(cookies.uiLanguage).toPromise(),
            // functionsService._init(),
            // authService._init()
        ];
        await Promise.all(promises);
    };
}

export const ServiceInitializer: Provider = {
    provide: APP_INITIALIZER,
    useFactory: initializeServices,
    deps: [/*AuthService , FunctionsService, TranslateService, StorageService*/],
    multi: true
};
