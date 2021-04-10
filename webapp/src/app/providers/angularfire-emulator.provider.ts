import { Provider } from '@angular/core';
import { USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/database';
import { REGION as REGION_FUNCTIONS, USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/functions';
import { environment } from 'src/environments/environment';

const angularFireEmulatorProviders: Provider[] = [
    { provide: USE_DATABASE_EMULATOR, useValue: environment.production ? undefined : ['localhost', 9000] },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.production ? undefined : ['localhost', 5001] },
];

if (environment.production) {
    // Connect to cloud functions in 'europe-west1' instead of 'us-central1' in production
    angularFireEmulatorProviders.push({ provide: REGION_FUNCTIONS, useValue: 'europe-west1' });
}

export { angularFireEmulatorProviders as AngularFireEmulatorProviders };
