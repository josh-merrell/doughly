import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectDeleting, selectError } from '../../state/tool-stock-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';

@Component({
  selector: 'dl-delete-tool-stock-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-tool-stock-modal.component.html',
})
export class DeleteToolStockModalComponent {
  isDeleting$: Observable<boolean>;
  private deleteSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
  }

  onSubmit(): void {
    this.store.dispatch(
      ToolStockActions.deleteToolStock({
        toolStockID: this.data.itemID,
      })
    );

    // Listen for updates to isDeleting after dispatching the action
    this.deleteSubscription = this.store
      .select(selectDeleting)
      .subscribe((deleting: boolean) => {
        if (!deleting) {
          this.store.select(selectError).subscribe((error) => {
            if (error) {
              this.dialogRef.close(error);
            } else {
              this.dialogRef.close('success');
            }
          });
        }
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
