import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-modal.component.html',
})
export class ErrorModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { errorMessage: string; statusCode: number },
    public dialogRef: MatDialogRef<ErrorModalComponent>
  ) {}

  onDismiss(): void {
    this.dialogRef.close();
  }
}
