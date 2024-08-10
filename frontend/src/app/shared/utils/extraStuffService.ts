import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './authenticationService';
import { StylesService } from './stylesService';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExtraStuffService {
  private API_URL = `${environment.BACKEND}/`;
  public stateToLoad: WritableSignal<string> = signal('');
  public onboardingPublicRecipe: WritableSignal<number> = signal(0);
  public onboardingSubscribedRecipe: WritableSignal<number> = signal(0);
  public onboardingVisionRecipe: WritableSignal<number> = signal(0);
  public systemDarkMode: WritableSignal<boolean> = signal(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private stylesService: StylesService
  ) {}

  public logUserDataLoaded(): void {
    const profile = this.authService.profile();
    this.http
      .post(`${this.API_URL}profiles/loaded/${profile?.user_id}`, {})
      .subscribe();
  }

  public getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    const useDarkMode =
      darkMode === 'Enabled' ||
      (darkMode === 'System Default' && this.systemDarkMode());
    switch (index) {
      case 1:
        return useDarkMode ? this.stylesService.getHex('tan-9') : this.stylesService.getHex('tan-2');
      case 2:
        return useDarkMode ? this.stylesService.getHex('tan-10') : this.stylesService.getHex('tan-1');
      case 3:
        return useDarkMode ? this.stylesService.getHex('tan-7') : this.stylesService.getHex('tan-4');
      case 4:
        return useDarkMode ? this.stylesService.getHex('tan-8') : this.stylesService.getHex('tan-3');
      case 5:
        return useDarkMode
          ? this.stylesService.getHex('green-9')
          : this.stylesService.getHex('green-2');
      case 6:
        return useDarkMode
          ? this.stylesService.getHex('pinknew-4')
          : this.stylesService.getHex('pinknew-7');
      case 7:
        return useDarkMode ? this.stylesService.getHex('teal-5') : this.stylesService.getHex('teal-6');
      case 8:
        return useDarkMode ? this.stylesService.getHex('pinknew-4') : this.stylesService.getHex('pinknew-6');
      case 9:
        return useDarkMode
          ? this.stylesService.getHex('tan-1')
          : this.stylesService.getHex('tan-10');
      case 10:
        return useDarkMode
          ? this.stylesService.getHex('tan-8')
          : this.stylesService.getHex('tan-3');
      case 11:
        return useDarkMode
          ? this.stylesService.getHex('green-6')
          : this.stylesService.getHex('green-5');
      case 12:
        return useDarkMode
          ? this.stylesService.getHex('tan-2')
          : this.stylesService.getHex('tan-8');
      case 13:
        return useDarkMode
          ? this.stylesService.getHex('tan-9')
          : this.stylesService.getHex('tan-3');
      case 14:
        return useDarkMode
          ? this.stylesService.getHex('green-8')
          : this.stylesService.getHex('green-9');
      case 15:
        return useDarkMode
          ? this.stylesService.getHex('green-2')
          : this.stylesService.getHex('green-9');
      case 16:
        return useDarkMode
          ? this.stylesService.getHex('tan-8')
          : this.stylesService.getHex('tan-2');
      case 17:
        return useDarkMode
          ? this.stylesService.getHex('pinknew-7')
          : this.stylesService.getHex('pinknew-4');
      case 18:
        return useDarkMode
          ? this.stylesService.getHex('tan-10')
          : this.stylesService.getHex('tan-1');
      case 19:
        return useDarkMode
          ? this.stylesService.getHex('tan-7')
          : this.stylesService.getHex('tan-4');
      case 20:
        return useDarkMode
          ? this.stylesService.getHex('red-8')
          : this.stylesService.getHex('red-4');
      case 21:
        return useDarkMode
          ? this.stylesService.getHex('tan-8')
          : this.stylesService.getHex('tan-8');
      case 22:
        return useDarkMode
        ? '#FFFFFF'
        : '000000'
      default:
        return useDarkMode ? this.stylesService.getHex('tan-8') : this.stylesService.getHex('tan-3');
    }
  }
}
