import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-list-fulfilled-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-fulfilled-modal.component.html',
})
export class ListFulfilledModalComponent {
  constructor(public dialogRef: MatDialogRef<ListFulfilledModalComponent>) {}

  onDismiss(): void {
    this.dialogRef.close();
  }
}
