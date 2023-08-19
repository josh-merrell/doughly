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
  selectDeleting,
  selectError,
} from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions'
import { selectToolByID } from 'src/app/kitchen/feature/tools/state/tool-selectors'

@Component({
  selector: 'dl-delete-recipe-tool-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-tool-modal.component.html',
})
export class DeleteRecipeToolModalComponent {
  isDeleting$: Observable<boolean>;
  private deletingSubscription!: Subscription;
  tool: any;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.isDeleting$ = this.store.select(selectDeleting);
    if (this.data.toolID) {
      this.store.select(selectToolByID(this.data.toolID)).subscribe((tool) => this.tool = tool);
    } else {
      this.tool = { name: 'dummy'}
    }
  }

  onSubmit(): void {
    this.store.dispatch(
      RecipeToolActions.deleteRecipeTool({
        recipeToolID: this.data.recipeToolID,
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
