import { Component, Input, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UpdateRequestErrorModalComponent } from '../update-request-error/update-request-error-modal.component';
import { UpdateRequestConfirmationModalComponent } from '../update-request-confirmation/update-request-confirmation-modal.component';

@Component({
  selector: 'dl-table-full',
  standalone: true,
  imports: [CommonModule, UpdateRequestErrorModalComponent, UpdateRequestConfirmationModalComponent],
  templateUrl: './dl-table-full.component.html',
})
export class TableFullComponent {
  @Input() title!: string;
  @Input() heading_phrase!: string;
  @Input() button_title!: string;
  @Input() columns!: any[];
  @Input() rows!: any[];
  @Input() editModalComponent!: Type<any>;
  @Input() IDKey!: string;

  constructor(public dialog: MatDialog) {}

  openEditDialog(itemID: number): void {
    const dialogRef = this.dialog.open(this.editModalComponent, {
      data: {
        itemID: itemID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof Error) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: { error: result },
        });
      } else if (result) {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: { result: result },
        });
      }
    });
  }
}
