import { Component, Inject, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { lessThanValidator, positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
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
      measurement: [
        '',
        [Validators.required, positiveIntegerValidator(), lessThanValidator(100)],
      ],
    });
  }

  ngOnInit(): void {
    this.setForm();
    this.shoppingListIngredients.set(this.data.shoppingListIngredients);
    this.ingredients.set(this.data.ingredients);
  }

  ingredientCardClick(ingredient: any): void {
    if (this.selectedIngredient().ingredientID === ingredient.ingredientID) {
      this.selectedIngredient.set({ ingredientID: 0 });
    } else {
      this.selectedIngredient.set(ingredient);
    }

  }

  onSubmit(): void {
    const formValues = this.form.value;

    this.store.dispatch(
      ShoppingListIngredientActions.addShoppingListIngredient({
        shoppingListID: this.data.shoppingListID,
        ingredientID: this.selectedIngredient().ingredientID,
        needMeasurement: parseInt(formValues.measurement),
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
    this.selectedIngredient.set({ ingredientID: 0 });
  }
}
