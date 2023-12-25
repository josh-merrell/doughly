import { InjectionToken } from '@angular/core';

export const localStorageToken = new InjectionToken<any>('localStorage', {
  providedIn: 'root',
  factory: () => localStorage
});