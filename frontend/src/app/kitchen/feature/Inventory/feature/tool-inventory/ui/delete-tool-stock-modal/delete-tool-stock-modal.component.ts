import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, filter, take } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectDeleting, selectError } from '../../state/tool-stock-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-delete-tool-stock-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-tool-stock-modal.component.html',
})
export class DeleteToolStockModalComponent {
  isDeleting: boolean = false;
  private deleteSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog
  ) {}

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      ToolStockActions.deleteToolStock({
        toolStockID: this.data.itemID,
      })
    );
    // Listen for updates to isDeleting after dispatching the action
    this.store
      .select(selectDeleting)
      .pipe(
        filter((isDeleting) => !isDeleting),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            console.error(
              `Error deleting tool stock: ${error.message}, CODE: ${error.statusCode}`
            );
            this.dialog.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                errorMessage: error.message,
                statusCode: error.statusCode,
              },
            });
          } else {
            this.dialogRef.close('success');
          }
          this.isDeleting = false;
        });
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.deleteSubscription) {
      this.deleteSubscription.unsubscribe();
    }
  }
}
