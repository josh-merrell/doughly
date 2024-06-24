import { Component, Inject, WritableSignal, signal } from '@angular/core';
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
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';
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
import {
  selectAdding,
  selectIngredients,
  selectLoading,
} from '../../state/ingredient-selectors';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  nonDuplicateString,
  positiveIntegerValidator,
  positiveFloatValidator,
} from 'src/app/shared/utils/formValidator';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { IngredientActions } from '../../state/ingredient-actions';
import { Ingredient } from '../../state/ingredient-state';
import {
  selectError,
  selectIngredientByName,
} from '../../state/ingredient-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { UnitService } from 'src/app/shared/utils/unitService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ValueSyncDirective } from 'src/app/shared/utils/valueSyncDirective';

@Component({
  selector: 'dl-add-ingredient-modal',
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
    ValueSyncDirective, // needed to correctly update form values received from textInput
  ],
  templateUrl: './add-ingredient-modal.component.html',
})
export class AddIngredientModalComponent {
  isAdding: boolean = false;
  ingredients$!: Observable<Ingredient[]>;
  ingredients: Ingredient[] = [];
  form!: FormGroup;
  isLoading$: Observable<boolean>;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);
  private addingSubscription!: Subscription;
  private ingredientsSubscription: Subscription = new Subscription();
  public gramRatioSuggestion: WritableSignal<number> = signal(0);
  public gettingUnitRatio: WritableSignal<boolean> = signal(false);

  constructor(
    public dialogRef: MatDialogRef<AddIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService,
    private modalService: ModalService
  ) {
    this.ingredients$ = this.store.select(selectIngredients);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.ingredientsSubscription = this.ingredients$.subscribe(
      (ingredients) => {
        this.ingredients = ingredients;
        this.setForm();
        this.subscribeToFormChanges();
      }
    );
  }

  setForm() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          nonDuplicateString(
            this.ingredients.map((ingredient) => ingredient.name)
          ),
        ],
      ],
      brand: ['', []],
      lifespanDays: ['', [Validators.required, positiveIntegerValidator()]],
      purchaseUnit: ['', Validators.required],
      gramRatio: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  subscribeToFormChanges() {
    const nameControl = this.form.get('name');
    const purchaseUnitControl = this.form.get('purchaseUnit');

    if (nameControl && purchaseUnitControl) {
      combineLatest([
        nameControl.valueChanges,
        purchaseUnitControl.valueChanges,
      ])
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          filter(
            ([name, purchaseUnit]) => name.length > 0 && purchaseUnit.length > 0
          ),
          switchMap(([name, purchaseUnit]) => {
            this.gramRatioSuggestion.set(0);
            this.form.get('gramRatio')?.setValue(null);
            this.gettingUnitRatio.set(true);
            return this.unitService.getUnitRatio(name, 'gram', purchaseUnit);
          })
        )
        .subscribe({
          next: (response) => {
            this.gettingUnitRatio.set(false);
            this.gramRatioSuggestion.set(response.ratio);
            console.log('Suggested unit ratio:', response.ratio);
            // if (typeof response.ratio === 'number') {
            this.form.get('gramRatio')?.setErrors(null);
            this.form.patchValue({ gramRatio: response.ratio });
            // }
          },
          error: (err) => {
            console.error('Error fetching suggested unit ratio:', err);
          },
        });
    }
  }

  onSubmit() {
    this.isAdding = true;
    const payload = this.form.value;

    payload.lifespanDays = parseInt(payload.lifespanDays);
    payload.gramRatio = parseInt(payload.gramRatio);

    console.log(
      `RATIO: ${
        this.form.get('gramRatio')?.value
      }. SUGGESTED: ${this.gramRatioSuggestion()}`
    );
    if (this.form.get('gramRatio')?.value !== this.gramRatioSuggestion()) {
      console.log('Sending user provided ratio to server');
      // send the user provided ratio to the server for storage as a proposed unit ratio in case it doesn't yet exist
      this.unitService
        .addUnitRatio(
          this.form.get('name')?.value,
          'gram',
          this.form.get('purchaseUnit')?.value,
          this.form.get('gramRatio')?.value
        )
        .subscribe({
          next: (response) => {
            console.log('Unit ratio added successfully', response);
          },
          error: (error) => {
            console.error('Error adding unit ratio', error);
          },
        });
    }

    this.store.dispatch(
      IngredientActions.addIngredient({ ingredient: payload })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .pipe(
        filter((adding) => !adding),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            this.dialogRef.close(error);
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
              true
            );
          } else {
            // this.dialogRef.close('success');
            // return the new ingredientID after selecting the new ingredient from the store by name
            this.store
              .select(selectIngredientByName(payload.name))
              .pipe(take(1))
              .subscribe((ingredient) => {
                this.dialogRef.close(ingredient?.ingredientID);
              });
          }
          this.isAdding = false;
        });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    if (this.ingredientsSubscription) {
      this.ingredientsSubscription.unsubscribe();
    }
  }
}
