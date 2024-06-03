import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DarkMode } from '@aparajita/capacitor-dark-mode';
import { AuthService } from './authenticationService';
import { StylesService } from './stylesService';

@Injectable({
  providedIn: 'root',
})
export class ExtraStuffService {
  public stateToLoad: WritableSignal<string> = signal('');
  public onboardingPublicRecipe: WritableSignal<number> = signal(0);
  public onboardingSubscribedRecipe: WritableSignal<number> = signal(0);
  public onboardingVisionRecipe: WritableSignal<number> = signal(0);
  public systemDarkMode: WritableSignal<boolean> = signal(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private stylesService: StylesService
  ) {
  }

  public getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    const useDarkMode =
      darkMode === 'Enabled' ||
      (darkMode === 'System Default' && this.systemDarkMode());
    console.log(
      `USE DARK MODE: ${useDarkMode}, SYSTEM: ${this.systemDarkMode()}`
    );
    switch (index) {
      case 1:
        return useDarkMode ? '#E4E7EB' : '#323F4B';
      case 2:
        return useDarkMode ? '#F5F7FA' : '#1F2933';
      case 3:
        return useDarkMode ? '#9AA5B1' : '#52606D';
      case 4:
        return useDarkMode ? '#CBD2D9' : '#3E4C59';
      case 5:
        return useDarkMode ? '#B3ECFF' : '#0B569A3';
      case 6:
        return useDarkMode
          ? this.stylesService.getHex('pink-4')
          : this.stylesService.getHex('pink-7');
      case 7:
        return useDarkMode ? '#27AB83' : '#3EBD93';
      case 8:
        return useDarkMode ? '#BC0A6F' : '#F364A2';
      case 9:
        return useDarkMode
          ? this.stylesService.getHex('grey-1')
          : this.stylesService.getHex('grey-10');
      case 10:
        return useDarkMode
          ? this.stylesService.getHex('grey-8')
          : this.stylesService.getHex('grey-3');
      case 11:
        return useDarkMode ? '#40C3F7' : '#2BB0ED';
      case 12:
        return useDarkMode
          ? this.stylesService.getHex('grey-2')
          : this.stylesService.getHex('grey-8');
      case 13:
        return useDarkMode
          ? this.stylesService.getHex('grey-9')
          : this.stylesService.getHex('grey-3');
      case 14:
        return useDarkMode
          ? this.stylesService.getHex('blue-8')
          : this.stylesService.getHex('blue-9');
      case 15:
        return useDarkMode
          ? this.stylesService.getHex('blue-2')
          : this.stylesService.getHex('blue-9');
      case 16:
        return useDarkMode
          ? this.stylesService.getHex('grey-8')
          : this.stylesService.getHex('grey-2');
      case 17:
        return useDarkMode
          ? this.stylesService.getHex('pink-7')
          : this.stylesService.getHex('pink-4');
      case 18:
        return useDarkMode
          ? this.stylesService.getHex('grey-10')
          : this.stylesService.getHex('grey-1');
      case 19:
        return useDarkMode
          ? this.stylesService.getHex('grey-7')
          : this.stylesService.getHex('grey-4');
      default:
        return useDarkMode ? '#CBD2D9' : '#3E4C59';
    }
  }
}
