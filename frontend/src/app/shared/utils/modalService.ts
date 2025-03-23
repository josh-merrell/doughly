import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StylesService } from './stylesService';
import { AuthService } from './authenticationService';
import { ExtraStuffService } from './extraStuffService';
import { reflectComponentType } from '@angular/core';
import { Router, RouterLinkWithHref } from '@angular/router';
import { RedirectPathService } from './redirect-path.service';

interface ModalInstance {
  ref: MatDialogRef<any>;
  level: number;
  name?: string;
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
    private extraStuffService: ExtraStuffService,
    private redirectService: RedirectPathService,
    private router: Router
  ) {}

  open<T>(
    component: ComponentType<T>,
    config: any,
    level: number = 1,
    allowMultipleSameLevel: boolean = false,
    name: string = ''
  ): MatDialogRef<T> | null {
    if (!component || component === null) {
      console.error(`No component ref provided, not opening modal.`);
      return null;
    }
    // if provided component is equal to the component of an already open modal, don't open another
    if (
      this.modals.some((m) => {
        // if (m.ref.componentInstance.constructor === component) {
        if (m.name === name && allowMultipleSameLevel === false) {
          console.warn(
            `A modal of type ${name} is already open, returning`
          );
          return true;
        }
        return false;
      })
    ) {
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

    // need to manually apply our global modal styling (currently just border radius) to the divs wrapping the modal which are made by the mat-dialog-container element. For some reason, trying to use the documented approach of setting the panelClass on the MatDialogConfig doesn't work.
    dialogRef.afterOpened().subscribe(() => {
      const componentSelector = this.getComponentSelector(component);
      // const modalElement = document.querySelector('dl-view-list-shares-modal');
      const modalElement = document.querySelector(componentSelector || '');
      if (modalElement) {
        let parent = modalElement.parentElement;
        for (let i = 0; i < 2; i++) {
          if (parent) {
            parent.classList.add('modal-global-styling');
            parent = parent.parentElement;
          }
        }
      }
    });

    this.modals.push({
      ref: dialogRef,
      level: allowMultipleSameLevel ? 99 : level,
      name,
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

  private getComponentSelector<T>(component: ComponentType<T>): string | null {
    const metadata = reflectComponentType(component);
    return metadata?.selector || null;
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
          this.stylesService.updateStyles('#26221C', 'dark');
        } else {
          this.stylesService.updateStyles('#D4CDC4', 'light');
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
          this.stylesService.updateStyles('#26221c', 'dark');
        } else {
          this.stylesService.updateStyles('#e9e6e2', 'light');
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
