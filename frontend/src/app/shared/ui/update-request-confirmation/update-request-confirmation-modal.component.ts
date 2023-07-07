import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';


@Component({
  selector: 'dl-update-request-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-request-confirmation-modal.component.html',
})
export class UpdateRequestConfirmationModalComponent {



  constructor(@Inject(MAT_DIALOG_DATA) public data: { result: any, updateSuccessMessage: string }, public dialogRef: MatDialogRef<UpdateRequestConfirmationModalComponent>) {
  }

  onDismiss(): void {
    this.dialogRef.close();
  }

}
