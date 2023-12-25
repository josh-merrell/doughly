import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';


@Component({
  selector: 'dl-update-request-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-request-error-modal.component.html'
})
export class UpdateRequestErrorModalComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { error: any, updateFailureMessage: string }, public dialogRef: MatDialogRef<UpdateRequestErrorModalComponent>) {
   }

  onDismiss(): void {
    this.dialogRef.close();
  }
}
