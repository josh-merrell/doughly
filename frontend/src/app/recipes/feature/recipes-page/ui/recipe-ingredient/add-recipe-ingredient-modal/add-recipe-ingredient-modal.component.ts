import {
  ChangeDetectorRef,
  Component,
  Inject,
  WritableSignal,
  signal,
} from '@angular/core';
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
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  tap,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import {
  selectIngredientByID,
  selectIngredients,
} from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddIngredientModalComponent } from 'src/app/kitchen/feature/ingredients/ui/add-ingredient-modal/add-ingredient-modal.component';
import {
  positiveFloatValidator,
  lessThan40CharsValidator,
  lessThan20CharsValidator,
} from 'src/app/shared/utils/formValidator';
import { UnitService } from 'src/app/shared/utils/unitService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';
import { ValueSyncDirective } from 'src/app/shared/utils/valueSyncDirective';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

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
    TextInputComponent,
    SelectInputComponent,
    ValueSyncDirective, // needed to correctly update form values received from textInput,
    LottieComponent,
  ],
  templateUrl: './add-recipe-ingredient-modal.component.html',
})
export class AddRecipeIngredientModalComponent {
  ingredients: WritableSignal<any[]> = signal([]);
  ingredientsToExclude;
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);
  public components: WritableSignal<string[]> = signal([]);
  public selectedComponent: WritableSignal<string> = signal('');
  public quickTapComponents: WritableSignal<string[]> = signal([]);

  // Lottie animation
  private animationItem: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: '/assets/animations/lottie/stars-dark.json',
    loop: true,
    autoplay: true,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    height: '40px',
    width: '40px',
  };

  public purLabel: WritableSignal<string> = signal('Purchase Unit Ratio');
  public mUnit: string = 'Measurement Unit';
  public pUnit: string = 'Purchase Unit';

  //used for getting ingredient details to update pUnit when ingredientID form value changes
  private subscriptions: Subscription[] = [];

  public purchaseUnitRatioSuggestion: WritableSignal<number> = signal(0);
  public gettingUnitRatio: WritableSignal<boolean> = signal(false);

  constructor(
    public dialogRef: MatDialogRef<AddRecipeIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {
    this.ingredientsToExclude = this.data.ingredientsToExclude;
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
  }

  isIngredientExcluded(ingredientID: any): boolean {
    return this.ingredientsToExclude.includes(ingredientID);
  }

  ngOnInit() {
    this.setForm();
    this.components.set(this.data.components);
    this.quickTapComponents.set(this.data.components);
    this.store.select(selectIngredients).subscribe((ingredients) => {
      const sorted = [...ingredients].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      this.ingredients.set(sorted);
      this.cdr.detectChanges();
    });
    // sort the purchaseUnits
    this.purchaseUnits.sort((a, b) => a.localeCompare(b));
    this.quickTapComponents.set(this.data.components);
    this.subscribeToFormChanges();
  }

  setForm() {
    const initialIngredientID = '';
    const initialMeasurementUnit = '';
    this.form = this.fb.group({
      component: ['', [lessThan20CharsValidator()]],
      ingredientID: [initialIngredientID, Validators.required],
      preparation: ['', [lessThan40CharsValidator()]],
      measurement: [
        { value: '', disabled: !initialIngredientID },
        [Validators.required, positiveFloatValidator()],
      ],
      measurementUnit: [initialMeasurementUnit, Validators.required],
      purchaseUnitRatio: [
        {
          value: '',
          disabled: !initialIngredientID || !initialMeasurementUnit,
        },
        [Validators.required, positiveFloatValidator()],
      ],
    });

    // Update mUnit whenever measurementUnit value changes
    this.form.get('measurementUnit')?.valueChanges.subscribe((value) => {
      this.mUnit = value;
      this.purLabel.set(`${this.pUnit} per ${this.mUnit}`);
    });

    this.form.get('ingredientID')?.valueChanges.subscribe((ingredientID) => {
      if (ingredientID) {
        this.form.get('measurement')?.enable();
      } else {
        this.form.get('measurement')?.disable();
      }
    });

    combineLatest([
      this.form.get('ingredientID')!.valueChanges,
      this.form.get('measurementUnit')!.valueChanges,
    ]).subscribe(([ingredientID, measurementUnit]) => {
      if (ingredientID && measurementUnit) {
        this.form.get('purchaseUnitRatio')?.enable();
      } else {
        this.form.get('purchaseUnitRatio')?.disable();
      }
    });

    // Update pUnit whenever ingredientID value changes
    this.subscriptions.push(
      this.form.get('ingredientID')!.valueChanges.subscribe((value) => {
        if (value) {
          this.store
            .select(selectIngredientByID(value))
            .subscribe((ingredientDetails) => {
              if (ingredientDetails) {
                let value = ingredientDetails.purchaseUnit;
                if (
                  value === 'box' ||
                  value === 'bunch' ||
                  value === 'pinch' ||
                  value === 'dash'
                ) {
                  value += 'es';
                } else {
                  value += 's';
                }
                this.pUnit = value;
                this.purLabel.set(`${this.pUnit} per ${this.mUnit}`);
              }
            });
        }
      })
    );
  }

  subscribeToFormChanges() {
    const ingredientIDControl = this.form.get('ingredientID');
    const measurementUnitControl = this.form.get('measurementUnit');

    if (ingredientIDControl && measurementUnitControl) {
      combineLatest([
        ingredientIDControl.valueChanges,
        measurementUnitControl.valueChanges,
      ])
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(
            ([ingredientID, measurementUnit]) =>
              ingredientID > 0 && measurementUnit.length > 0
          ),
          switchMap(([ingredientID, measurementUnit]) => {
            const ingredientDetails = this.ingredients().find(
              (ingredient) => ingredient.ingredientID === ingredientID
            );

            this.form.get('purchaseUnitRatio')?.setValue(null);
            this.gettingUnitRatio.set(true);
            this.purchaseUnitRatioSuggestion.set(0);
            return this.unitService.getUnitRatio(
              ingredientDetails.name,
              ingredientDetails.purchaseUnit,
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

  onAddNewIngredient() {
    const dialogRef = this.modalService.open(
      AddIngredientModalComponent,
      {
        data: {
          recipeCategories: this.data.recipeCategories,
        },
      },
      3,
      false,
      'AddIngredientModalComponent'
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        // if result is a number, it is the ingredientID of the newly added ingredient
        if (typeof result === 'number') {
          this.modalService.open(
            AddRequestConfirmationModalComponent,
            {
              data: {
                result: result,
                addSuccessMessage: 'Ingredient added successfully!',
              },
            },
            3,
            true,
            'AddRequestConfirmationModalComponent'
          );
          // update the value of the ingredientID form control
          console.log(`NEW INGREDIENT: `, result);
          this.cdr.detectChanges();
          this.form.get('ingredientID')?.setValue(result);
        } else if (result) {
          this.modalService.open(
            AddRequestErrorModalComponent,
            {
              data: {
                error: result,
                addFailureMessage: 'Failed to add Ingredient.',
              },
            },
            3,
            true,
            'AddRequestErrorModalComponent'
          );
        }
      });
    } else {
    }
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1.8);
  }
  loopComplete(): void {
    this.animationItem?.pause();
  }

  onSubmit() {
    const formValue = this.form.value;
    const newRecipeIngredient = {
      ...formValue,
      measurement: parseFloat(formValue.measurement),
      purchaseUnitRatio: parseFloat(formValue.purchaseUnitRatio),
    };
    newRecipeIngredient['measurementUnit'] = this.unitService.singular(
      newRecipeIngredient['measurementUnit']
    );
    this.dialogRef.close(newRecipeIngredient);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  componentQuickTap(component: string) {
    this.form.patchValue({ component });
    this.selectedComponent.set(component);
    this.quickTapComponents.set(
      this.components().filter((c) => c !== component)
    );
    // mark the form as not pristine
    this.form.markAsDirty();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
