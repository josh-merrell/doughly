import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-add-request-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-request-confirmation-modal.component.html',
})
export class AddRequestConfirmationModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { error: any; addSuccessMessage: string },
    public dialogRef: MatDialogRef<AddRequestConfirmationModalComponent>
  ) {
  }

  onDismiss(): void {
    this.dialogRef.close();
  }
}
