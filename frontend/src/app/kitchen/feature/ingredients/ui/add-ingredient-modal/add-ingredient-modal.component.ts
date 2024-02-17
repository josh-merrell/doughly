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
} from 'src/app/shared/utils/formValidator';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { IngredientActions } from '../../state/ingredient-actions';
import { Ingredient } from '../../state/ingredient-state';
import { selectError } from '../../state/ingredient-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { UnitService } from 'src/app/shared/utils/unitService';

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
  private gramRatioSuggestion: WritableSignal<number> = signal(0);

  constructor(
    public dialogRef: MatDialogRef<AddIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private unitService: UnitService
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
      gramRatio: ['', [Validators.required, positiveIntegerValidator()]],
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
          switchMap(([name, purchaseUnit]) =>
            this.unitService.getUnitRatio(name, 'gram', purchaseUnit)
          )
        )
        .subscribe({
          next: (response) => {
            console.log('Suggested unit ratio:', response)
            if (typeof response === 'number') {
              // if (!this.form.get('gramRatio')?.value) {
                this.form.get('gramRatio')?.setErrors(null);
                this.form.patchValue({ gramRatio: response });
              // } else {
                // this.gramRatioSuggestion.set(response);
              // }
            }
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
