import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { IngredientActions } from '../../state/ingredient-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectDeleting } from '../../state/ingredient-selectors';
import { Observable, Subscription, filter } from 'rxjs';

@Component({
  selector: 'dl-delete-ingredient-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-ingredient-modal.component.html',
})
export class DeleteIngredientModalComponent {
  isDeleting$: Observable<boolean>;
  private BACKEND_URL = `${environment.BACKEND}`;
  private subscription!: Subscription;

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
    this.subscription = this.store
      .select(selectDeleting)
      .pipe(filter((deleting: boolean) => !deleting))
      .subscribe((_) => {
        this.dialogRef.close('success');
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
