import { Component, Inject, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { positiveFloatValidator } from 'src/app/shared/utils/formValidator';
import { ShoppingListIngredientActions } from '../../state/shopping-list-ingredient-actions';
import { selectAdding } from '../../state/shopping-list-ingredient-selectors';

@Component({
  selector: 'dl-add-shopping-list-ingredient-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
  ],
  templateUrl: './add-shopping-list-ingredient-modal.component.html',
})
export class AddShoppingListIngredientModalComponent {
  form!: FormGroup;
  public selectedIngredient: WritableSignal<any> = signal({ ingredientID: 0 });
  public isAdding: WritableSignal<boolean> = signal(false);

  public shoppingListIngredients: WritableSignal<any> = signal([]);
  public ingredients: WritableSignal<any> = signal([]);
  private filteredIngredients = computed(() => {
    const searchFilter = this.searchFilter();
    const shoppingListIngredients = this.shoppingListIngredients();
    const ingredients = this.ingredients();
    //return any ingredients that are not already in the shopping list and match the search filter
    return ingredients.filter((ingredient) => {
      const isInShoppingList = shoppingListIngredients.find(
        (shoppingListIngredient) => {
          return (
            shoppingListIngredient.ingredientID === ingredient.ingredientID
          );
        }
      );
      return (
        !isInShoppingList &&
        ingredient.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    });
  });
  public displayIngredients = computed(() => {
    return this.filteredIngredients();
  });
  searchFilter: WritableSignal<string> = signal('');

  constructor(
    public dialogRef: MatDialogRef<AddShoppingListIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {}

  setForm() {
    this.form = this.fb.group({
      quantity: ['', [Validators.required, positiveFloatValidator()]],
    });
  }

  ngOnInit(): void {
    this.setForm();
    this.shoppingListIngredients.set(this.data.shoppingListIngredients());
    this.ingredients.set(this.data.ingredients());
  }

  ingredientCardClick(ingredient: any): void {
    this.selectedIngredient.set(ingredient);
  }

  onSubmit(): void {
    const formValues = this.form.value;

    this.store.dispatch(
      ShoppingListIngredientActions.addShoppingListIngredient({
        shoppingListID: this.data.shoppingListID,
        ingredientID: this.selectedIngredient().ingredientID,
        needMeasurement: formValues.quantity,
        needUnit: this.selectedIngredient().purchaseUnit,
        source: 'standalone',
      })
    );
    this.isAdding.set(true);
    this.store.select(selectAdding).subscribe((adding) => {
      if (!adding) {
        this.dialogRef.close();
      }
    });
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
}
