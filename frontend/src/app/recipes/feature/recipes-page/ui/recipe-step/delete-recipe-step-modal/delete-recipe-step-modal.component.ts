import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  selectDeletingRecipeStep,
  selectErrorRecipeStep,
  selectRecipeStepByID,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';


@Component({
  selector: 'dl-delete-recipe-step-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-step-modal.component.html',
})
export class DeleteRecipeStepModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;
  step: any;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeStepModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
  ) {
    this.isDeleting$ = this.store.select(selectDeletingRecipeStep);
    this.step = this.data.recipeStep;
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeStepActions.deleteRecipeStep({
        recipeStepID: this.data.recipeStep.recipeStepID,
      })
    );

    // Initiate the subscription after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeletingRecipeStep)
      .subscribe((deleting) => {
        if (!deleting) {
          this.store.select(selectErrorRecipeStep).subscribe((error) => {
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
