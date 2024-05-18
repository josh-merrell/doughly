import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

interface ModalInstance {
  ref: MatDialogRef<any>;
  level: number;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modals: ModalInstance[] = [];

  constructor(private dialog: MatDialog) {}

  open<T>(component: ComponentType<T>, config: any, level: number = 1, allowMultipleSameLevel: boolean = false): MatDialogRef<T> | null {
    if (this.isLevelOpen(level) && !allowMultipleSameLevel) {
      console.warn(`A modal at level ${level} is already open.`);
      return null;
    }

    const dialogRef = this.dialog.open(component, config);
    this.modals.push({ ref: dialogRef, level: allowMultipleSameLevel ? 99 : level }); // push notifications or other modals we are okay having multiples of to 99, only one of each other modal type
    console.log(`MODALS: `, this.modals)

    dialogRef.afterClosed().subscribe(() => {
      this.modals = this.modals.filter(m => m.ref !== dialogRef);
      console.log(`MODALS: `, this.modals)
    });

    return dialogRef;
  }

  isLevelOpen(level: number): boolean {
    return this.modals.some(m => m.level === level);
  }

  closeByLevel(level: number): void {
    this.modals
      .filter(m => m.level === level)
      .forEach(m => m.ref.close());
  }

  closeAll(): void {
    this.modals.forEach(m => m.ref.close());
    this.modals = [];
  }
}
