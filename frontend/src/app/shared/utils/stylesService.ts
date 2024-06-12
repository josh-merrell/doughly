import {
  Injectable,
  Injector,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import { ExtraStuffService } from './extraStuffService';

interface ModalInstance {
  ref: MatDialogRef<any>;
  level: number;
}

@Injectable({
  providedIn: 'root',
})
export class StylesService {
  private profile: WritableSignal<any> = signal(null);
  private extraStuffService!: ExtraStuffService;
  private colorClasses = {
    'blue-1': '#035388',
    'blue-2': '#0B69A3',
    'blue-3': '#127FBF',
    'blue-4': '#1992D4',
    'blue-5': '#2BB0ED',
    'blue-6': '#40C3F7',
    'blue-7': '#5ED0FA',
    'blue-8': '#81DEFD',
    'blue-9': '#B3ECFF',
    'blue-10': '#E3F8FF',
    'grey-1': '#1F2933',
    'grey-2': '#323F4B',
    'grey-3': '#3E4C59',
    'grey-4': '#52606D',
    'grey-5': '#616E7C',
    'grey-6': '#7B8794',
    'grey-7': '#9AA5B1',
    'grey-8': '#CBD2D9',
    'grey-9': '#E4E7EB',
    'grey-10': '#F5F7FA',
    'pink-1': '#620042',
    'pink-2': '#870557',
    'pink-3': '#A30664',
    'pink-4': '#BC0A6F',
    'pink-5': '#DA127D',
    'pink-6': '#E8368F',
    'pink-7': '#F364A2',
    'pink-8': '#FF8CBA',
    'pink-9': '#FFB8D2',
    'pink-10': '#FFE3EC',
    'teal-1': '#014D40',
    'teal-2': '#0C6B58',
    'teal-3': '#147D64',
    'teal-4': '#199473',
    'teal-5': '#27AB83',
    'teal-6': '#3EBD93',
    'teal-7': '#65D6AD',
    'teal-8': '#8EEDC7',
    'teal-9': '#C6F7E2',
    'teal-10': '#EFFCF6',
    'red-1': '#610316',
    'red-2': '#8A041A',
    'red-3': '#AB091E',
    'red-4': '#CF1124',
    'red-5': '#E12D39',
    'red-6': '#EF4E4E',
    'red-7': '#F86A6A',
    'red-8': '#FF9B9B',
    'red-9': '#FFBDBD',
    'red-10': '#FFE3E3',
    'yellow-1': '#8D2B0B',
    'yellow-2': '#B44D12',
    'yellow-3': '#CB6E17',
    'yellow-4': '#DE911D',
    'yellow-5': '#F0B429',
    'yellow-6': '#F7C948',
    'yellow-7': '#FADB5F',
    'yellow-8': '#FCE588',
    'yellow-9': '#FFF3C4',
    'yellow-10': '#FFFBEA',
  };

  constructor(private store: Store, private injector: Injector) {
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.updateStyles();
      }
    });
  }

  ngOnInit(): void {
    this.extraStuffService = this.injector.get(ExtraStuffService);
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
  }

  public updateStyles(color: string = '', style: string = ''): void {
    // updates UI styles of nav/status bars for android and ios
    // updates color of nav/status bars for android (ios is handled with css)

    if (color) {
      this.setColor(color, style);
      if (Capacitor.isNativePlatform()) {
        if (style) {
          this.setStatusBarStyle(style === 'dark' ? Style.Dark : Style.Light);
        } else {
          this.setStatusBarStyle(Style.Light);
        }
      }
      return;
    } else {
      if (!this.profile()) {
        return;
      }
    }

    switch (this.profile['darkMode']) {
      case 'Enabled' ||
        ('System Default' && this.extraStuffService.systemDarkMode()):
        this.setColor('#1F2933', 'dark');
        if (Capacitor.isNativePlatform()) {
          this.setStatusBarStyle(Style.Dark);
        }
        break;
      case 'Disabled' ||
        ('System Default' && !this.extraStuffService.systemDarkMode()):
        this.setColor('#FFFFFF', 'light');
        if (Capacitor.isNativePlatform()) {
          this.setStatusBarStyle(Style.Light);
        }
        break;
      default:
        break;
    }
  }

  setColor(color: string, navBarButtonStyle: string): void {
    NavigationBar.setColor({
      color: color,
      darkButtons: navBarButtonStyle !== 'dark',
    });
    if (Capacitor.isNativePlatform()) {
      StatusBar.setBackgroundColor({
        color: color,
      });
    }
  }

  setStatusBarStyle(style: Style): void {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({
        style: style,
      });
    }
  }

  getHex(className: string): string {
    return this.colorClasses[className];
  }
}
