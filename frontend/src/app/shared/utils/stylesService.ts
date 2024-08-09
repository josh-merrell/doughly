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
    'tan-1': '#26221C', 
    'tan-2': '#423C33', 
    'tan-3': '#50493F', 
    'tan-4': '#615B51', 
    'tan-5': '#847C71', 
    'tan-6': '#A49D94', 
    'tan-7': '#B9B1A7', 
    'tan-8': '#D4CDC4', 
    'tan-9': '#E9E6E2', 
    'tan-10': '#f9f8f5',  
    'pinknew-1': '#651B2D',
    'pinknew-2': '#942944',
    'pinknew-3': '#C0355A',
    'pinknew-4': '#D55879',
    'pinknew-5': '#DE7D9A',
    'pinknew-6': '#E499B5',
    'pinknew-7': '#E7ABC7',
    'pinknew-8': '#EABED4',
    'pinknew-9': '#EECDDE',
    'pinknew-10': '#F4E6ED',
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
    'green-1': '#2F3F1A',
    'green-2': '#475B24',
    'green-3': '#586B29',
    'green-4': '#6A762D',
    'green-5': '#7B8131',
    'green-6': '#8d8c34',
    'green-7': '#A2963A',
    'green-8': '#C4B964',
    'green-9': '#DDD6A7',
    'green-10': '#F2F0E3',
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
        this.setColor('#26221C', 'dark');
        if (Capacitor.isNativePlatform()) {
          this.setStatusBarStyle(Style.Dark);
        }
        break;
      case 'Disabled' ||
        ('System Default' && !this.extraStuffService.systemDarkMode()):
        this.setColor('#E9E6E2', 'light');
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
