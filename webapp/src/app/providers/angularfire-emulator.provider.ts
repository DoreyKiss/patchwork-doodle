import { USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/database';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/functions';
import { environment } from 'src/environments/environment';

export const AngularFireEmulatorProviders = [
    { provide: USE_DATABASE_EMULATOR, useValue: environment.production ? undefined : ['localhost', 9000] },
    { provide: USE_FIRESTORE_EMULATOR, useValue: environment.production ? undefined : ['localhost', 8080] },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.production ? undefined : ['localhost', 5001] },
];
