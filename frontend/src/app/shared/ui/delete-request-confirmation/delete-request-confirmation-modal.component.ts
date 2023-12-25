import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-delete-request-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-request-confirmation-modal.component.html',
})
export class DeleteRequestConfirmationModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { result: any; deleteSuccessMessage: string },
    public dialogRef: MatDialogRef<DeleteRequestConfirmationModalComponent>
  ) {}

  onDismiss(): void {
    this.dialogRef.close();
  }
}
