import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-delete-request-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-request-error-modal.component.html',
})
export class DeleteRequestErrorModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { error: any; deleteFailureMessage: string },
    public dialogRef: MatDialogRef<DeleteRequestErrorModalComponent>
  ) {}

  onDismiss(): void {
    this.dialogRef.close();
  }
}
