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
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
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
import { positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { IngredientActions } from '../../state/ingredient-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { UnitService } from 'src/app/shared/utils/unitService';

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
  public gramRatioSuggestion: WritableSignal<number> = signal(0);
  public gettingUnitRatio: WritableSignal<boolean> = signal(false);

  constructor(
    public dialogRef: MatDialogRef<EditIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService
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
    this.subscribeToFormChanges();
  }

  setForm() {
    this.form = this.fb.group({
      brand: ['', []],
      lifespanDays: ['', [Validators.required, positiveIntegerValidator()]],
      purchaseUnit: ['', [Validators.required]],
      gramRatio: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  subscribeToFormChanges() {
    const purchaseUnitControl = this.form.get('purchaseUnit') as FormControl;

    if (purchaseUnitControl) {
      combineLatest([purchaseUnitControl.valueChanges])
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(([purchaseUnit]) => purchaseUnit.length > 0),
          switchMap(([purchaseUnit]) => {
            this.gramRatioSuggestion.set(0);
            this.form.get('gramRatio')?.setValue(null);
            this.gettingUnitRatio.set(true);
            return this.unitService.getUnitRatio(
              this.originalIngredient.name,
              'gram',
              purchaseUnit
            );
          })
        )
        .subscribe({
          next: (response) => {
            this.gettingUnitRatio.set(false);
            this.gramRatioSuggestion.set(response.ratio);
            if (typeof response.ratio === 'number') {
              this.form.get('gramRatio')?.setErrors(null);
              this.form.patchValue({ gramRatio: response.ratio });
            }
          },
          error: (error) => {
            console.error('Error getting gram ratio:', error);
          },
        });
    }
  }

  onSubmit() {
    const updatedIngredient: any = {
      ingredientID: this.data.itemID,
      name: this.data.name,
    };

    const formValues = this.form.value;

    // if gramRatio is user provided, send it to the server for storage as a draft unit ratio in case it doesn't exist
    if (this.form.get('gramRatio')?.value !== this.gramRatioSuggestion()) {
      this.unitService
        .addUnitRatio(
          this.data.name,
          'gram',
          formValues.purchaseUnit,
          formValues.gramRatio
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
