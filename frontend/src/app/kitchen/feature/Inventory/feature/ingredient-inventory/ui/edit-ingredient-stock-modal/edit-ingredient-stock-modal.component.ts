import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectIngredientStockByID } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, combineLatest, map, of, switchMap } from 'rxjs';
import { IngredientStock } from '../../state/ingredient-stock-state';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import { selectError, selectIngredientByID, selectUpdating } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { positiveFloatValidator } from 'src/app/shared/utils/formValidator';

@Component({
  selector: 'dl-edit-ingredient-stock-modal',
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
  templateUrl: './edit-ingredient-stock-modal.component.html',
})
export class EditIngredientStockModalComponent {
  ingredientStock$!: Observable<IngredientStock>;
  form!: FormGroup;
  submittingChanges: boolean = false;
  ingredient$!: Observable<Ingredient>;
  originalIngredientStock!: any;

  isUpdating$!: Observable<boolean>;

  private updatingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isUpdating$ = this.store.pipe(select(selectUpdating));
  }

  setForm() {
    this.form = this.fb.group({
      purchasedDate: ['', Validators.required],
      measurement: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  ngOnInit(): void {
    this.setForm();
    this.ingredientStock$ = this.store.pipe(
      select(selectIngredientStockByID(this.data.itemID))
    );

    this.ingredientStock$.subscribe((ingredientStock) => {
      this.originalIngredientStock = ingredientStock;
      this.form.patchValue({
        purchasedDate: ingredientStock.purchasedDate,
        measurement: ingredientStock.grams,
      });
    });
    
    const purchasedByControl = this.form.get('purchasedBy')!;
    const purchasedDateControl = this.form.get('purchasedDate')!;

    this.ingredientStock$
      .pipe(
        switchMap((ingredientStock) => {
          this.ingredient$ = this.store.pipe(
            select(selectIngredientByID(ingredientStock.ingredientID))
          );
          return combineLatest([of(ingredientStock), this.ingredient$]);
        })
      )
      .subscribe(([ingredientStock, ingredient]) => {
        const newMeasurement = (
          ingredientStock.grams / ingredient.gramRatio
        ).toFixed(2);

        this.form.patchValue({
          purchasedDate: ingredientStock.purchasedDate,
          measurement: newMeasurement,
        });
      });
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
    const updatedIngredientStock: any = {
      ingredientStockID: this.data.itemID,
    };

    const formValues = this.form.value;

    for (let key in formValues) { 
      if (key === 'measurement') {
        updatedIngredientStock['measurement'] = parseFloat(formValues[key]);
      } else if (
        key in this.originalIngredientStock &&
        formValues[key] !== this.originalIngredientStock[key]
      ) {
        if (key === 'purchasedBy') {
          updatedIngredientStock[key] = parseInt(formValues[key], 10);
        } else if (key === 'purchasedDate') {
          updatedIngredientStock[key] = new Date(formValues[key]).toISOString();
        } else {
          updatedIngredientStock[key] = formValues[key];
        }
      }
    }

    this.store.dispatch(
      IngredientStockActions.updateIngredientStock({ ingredientStock: updatedIngredientStock })
    );

    this.updatingSubscription = this.store
      .select(selectUpdating)
      .subscribe((updating: boolean) => {
        if (!updating) {
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
    if (this.updatingSubscription) {
      this.updatingSubscription.unsubscribe();
    }
  }
}
