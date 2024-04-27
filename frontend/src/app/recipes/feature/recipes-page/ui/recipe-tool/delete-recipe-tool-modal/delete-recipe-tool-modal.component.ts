import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, filter, take } from 'rxjs';
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
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-delete-recipe-tool-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-tool-modal.component.html',
})
export class DeleteRecipeToolModalComponent {
  isDeleting: boolean = false;
  private deletingSubscription!: Subscription;
  tool: any;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog
  ) {
    if (this.data.toolID) {
      this.store.select(selectToolByID(this.data.toolID)).subscribe((tool) => this.tool = tool);
    } else {
      this.tool = { name: 'dummy'}
    }
  }

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      RecipeToolActions.deleteRecipeTool({
        recipeToolID: this.data.recipeToolID,
      })
    );

    // Initiate the subscription after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeleting)
      .pipe(filter((isDeleting) => !isDeleting), take(1)).subscribe(() => {
        this.store.select(selectError).pipe(take(1)).subscribe((error) => {
          if (error) {
            console.error(`Error deleting recipe tool: ${error.message}, CODE: ${error.statusCode}`);
            this.dialog.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                errorMessage: error.message,
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
