import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription, filter, of, switchMap, take } from 'rxjs';
import { selectAdding, selectIngredients, selectLastIngredientID, selectLoading } from '../../state/ingredient-selectors';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { enumValidator, nonDuplicateString, positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { PurchaseUnit } from 'src/app/shared/utils/types';
import { IngredientActions } from '../../state/ingredient-actions';
import { Ingredient } from '../../state/ingredient-state';
import { selectError } from '../../state/ingredient-selectors';

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
  ingredients$!: Observable<Ingredient[]>;
  ingredients: Ingredient[] = [];
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  purchaseUnits: PurchaseUnit[] = Object.values(PurchaseUnit);
  private addingSubscription!: Subscription;
  private ingredientsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.ingredients$ = this.store.select(selectIngredients);
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.ingredientsSubscription = this.ingredients$.subscribe(
      (ingredients) => {
        this.ingredients = ingredients;
        this.setForm();
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

  onSubmit() {
    const newIngredient = this.form.value;

    newIngredient.lifespanDays = parseInt(newIngredient.lifespanDays);
    newIngredient.gramRatio = parseInt(newIngredient.gramRatio);

    this.store.dispatch(
      IngredientActions.addIngredient({ ingredient: newIngredient })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .subscribe((adding: boolean) => {
        if (!adding) {
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
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    if (this.ingredientsSubscription) {
      this.ingredientsSubscription.unsubscribe();
    }
  }
}
