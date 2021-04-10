import { LoggerModule as NgxLoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { environment } from 'src/environments/environment';

export const LoggerModule = NgxLoggerModule.forRoot({
    enableSourceMaps: !environment.production,
    level: environment.production ? NgxLoggerLevel.ERROR : NgxLoggerLevel.DEBUG,
    timestampFormat: 'yy-MM-dd HH:mm:ss'
});
