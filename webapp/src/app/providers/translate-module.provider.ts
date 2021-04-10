
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule as NgxTranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export const TranslateModule = NgxTranslateModule.forRoot({
    loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http),
        deps: [HttpClient]
    },
});
