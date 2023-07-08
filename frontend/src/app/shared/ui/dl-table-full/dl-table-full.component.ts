import { Component, Input, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UpdateRequestErrorModalComponent } from '../update-request-error/update-request-error-modal.component';
import { UpdateRequestConfirmationModalComponent } from '../update-request-confirmation/update-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from '../delete-request-error/delete-request-error-modal.component';
import { DeleteRequestConfirmationModalComponent } from '../delete-request-confirmation/delete-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from '../add-request-error/add-request-error-modal.component';
import { AddRequestConfirmationModalComponent } from '../add-request-confirmation/add-request-confirmation-modal.component';
import { HttpErrorResponse } from '@angular/common/http';

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
  @Input() updateSuccessMessage!: string;
  @Input() updateFailureMessage!: string;
  @Input() deleteModalComponent!: Type<any>;
  @Input() deleteSuccessMessage!: string;
  @Input() deleteFailureMessage!: string;
  @Input() addModalComponent!: Type<any>;
  @Input() addSuccessMessage!: string;
  @Input() addFailureMessage!: string;

  constructor(public dialog: MatDialog) {
  }

  openEditDialog(itemID: number): void {
    const dialogRef = this.dialog.open(this.editModalComponent, {
      data: {
        itemID: itemID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: { 
            error: result, 
            updateFailureMessage: `${this.updateFailureMessage}`
          },
        });
      } else if (result) {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: { 
            result: result,
            updateSuccessMessage: `${this.updateSuccessMessage}: ${itemID}`,
          }
        });
      }
    });
  }

  openDeleteDialog(itemID: number): void {
    const dialogRef = this.dialog.open(this.deleteModalComponent, {
      data: {
        itemID: itemID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: { 
            error: result, 
            deleteFailureMessage: `${this.deleteFailureMessage}`
          },
        });
      } else if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `${this.deleteSuccessMessage}: ${itemID}`,
          }
        });
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(this.addModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: { 
            error: result, 
            addFailureMessage: `${this.addFailureMessage}`
          },
        });
      } else if (result) {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: { 
            result: result,
            addSuccessMessage: `${this.addSuccessMessage}`,
          }
        });
      }
    })

  }
}
