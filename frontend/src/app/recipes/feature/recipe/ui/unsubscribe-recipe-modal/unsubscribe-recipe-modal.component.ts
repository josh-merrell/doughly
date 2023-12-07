import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectDeleting, selectError, selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';


@Component({
  selector: 'dl-unsubscribe-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './unsubscribe-recipe-modal.component.html',
})
export class UnsubscribeRecipeModalComponent {
  isDeleting$!: Observable<boolean>;
  private deletingSubscription!: Subscription;
  public recipeTitle: WritableSignal<string> = signal('');
  public authorName: WritableSignal<string> = signal('');

  constructor(
    public dialogRef: MatDialogRef<UnsubscribeRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.isDeleting$ = this.store.select(selectDeleting);
    this.recipeTitle.set(this.data.title);
    this.authorName.set(this.data.authorName);
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeActions.deleteRecipeSubscription({
        subscriptionID: this.data.subscriptionID,
      })
    );

    this.deletingSubscription = this.store
      .select(selectDeleting)
      .subscribe((deleting) => {
        if (!deleting) {
          this.store.select(selectError).subscribe((error) => {
            if (error) {
              this.dialogRef.close(error);
            } else {
              this.store.dispatch(RecipeActions.loadRecipes());
              this.store.dispatch(RecipeActions.loadRecipeSubscriptions());
              this.store.dispatch(
                RecipeIngredientActions.loadRecipeIngredients()
              );
              this.store.dispatch(RecipeToolActions.loadRecipeTools());
              this.store.dispatch(StepActions.loadSteps());
              this.store.dispatch(RecipeStepActions.loadRecipeSteps());
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
