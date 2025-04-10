import { Component, Inject, WritableSignal, signal } from '@angular/core';
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
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, filter, map, take } from 'rxjs';
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
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { UnitService } from 'src/app/shared/utils/unitService';

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
    TextInputComponent,
  ],
  templateUrl: './add-ingredient-stock-modal.component.html',
})
export class AddIngredientStockModalComponent {
  isAdding: boolean = false;
  form!: FormGroup;

  ingredients$!: Observable<Ingredient[]>;
  employees$!: Observable<any>;
  public measurementLabel: WritableSignal<string> = signal('Measurement');
  public ingredient: WritableSignal<Ingredient | null> = signal(null);

  private ingredientIDSubscription!: Subscription;
  private addingSubscription!: Subscription;
  private purchasedDateSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService,
    private unitService: UnitService
  ) {}

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
    if (this.data.ingredientID) {
      this.form.get('ingredientID')!.setValue(this.data.ingredientID);
      this.form.get('measurement')!.enable();
      this.store
        .select(selectIngredientByID(this.data.ingredientID))
        .subscribe((ingredient) => {
          this.ingredient.set(ingredient);
          this.measurementLabel.set(
            `Measurement in ${this.unitService.plural(ingredient.purchaseUnit)}`
          );
        });
    }
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
    this.isAdding = true;
    const date = new Date(this.form.value.purchasedDate);

    const payload = {
      ...this.form.value,
      ingredientID: parseInt(this.form.value.ingredientID, 10),
      measurement: parseFloat(this.form.value.measurement),
      purchasedDate: date.toISOString(),
    };

    this.store.dispatch(
      IngredientStockActions.addIngredientStock({ ingredientStock: payload })
    );
    this.store
      .select(selectAdding)
      .pipe(
        filter((adding) => !adding),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            // this.dialogRef.close(error);
            console.error(
              `Ingredient Stock add failed: ${error.message}, CODE: ${error.statusCode}`
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
          this.isAdding = false;
        });
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
