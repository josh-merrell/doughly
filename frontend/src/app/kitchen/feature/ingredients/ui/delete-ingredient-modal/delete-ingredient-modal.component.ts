import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { IngredientActions } from '../../state/ingredient-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectDeleting, selectError } from '../../state/ingredient-selectors';
import { Observable, Subscription, filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-delete-ingredient-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-ingredient-modal.component.html',
})
export class DeleteIngredientModalComponent {
  isDeleting: boolean = false;
  private deletingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog
  ) {}

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      IngredientActions.deleteIngredient({
        ingredientID: this.data.itemID,
      })
    );
    // Initiate the subscription after dispatching the action
    this.store
      .select(selectDeleting)
      .pipe(
        filter((deleting: boolean) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            console.error(
              `Deleting Ingredient failed: ${error.message}, CODE: ${error.statusCode}`
            );
            this.dialog.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                message: error.message,
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
    if (this.deletingSubscription) {
      this.deletingSubscription.unsubscribe();
    }
  }
}
