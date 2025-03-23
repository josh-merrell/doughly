import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
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
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';

import {
  positiveFloatValidator,
  positiveIntegerValidator,
} from 'src/app/shared/utils/formValidator';
import { IngredientActions } from '../../state/ingredient-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { UnitService } from 'src/app/shared/utils/unitService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ValueSyncDirective } from 'src/app/shared/utils/valueSyncDirective';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

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
    TextInputComponent,
    SelectInputComponent,
    ValueSyncDirective, // needed to correctly update form values received from textInput,
    LottieComponent,
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
  public gramRatioLabel: WritableSignal<string> = signal('Gram Ratio');

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

  constructor(
    public dialogRef: MatDialogRef<EditIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService,
    private modalService: ModalService
  ) {
    this.ingredients$ = this.store.select(selectIngredients);
  }

  ngOnInit(): void {
    this.setForm();
    this.ingredient$ = this.store.select(
      selectIngredientByID(this.data.itemID)
    );

    this.ingredient$.subscribe((ingredient) => {
      this.originalIngredient = ingredient;
      this.form.patchValue({
        name: ingredient.name,
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
      name: ['', [Validators.required, this.nameValidator()]],
      brand: ['', []],
      lifespanDays: ['', [Validators.required, positiveIntegerValidator()]],
      purchaseUnit: ['', [Validators.required]],
      gramRatio: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1.8);
  }
  loopComplete(): void {
    this.animationItem?.pause();
  }

  nameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const name = control.value;
      if (!name) {
        return null;
      }
      // Check it the name is the same as the original ingredient name
      if (name === this.originalIngredient.name) {
        return null;
      }

      // Check if the name is already taken by another ingredient
      if (this.ingredients.find((ingredient) => ingredient.name === name)) {
        return { nameTaken: true };
      }
      return null;
    };
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
            this.modalService.open(
              ErrorModalComponent,
              {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              },
              2,
              true,
              'ErrorModalComponent'
            );
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
