import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  selectAdding,
  selectLoading,
} from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddIngredientModalComponent } from 'src/app/kitchen/feature/ingredients/ui/add-ingredient-modal/add-ingredient-modal.component';

@Component({
  selector: 'dl-add-recipe-ingredient-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AddIngredientModalComponent,
  ],
  templateUrl: './add-recipe-ingredient-modal.component.html',
})
export class AddRecipeIngredientModalComponent {
  ingredients$!: Observable<any[]>;
  ingredientsToExclude;
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);

  constructor(
    public dialogRef: MatDialogRef<AddRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    this.ingredients$ = this.store.select(selectIngredients);
    this.ingredientsToExclude = this.data.ingredientsToExclude;
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.setForm();
  }

  isIngredientExcluded(ingredientID: any): boolean {
    return this.ingredientsToExclude.includes(ingredientID);
  }

  setForm() {
    this.form = this.fb.group({
      ingredientID: ['', Validators.required],
      measurement: ['', Validators.required],
      measurementUnit: ['', Validators.required],
    });
  }

  onAddNewIngredient() {
    const dialogRef = this.dialog.open(AddIngredientModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: 'Ingredient added successfully!',
          },
        });
      } else if (result) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Failed to add Ingredient.',
          },
        });
      }
    });
  }

  onSubmit() {
    const formValue = this.form.value;
    const newRecipeIngredient = {
      ...formValue,
      measurement: parseFloat(formValue.measurement),
    };
    this.dialogRef.close(newRecipeIngredient);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
