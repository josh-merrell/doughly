import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectDeleting, selectError } from '../../state/tool-selectors';
import { ToolActions } from '../../state/tool-actions';

@Component({
  selector: 'dl-delete-tool-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-tool-modal.component.html',
})
export class DeleteToolModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
  }

  onSubmit(): void {
    this.store.dispatch(
      ToolActions.deleteTool({
        toolID: this.data.itemID,
      })
    );

    // Watch for updates to the deleting state after dispatching the action
    this.deletingSubscription = this.store
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
    if (this.deletingSubscription) {
      this.deletingSubscription.unsubscribe();
    }
  }
}
