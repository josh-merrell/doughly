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
import {
  selectDeleting,
  selectError,
} from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { selectIngredientByID } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-delete-recipe-ingredient-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-ingredient-modal.component.html',
})
export class DeleteRecipeIngredientModalComponent {
  isDeleting: boolean = false;
  private deletingSubscription!: Subscription;
  ingredient: any;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    this.store
      .select(selectIngredientByID(this.data.ingredientID))
      .subscribe((ingredient) => {
        this.ingredient = ingredient;
      });
  }

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      RecipeIngredientActions.deleteRecipeIngredient({
        recipeIngredientID: this.data.recipeIngredientID,
      })
    );

    // Initiate the subscription after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeleting)
      .pipe(filter((deleting) => !deleting))
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Recipe Ingredient deletion failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                3,
                true
              );
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
