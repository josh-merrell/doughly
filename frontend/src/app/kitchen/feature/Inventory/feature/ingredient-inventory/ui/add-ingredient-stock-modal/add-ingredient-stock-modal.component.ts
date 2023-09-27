import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, map } from 'rxjs';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import {
  selectAdding,
  selectError,
} from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import {
  selectIngredientByID,
  selectIngredients,
} from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { positiveFloatValidator } from 'src/app/shared/utils/formValidator';

@Component({
  selector: 'dl-add-ingredient-stock-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
  ],
  templateUrl: './add-ingredient-stock-modal.component.html',
})
export class AddIngredientStockModalComponent {
  form!: FormGroup;

  ingredients$!: Observable<Ingredient[]>;
  ingredient$!: Observable<Ingredient>;
  employees$!: Observable<any>;

  isAdding$: Observable<boolean>;

  private ingredientIDSubscription!: Subscription;
  private addingSubscription!: Subscription;
  private purchasedDateSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddIngredientStockModalComponent>,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isAdding$ = this.store.select(selectAdding);
  }

  setForm() {
    this.form = this.fb.group({
      ingredientID: ['', Validators.required],
      purchasedDate: ['', Validators.required],
      measurement: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  ngOnInit(): void {
    this.ingredients$ = this.store.select(selectIngredients);
    this.setForm();

    this.form.get('measurement')!.disable();

    //handle changes made to 'ingredientID' field
    this.ingredientIDSubscription = this.form
      .get('ingredientID')!
      .valueChanges.subscribe((ingredientID) => {
        if (ingredientID) {
          this.form.get('measurement')!.enable();
          this.ingredient$ = this.store.pipe(
            select(selectIngredientByID(ingredientID))
          );
        } else {
          this.form.get('measurement')!.disable();
        }
      });

  }

  ngOnDestroy(): void {
    if (this.ingredientIDSubscription) {
      this.ingredientIDSubscription.unsubscribe();
    }
    if (this.purchasedDateSubscription) {
      this.purchasedDateSubscription.unsubscribe();
    }
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }

  dateValidator(minDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      let controlDate = new Date(control.value);
      return controlDate < minDate
        ? { dateInvalid: { value: control.value } }
        : null;
    };
  }

  onSubmit(): void {
    const date = new Date(this.form.value.purchasedDate);

    const payload = {
      ...this.form.value,
      ingredientID: parseInt(this.form.value.ingredientID, 10),
      measurement: parseFloat(this.form.value.measurement),
      purchasedDate: date.toISOString(),
    }

    this.store.dispatch(IngredientStockActions.addIngredientStock({ ingredientStock: payload }));

    this.addingSubscription = this.store.select(selectAdding).subscribe((adding:boolean) => {
      if (!adding) {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            this.dialogRef.close(error);
          } else {
            this.dialogRef.close('success');
          }
        })
      }
    })
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
