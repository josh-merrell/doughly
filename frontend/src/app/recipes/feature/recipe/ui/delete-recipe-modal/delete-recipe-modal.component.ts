import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectDeleting, selectError, selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'dl-delete-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-modal.component.html',
})
export class DeleteRecipeModalComponent {
  isDeleting$!: Observable<boolean>;
  private deletingSubscription!: Subscription;
  public recipe$!: Observable<any>;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {}
  
  ngOnInit(): void {
    this.isDeleting$ = this.store.select(selectDeleting);
    this.recipe$ = this.store.select(selectRecipeByID(this.data.recipeID));
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeActions.deleteRecipe({
        recipeID: this.data.recipeID,
      })
    );

    // Initiate the subscription after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeleting)
      .subscribe((deleting) => {
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
