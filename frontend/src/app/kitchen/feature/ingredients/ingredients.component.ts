import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import { FilterTypeEnum, SortEnum, SortRotateStateEnum, TableFullColumn } from 'src/app/shared/state/shared-state';
import { Observable } from 'rxjs';
import { IngredientService } from './data/ingredient.service';
import { AddIngredientModalComponent } from './ui/add-ingredient-modal/add-ingredient-modal.component';
import { EditIngredientModalComponent } from './ui/edit-ingredient-modal/edit-ingredient-modal.component';
import { DeleteIngredientModalComponent } from './ui/delete-ingredient-modal/delete-ingredient-modal.component';
import { Ingredient } from './state/ingredient-state';

@Component({
  selector: 'dl-ingredients',
  standalone: true,
  imports: [
    CommonModule,
    TableFullComponent,
    AddIngredientModalComponent,
    EditIngredientModalComponent,
  ],
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  addModalComponent: Type<any> = AddIngredientModalComponent;
  editModalComponent: Type<any> = EditIngredientModalComponent;
  deleteModalComponent: Type<any> = DeleteIngredientModalComponent;

  constructor(private ingredientService: IngredientService) {}

  title = 'Ingredients';
  headingPhrase = 'Ingredients are the building blocks of Recipes.';
  IDKey = 'ingredientID';
  searchPlaceholder = 'Search by Ingredient...';
  searchSubject = 'name';
  addButtonTitle = 'Add Ingredient';
  addSuccessMessage = 'Added Ingredient with ID:';
  addFailureMessage = 'Failed to add Ingredient. Try again later.';
  editSuccessMessage = 'Updated Ingredient with ID:';
  editFailureMessage = 'Failed to update Ingredient. Try again later.';
  deleteSuccessMessage = 'Deleted Ingredient with ID:';
  deleteFailureMessage = 'Failed to delete Ingredient. Try again later.';
  columns: TableFullColumn[] = [
    {
      name: 'ID',
      prop: 'ingredientID',
      cssClass: 'w-dl-3',
      sort: SortEnum.numerical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.numRange,
    },
    {
      name: 'Ingredient',
      prop: 'name',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Brand',
      prop: 'brand',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Lifespan (Days)',
      prop: 'lifespanDays',
      cssClass: 'w-dl-3',
      sort: SortEnum.numerical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.numRange,
    },
    {
      name: 'Purchase Unit',
      prop: 'purchaseUnit',
      cssClass: 'w-dl-4',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Gram Ratio',
      prop: 'gramRatio',
      cssClass: 'w-dl-3',
      sort: SortEnum.numerical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.numRange,
    },
  ];

  rows$: Observable<Ingredient[]> = this.ingredientService.rows$;
}
