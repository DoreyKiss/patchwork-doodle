import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { BrowserModule } from '@angular/platform-browser';
import { firebaseConfig } from 'src/environments/firebase.config';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RoomBaseComponent } from './components/room-base/room-base.component';
import { AngularFireEmulatorProviders } from './providers/angularfire-emulator.provider';
import { FirebaseAuthProvider } from './providers/firebase-auth.provider';
import { LoggerModule } from './providers/logger-module.provider';
import { ServiceInitializer } from './providers/service-initializer.provider';
import { TranslateModule } from './providers/translate-module.provider';

@NgModule({
    declarations: [
        AppComponent,
        RoomBaseComponent,
        LoginComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        LoggerModule,
        TranslateModule,
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFireDatabaseModule,
    ],
    providers: [
        ServiceInitializer,
        FirebaseAuthProvider,
        ...AngularFireEmulatorProviders
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
