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
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  positiveFloatValidator,
  lessThan40CharsValidator,
  lessThan20CharsValidator,
} from 'src/app/shared/utils/formValidator';
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
import { ModalService } from 'src/app/shared/utils/modalService';

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
    TextInputComponent,
    SelectInputComponent,
  ],
  templateUrl: './edit-recipe-ingredient-modal.component.html',
})
export class EditRecipeIngredientModalComponent {
  isUpdating: boolean = false;
  form!: FormGroup;
  unitOptions: PurchaseUnit[] = Object.values(PurchaseUnit);
  public mUnit!: string;
  public pUnit!: string;
  public purLabel: WritableSignal<string> = signal('Purchase Unit Ratio');

  public recipeIngredient!: WritableSignal<any>;
  public recipe!: WritableSignal<Recipe>;
  public purchaseUnitRatioSuggestion: WritableSignal<number> = signal(0);
  public gettingUnitRatio: WritableSignal<boolean> = signal(false);

  constructor(
    public dialogRef: MatDialogRef<EditRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService,
    private modalService: ModalService
  ) {
    effect(() => {
      const recipeIngredient = this.recipeIngredient();
      console.log(`RI: `, recipeIngredient);
    });
  }

  ngOnInit() {
    // get plural
    this.pUnit = this.unitService.plural(
      this.data.recipeIngredient.purchaseUnit
    );
    this.purLabel.set(`${this.pUnit} per ${this.mUnit}`)
    this.recipeIngredient = signal(this.data.recipeIngredient);
    this.setForm();
    this.store
      .select(selectRecipeByID(this.data.recipeIngredient.recipeID))
      .subscribe((recipe) => {
        this.recipe = signal(recipe);
      });
    this.form.patchValue({
      component: this.data.recipeIngredient.component,
      preparation: this.data.recipeIngredient.preparation,
      measurement: this.data.recipeIngredient.measurement,
      measurementUnit: this.unitService.plural(
        this.data.recipeIngredient.measurementUnit
      ),
      purchaseUnitRatio: this.data.recipeIngredient.purchaseUnitRatio,
    });
    this.subscribeToFormChanges();
  }

  setForm() {
    this.form = this.fb.group({
      component: ['', [lessThan20CharsValidator()]],
      preparation: ['', [lessThan40CharsValidator()]],
      measurement: ['', [Validators.required, positiveFloatValidator()]],
      measurementUnit: ['', [Validators.required]],
      purchaseUnitRatio: ['', [Validators.required, positiveFloatValidator()]],
    });

    // Update mUnit whenever measurementUnit value changes
    this.form.get('measurementUnit')?.valueChanges.subscribe((value) => {
      this.mUnit = this.unitService.singular(value);
      this.purLabel.set(`${this.pUnit} per ${this.mUnit}`)
    });
  }

  subscribeToFormChanges() {
    const measurementUnitControl = this.form.get('measurementUnit');

    if (measurementUnitControl) {
      combineLatest([measurementUnitControl.valueChanges])
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(([measurementUnit]) => measurementUnit.length > 0),
          switchMap(([measurementUnit]) => {
            this.form.get('purchaseUnitRatio')?.setValue(null);
            this.gettingUnitRatio.set(true);
            this.purchaseUnitRatioSuggestion.set(0);
            return this.unitService.getUnitRatio(
              this.recipeIngredient().ingredient,
              this.recipeIngredient().purchaseUnit,
              measurementUnit
            );
          })
        )
        .subscribe({
          next: (response) => {
            this.gettingUnitRatio.set(false);
            this.purchaseUnitRatioSuggestion.set(response.ratio);
            if (typeof response.ratio === 'number') {
              this.form.get('purchaseUnitRatio')?.setErrors(null);
              this.form.patchValue({
                purchaseUnitRatio: response.ratio,
              });
            }
          },
          error: (error) => {
            console.error('Error getting purchase unit ratio:', error);
          },
        });
    }
  }

  onSubmit() {
    const updatedRecipeIngredient: any = {
      recipeIngredientID: this.data.recipeIngredient.recipeIngredientID,
      ingredientID: this.data.recipeIngredient.ingredientID,
      recipeID: this.data.recipeIngredient.recipeID,
    };
    const formValues = this.form.value;

    // if gramRatio is user provided, send it to the server for storage as a draft unit ratio in case it doesn't exist
    if (
      this.form.get('purchaseUnitRatio')?.value !==
      this.purchaseUnitRatioSuggestion()
    ) {
      this.unitService
        .addUnitRatio(
          this.data.name,
          this.data.purchaseUnit,
          formValues.measurementUnit,
          formValues.purchaseUnitRatio
        )
        .subscribe({
          next: (response) => {
            console.log('Added unit ratio:', response);
          },
          error: (error) => {
            console.error('Error adding unit ratio:', error);
          },
        });
    }

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
            this.modalService.open(
              ErrorModalComponent,
              {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              },
              3,
              true
            );
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
