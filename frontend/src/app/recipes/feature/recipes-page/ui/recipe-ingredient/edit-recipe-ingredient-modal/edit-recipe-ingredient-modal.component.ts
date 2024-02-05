import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { positiveFloatValidator } from 'src/app/shared/utils/formValidator';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import {
  selectError,
  selectUpdating,
} from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { UnitService } from 'src/app/shared/utils/unitService';

@Component({
  selector: 'dl-edit-recipe-ingredient-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './edit-recipe-ingredient-modal.component.html',
})
export class EditRecipeIngredientModalComponent {
  isUpdating: boolean = false;
  form!: FormGroup;
  unitOptions: PurchaseUnit[] = Object.values(PurchaseUnit);
  public mUnit!: string;
  public pUnit!: string;
  public recipeIngredient!: WritableSignal<any>;
  public recipe!: WritableSignal<Recipe>;

  constructor(
    public dialogRef: MatDialogRef<EditRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService
  ) {}

  ngOnInit() {
    this.pUnit = this.data.recipeIngredient.purchaseUnit;
    this.recipeIngredient = signal(this.data.recipeIngredient);
    this.setForm();
    this.store
      .select(selectRecipeByID(this.data.recipeIngredient.recipeID))
      .subscribe((recipe) => {
        this.recipe = signal(recipe);
      });
    this.form.patchValue({
      measurement: this.data.recipeIngredient.measurement,
      measurementUnit: this.enrichMeasurementUnit(
        this.data.recipeIngredient.measurementUnit
      ),
      purchaseUnitRatio: this.data.recipeIngredient.purchaseUnitRatio,
    });
  }

  setForm() {
    this.form = this.fb.group({
      measurement: ['', [Validators.required, positiveFloatValidator()]],
      measurementUnit: ['', [Validators.required]],
      purchaseUnitRatio: ['', [Validators.required, positiveFloatValidator()]],
    });

    // Update mUnit whenever measurementUnit value changes
    this.form.get('measurementUnit')?.valueChanges.subscribe((value) => {
      // if value is equal to one of following strings, add "es" to it: 'box', 'bunch', 'pinch', 'dash'
      this.mUnit = this.enrichMeasurementUnit(value);
    });
  }

  enrichMeasurementUnit(measurementUnit) {
    if (measurementUnit[measurementUnit.length - 1] === 's') {
      return measurementUnit;
    }
    if (
      measurementUnit === 'box' ||
      measurementUnit === 'bunch' ||
      measurementUnit === 'pinch' ||
      measurementUnit === 'dash'
    ) {
      measurementUnit += 'es';
    } else {
      measurementUnit += 's';
    }
    return measurementUnit;
  }

  onSubmit() {
    const updatedRecipeIngredient: any = {
      recipeIngredientID: this.data.recipeIngredient.recipeIngredientID,
      ingredientID: this.data.recipeIngredient.ingredientID,
      recipeID: this.data.recipeIngredient.recipeID,
    };
    const formValues = this.form.value;
    for (let key in formValues) {
      if (
        key in this.data.recipeIngredient &&
        formValues[key] !== this.data.recipeIngredient[key]
      ) {
        if (key === 'measurement' || key === 'purchaseUnitRatio') {
          updatedRecipeIngredient[key] = Number(formValues[key]);
        } else if (key === 'measurementUnit') {
          const newValue = this.unitService.singular(formValues[key]);
          updatedRecipeIngredient[key] = newValue;
        } else {
          updatedRecipeIngredient[key] = formValues[key];
        }
      }
    }

    this.isUpdating = true;
    this.store.dispatch(
      RecipeIngredientActions.updateRecipeIngredient({
        recipeIngredient: updatedRecipeIngredient,
      })
    );
    this.store
      .select(selectUpdating)
      .pipe(
        filter((updating) => !updating),
        take(1)
      )
      .subscribe(() =>
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            console.error(
              `Recipe Ingredient Upddate failed: ${error.message}, CODE: ${error.statusCode}`
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
        })
      );
  }

  onConfirm() {
    this.onSubmit();
  }

  onCancel() {
    this.dialogRef.close();
  }
}
