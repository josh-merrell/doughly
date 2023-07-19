import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectIngredientStockByID } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { Store, select } from '@ngrx/store';
import {
  Observable,
  Subscription,
  combineLatest,
  map,
  of,
  switchMap,
} from 'rxjs';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import {
  selectUpdating,
  selectError,
  selectIngredientByID,
  selectIngredients,
  selectLoading,
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
import { selectEmployees } from 'src/app/employees/state/employee-selectors';
import { environment } from 'src/environments/environment';
import { Employee } from 'src/app/employees/state/employee-state';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import {
  nonDuplicateString,
  positiveIntegerValidator,
} from 'src/app/shared/utils/formValidator';
import { IngredientActions } from '../../state/ingredient-actions';

@Component({
  selector: 'dl-edit-ingredient-modal',
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
  templateUrl: './edit-ingredient-modal.component.html',
})
export class EditIngredientModalComponent {
  ingredients$!: Observable<Ingredient[]>;
  ingredients: Ingredient[] = [];
  ingredient$!: Observable<Ingredient>;
  originalIngredient!: any;
  form!: FormGroup;
  isEditing$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);
  private updatingSubscription!: Subscription;
  private ingredientsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<EditIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder
  ) {
    this.ingredients$ = this.store.select(selectIngredients);
    this.isEditing$ = this.store.select(selectUpdating);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.setForm();
    this.ingredient$ = this.store.select(
      selectIngredientByID(this.data.itemID)
    );

    this.ingredient$.subscribe((ingredient) => {
      this.originalIngredient = ingredient;
      this.form.patchValue({
        brand: ingredient.brand,
        lifespanDays: ingredient.lifespanDays,
        purchaseUnit: ingredient.purchaseUnit,
        gramRatio: ingredient.gramRatio,
      });
    });

    this.ingredientsSubscription = this.ingredients$.subscribe(
      (ingredients) => {
        this.ingredients = ingredients;
      }
    );
  }

  setForm() {
    this.form = this.fb.group({
      brand: ['', []],
      lifespanDays: ['', [Validators.required, positiveIntegerValidator()]],
      purchaseUnit: ['', [Validators.required]],
      gramRatio: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  onSubmit() {
    const updatedIngredient: any = {
      ingredientID: this.data.itemID,
      name: this.data.name,
    };

    const formValues = this.form.value;

    for (let key in formValues) {
      if (
        key in this.originalIngredient &&
        formValues[key] !== this.originalIngredient[key]
      ) {
        if (key === 'lifespanDays' || key === 'gramRatio') {
          updatedIngredient[key] = parseInt(formValues[key]);
        } else {
          updatedIngredient[key] = formValues[key];
        }
      }
    }

    this.store.dispatch(
      IngredientActions.editIngredient({ ingredient: updatedIngredient })
    );

    this.updatingSubscription = this.store
      .select(selectUpdating)
      .subscribe((updating) => {
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

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.ingredientsSubscription) {
      this.ingredientsSubscription.unsubscribe();
    }
    if (this.updatingSubscription) {
      this.updatingSubscription.unsubscribe();
    }
  }
}
