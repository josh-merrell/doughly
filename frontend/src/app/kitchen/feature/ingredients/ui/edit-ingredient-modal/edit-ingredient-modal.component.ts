import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subscription,
  filter,
  take,
} from 'rxjs';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import {
  selectUpdating,
  selectError,
  selectIngredientByID,
  selectIngredients,
} from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import {
  positiveIntegerValidator,
} from 'src/app/shared/utils/formValidator';
import { IngredientActions } from '../../state/ingredient-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

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
  isUpdating: boolean = false;
  ingredients$!: Observable<Ingredient[]>;
  ingredients: Ingredient[] = [];
  ingredient$!: Observable<Ingredient>;
  originalIngredient!: any;
  form!: FormGroup;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);
  private updatingSubscription!: Subscription;
  private ingredientsSubscription: Subscription = new Subscription();
  public pUnit: WritableSignal<string> = signal('');

  constructor(
    public dialogRef: MatDialogRef<EditIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    this.ingredients$ = this.store.select(selectIngredients);

    // // Subscribe to the valueChanges observable of purchaseUnit form control
    // const purchaseUnitControl = this.form.get('purchaseUnit') as FormControl;
    // purchaseUnitControl.valueChanges.subscribe((newValue) => {
    //   // Update pUnit with the new value
    //   this.pUnit.set(newValue);
    // });
  }

  ngOnInit(): void {
    this.setForm();
    this.ingredient$ = this.store.select(
      selectIngredientByID(this.data.itemID)
    );

    this.ingredient$.subscribe((ingredient) => {
      this.originalIngredient = ingredient;
      this.form.patchValue({
        lifespanDays: ingredient.lifespanDays,
        purchaseUnit: ingredient.purchaseUnit,
        gramRatio: ingredient.gramRatio,
      });
      if (ingredient.brand) {
        this.form.patchValue({ brand: ingredient.brand });
      }
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

    this.isUpdating = true;
    this.store.dispatch(
      IngredientActions.editIngredient({ ingredient: updatedIngredient })
    );
    this.store
      .select(selectUpdating)
      .pipe(
        filter((updating) => !updating),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            console.error(
              `Ingredient update failed: ${error.message}, CODE: ${error.statusCode}`
            );
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
          this.isUpdating = false;
        });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    this.onSubmit();
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
