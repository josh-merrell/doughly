import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { RecipeCategoryActions } from '../../../../state/recipe-category/recipe-category-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectDeleting,
  selectError,
} from '../../../../state/recipe-category/recipe-category-selectors';
import { Observable, Subscription, filter } from 'rxjs';

@Component({
  selector: 'dl-delete-recipe-category-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-category-modal.component.html',
})
export class DeleteRecipeCategoryModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeCategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeCategoryActions.deleteRecipeCategory({
        recipeCategoryID: this.data.recipeCategoryID,
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
