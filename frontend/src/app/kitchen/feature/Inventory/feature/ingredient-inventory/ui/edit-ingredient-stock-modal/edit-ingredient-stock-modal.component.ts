import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectIngredientStockByID } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { Store, select } from '@ngrx/store';
import {
  Observable,
  Subscription,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';
import { IngredientStock } from '../../state/ingredient-stock-state';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import {
  selectError,
  selectIngredientByID,
  selectUpdating,
} from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
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
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

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
  isUpdating: boolean = false;
  // ingredientStock$!: Observable<IngredientStock>;
  ingredientStock: WritableSignal<IngredientStock | null> = signal(null);
  form!: FormGroup;
  submittingChanges: boolean = false;
  ingredient: WritableSignal<Ingredient | null> = signal(null);
  // ingredient$!: Observable<Ingredient>;
  originalIngredientStock!: any;

  private updatingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    this.setForm();
    effect(
      () => {
        const ingredientStock = this.ingredientStock();
        if (ingredientStock) {
          this.store
            .select(selectIngredientByID(ingredientStock.ingredientID))
            .subscribe((ingredient) => {
              this.ingredient.set(ingredient);
            });
        }
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const ingredientStock = this.ingredientStock();
      const ingredient = this.ingredient();

      if (ingredientStock && ingredient) {
        const newMeasurement = (
          ingredientStock.grams / ingredient.gramRatio
        ).toFixed(2);
        this.form.patchValue({
          purchasedDate: ingredientStock.purchasedDate,
          measurement: newMeasurement,
        });
      }
    });
  }

  setForm() {
    this.form = this.fb.group({
      purchasedDate: ['', Validators.required],
      measurement: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  ngOnInit(): void {
    this.store
      .pipe(select(selectIngredientStockByID(this.data.itemID)))
      .subscribe((ingredientStock) => {
        this.ingredientStock.set(ingredientStock);
        this.originalIngredientStock = ingredientStock;
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

    if (this.ingredient()) {
      for (let key in formValues) {
        if (key === 'measurement') {
          updatedIngredientStock['grams'] =
            parseFloat(formValues[key]) * this.ingredient()!.gramRatio;
        } else if (
          key in this.originalIngredientStock &&
          formValues[key] !== this.originalIngredientStock[key]
        ) {
          if (key === 'purchasedBy') {
            updatedIngredientStock[key] = parseInt(formValues[key], 10);
          } else if (key === 'purchasedDate') {
            updatedIngredientStock[key] = new Date(
              formValues[key]
            ).toISOString();
          } else {
            updatedIngredientStock[key] = formValues[key];
          }
        }
      }

      this.isUpdating = true;
      this.store.dispatch(
        IngredientStockActions.updateIngredientStock({
          ingredientStock: updatedIngredientStock,
        })
      );
      this.store
        .select(selectUpdating)
        .pipe(
          filter((updating: boolean) => !updating),
          take(1)
        )
        .subscribe(() => {
          this.store.select(selectError).subscribe((error) => {
            if (error) {
              console.error(
                `Updating Ingredient Stock failed: ${error.message}, CODE: ${error.statusCode}`
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
            this.isUpdating = false;
          });
        });
    }
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
