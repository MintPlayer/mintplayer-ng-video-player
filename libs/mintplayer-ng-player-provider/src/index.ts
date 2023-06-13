import { InjectionToken } from "@angular/core";
import { BehaviorSubject } from 'rxjs';

export const VIDEO_APIS = new InjectionToken<IApiService>('VideoApis');

export interface IApiService {
    loadApi(): void;
    apiReady$: BehaviorSubject<boolean>;
}