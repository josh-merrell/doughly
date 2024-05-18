import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription, filter, take } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectDeleting, selectError } from '../../state/tool-selectors';
import { ToolActions } from '../../state/tool-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-delete-tool-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-tool-modal.component.html',
})
export class DeleteToolModalComponent {
  isDeleting: boolean = false;
  private deletingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {}

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      ToolActions.deleteTool({
        toolID: this.data.itemID,
      })
    );
    // Watch for updates to the deleting state after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeleting)
      .pipe(
        filter((isDeleting) => !isDeleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Error deleting tool: ${error.message}, CODE: ${error.code}`
              );
              this.modalService.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              }, 1, true);
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
    if (this.deletingSubscription) {
      this.deletingSubscription.unsubscribe();
    }
  }
}
