import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StylesService } from './stylesService';
import { AuthService } from './authenticationService';
import { ExtraStuffService } from './extraStuffService';

interface ModalInstance {
  ref: MatDialogRef<any>;
  level: number;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modals: ModalInstance[] = [];

  constructor(
    private dialog: MatDialog,
    private stylesService: StylesService,
    private authService: AuthService,
    private extraStuffService: ExtraStuffService
  ) {}

  open<T>(
    component: ComponentType<T>,
    config: any,
    level: number = 1,
    allowMultipleSameLevel: boolean = false
  ): MatDialogRef<T> | null {
    if (!component || component === null) {
      console.error(`No component ref provided, not opening modal.`);
      return null;
    }
    if (this.isLevelOpen(level) && !allowMultipleSameLevel) {
      console.warn(`A modal at level ${level} is already open.`);
      return null;
    }
    // if component is 'ErrorModalComponent' and there is already an error modal open, don't open another
    if (
      component.name === 'ErrorModalComponent' &&
      this.modals.some((m) => m.ref.componentInstance instanceof component)
    ) {
      console.warn(`An error modal is already open.`);
      return null;
    }

    const dialogRef = this.dialog.open(component, config);
    this.modals.push({
      ref: dialogRef,
      level: allowMultipleSameLevel ? 99 : level,
    }); // push notifications or other modals we are okay having multiples of to 99, only one of each other modal type
    this.setModalStyles();

    dialogRef.afterClosed().subscribe(() => {
      this.modals = this.modals.filter((m) => m.ref !== dialogRef);
      this.setModalStyles();
    });

    return dialogRef;
  }

  isLevelOpen(level: number): boolean {
    return this.modals.some((m) => m.level === level);
  }

  closeByLevel(level: number): void {
    this.modals.filter((m) => m.level === level).forEach((m) => m.ref.close());
    this.modals = this.modals.filter((m) => m.level !== level);
  }

  async setModalStyles(): Promise<void> {
    // determine highest level with a modal currently open
    let highestLevel = 0;
    this.modals.forEach((m) => {
      if (m.level > highestLevel) {
        highestLevel = m.level;
      }
    });
    const darkMode = this.authService.profile()?.darkMode;
    // also get current system pref using a service using DarkMode
    const systemDarkMode = this.extraStuffService.systemDarkMode();

    const useDarkMode =
      darkMode === 'Enabled' ||
      (darkMode === 'System Default' && systemDarkMode);
    // set color based on highest level
    switch (highestLevel) {
      case 1:
      case 99:
        if (useDarkMode === true) {
          this.stylesService.updateStyles('#141B23', 'dark');
        } else {
          this.stylesService.updateStyles('#ACACAC', 'light');
        }
        break;
      case 2:
        if (useDarkMode === true) {
          this.stylesService.updateStyles('#0D1114', 'dark');
        } else {
          this.stylesService.updateStyles('#6E6E6E', 'dark');
        }
        break;
      case 3:
        if (useDarkMode === true) {
          this.stylesService.updateStyles('#080A0C', 'dark');
        } else {
          this.stylesService.updateStyles('#3F3F3F', 'dark');
        }
        break;
      case 0:
        if (useDarkMode === true) {
          this.stylesService.updateStyles('#1F2933', 'dark');
        } else {
          this.stylesService.updateStyles('#FFFFFF', 'light');
        }
        break;
      default:
        break;
    }
  }

  closeAll(): void {
    this.modals.forEach((m) => m.ref.close());
    this.dialog.closeAll();
    this.modals = [];
  }

  setColor(color: string): void {}
}
