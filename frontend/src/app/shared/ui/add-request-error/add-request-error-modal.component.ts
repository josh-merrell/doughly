import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-add-request-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-request-error-modal.component.html',
})
export class AddRequestErrorModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { error: any; addFailureMessage: string },
    public dialogRef: MatDialogRef<AddRequestErrorModalComponent>
  ) {
  }

  onDismiss(): void {
    this.dialogRef.close();
  }
}
