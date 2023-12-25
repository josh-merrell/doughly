import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectDeleting, selectError } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { selectIngredientByID } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors'

@Component({
  selector: 'dl-delete-recipe-ingredient-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-ingredient-modal.component.html',
})
export class DeleteRecipeIngredientModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;
  ingredient: any;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
    this.store.select(
      selectIngredientByID(this.data.ingredientID)).subscribe((ingredient) => {
        this.ingredient = ingredient;
      }
    );
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeIngredientActions.deleteRecipeIngredient({
        recipeIngredientID: this.data.recipeIngredientID,
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
