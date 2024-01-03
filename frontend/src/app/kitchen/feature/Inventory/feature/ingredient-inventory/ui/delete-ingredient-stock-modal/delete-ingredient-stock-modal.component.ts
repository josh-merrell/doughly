import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectDeleting,
  selectError,
} from '../../state/ingredient-stock-selectors';
import { Observable, Subscription, filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-delete-ingredient-stock-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-ingredient-stock-modal.component.html',
})
export class DeleteIngredientStockModalComponent {
  isDeleting: boolean = false;
  private deleteSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DeleteIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog
  ) {}

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      IngredientStockActions.deleteIngredientStock({
        ingredientStockID: this.data.itemID,
      })
    );
    // Listen for updates to isDeleting after dispatching the action
    this.deleteSubscription = this.store
      .select(selectDeleting)
      .pipe(
        filter((deleting: boolean) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            console.error(
              `Deleting Ingredient Stock failed: ${error.message}, CODE: ${error.statusCode}`
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
    if (this.deleteSubscription) {
      this.deleteSubscription.unsubscribe();
    }
  }
}
