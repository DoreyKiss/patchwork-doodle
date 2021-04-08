import { APP_INITIALIZER, NgModule, Provider } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { BrowserModule } from '@angular/platform-browser';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { firebaseConfig } from 'src/environments/firebase.config';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';
import { HttpClientModule } from '@angular/common/http';

function initializeServices(
    authService: AuthService,
    // functionsService: FunctionsService,
    // translate: TranslateService,
    // cookies: StorageService
) {
    return async (): Promise<void> => {
        // translate.setDefaultLang('en');
        const promises = [
            // translate.use(cookies.uiLanguage).toPromise(),
            // functionsService._init(),
            authService._init()
        ];
        await Promise.all(promises);
    };
}

const ServiceInitializer: Provider = {
    provide: APP_INITIALIZER,
    useFactory: initializeServices,
    deps: [AuthService /*, FunctionsService, TranslateService, StorageService*/],
    multi: true
};

const Logger = LoggerModule.forRoot({
    enableSourceMaps: !environment.production,
    level: environment.production ? NgxLoggerLevel.ERROR : NgxLoggerLevel.DEBUG,
    timestampFormat: 'yy-MM-dd HH:mm:ss'
});

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        Logger,
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFireAuthModule
    ],
    providers: [ServiceInitializer],
    bootstrap: [AppComponent]
})
export class AppModule { }
