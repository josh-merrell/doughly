import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { IngredientActions } from '../../state/ingredient-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectDeleting, selectError } from '../../state/ingredient-selectors';
import { Observable, Subscription, filter } from 'rxjs';

@Component({
  selector: 'dl-delete-ingredient-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-ingredient-modal.component.html',
})
export class DeleteIngredientModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
  }

  onSubmit(): void {
    this.store.dispatch(
      IngredientActions.deleteIngredient({
        ingredientID: this.data.itemID,
      })
    );

    // Initiate the subscription after dispatching the action
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
