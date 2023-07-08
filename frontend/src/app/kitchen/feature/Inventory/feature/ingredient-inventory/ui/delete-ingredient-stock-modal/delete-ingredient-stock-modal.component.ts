import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'dl-delete-ingredient-stock-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-ingredient-stock-modal.component.html',
})
export class DeleteIngredientStockModalComponent {
  submittingChanges: boolean = false;
  private BACKEND_URL = `${environment.BACKEND}`;

  constructor(
    public dialogRef: MatDialogRef<DeleteIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private http: HttpClient
  ) {}

  onSubmit(): void {
    this.submittingChanges = true;
    this.http
      .delete(`${this.BACKEND_URL}/ingredientStocks/${this.data.itemID}`)
      .subscribe({
        next: () => {
          this.submittingChanges = false;
          //dispatch ingredientStock update action to refresh the state
          this.store.dispatch(IngredientStockActions.loadIngredientStocks());
          this.dialogRef.close('success');
        },
        error: (error) => {
          this.submittingChanges = false;
          this.dialogRef.close(error);
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
