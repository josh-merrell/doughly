import {
  Component,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { selectShoppingListRecipes } from '../../state/shopping-list-recipe-selectors';
import { RecipeListComponent } from '../../../recipes/feature/recipes-page/feature/list/recipe-list.component';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';

import { Store } from '@ngrx/store';
import {
  selectRecipeByID,
  selectRecipes,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { RecipeIngredient } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-state';
import {
  selectRecipeIngredients,
  selectRecipeIngredientsByRecipeID,
} from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { selectShoppingLists } from '../../state/shopping-list-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { ShoppingListRecipeService } from '../../data/shopping-list-recipe.service';
import { ShoppingListRecipeActions } from '../../state/shopping-list-recipe-actions';
import { AddShoppingListRecipeModalComponent } from '../../ui/add-shopping-list-recipe-modal/add-shopping-list-recipe-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'dl-draft-page',
  standalone: true,
  imports: [
    CommonModule,
    RecipeCardComponent,
    AddShoppingListRecipeModalComponent,
  ],
  templateUrl: './draft-page.component.html',
})
export class DraftPageComponent {
  Math = Math;
  public shoppingLists: WritableSignal<any> = signal([]);
  public listRecipes: WritableSignal<any> = signal([]);
  public recipes: WritableSignal<any> = signal([]);
  public recipeIngredients: WritableSignal<any> = signal([]);
  public ingredients: WritableSignal<any> = signal([]);

  public combinedSLRecipeIng: WritableSignal<any> = signal([]);
  // **computed**
  public displayRecipes = computed(() => {
    const recipes = this.recipes();
    const listRecipes = this.listRecipes();
    console.log(
      `SETTING DISPLAY RECIPES. RECIPES: `,
      recipes,
      `LIST RECIPES: `,
      listRecipes
    );
    return (
      recipes
        .map((recipe) => {
          // Find the corresponding listRecipe for each recipe
          const matchingListRecipe = listRecipes.find(
            (listRecipe) => listRecipe.recipeID === recipe.recipeID
          );
          // If a corresponding listRecipe is found, merge its plannedDate into the recipe
          if (matchingListRecipe) {
            return {
              ...recipe,
              plannedDate: matchingListRecipe.plannedDate,
              shoppingListRecipeID: matchingListRecipe.shoppingListRecipeID,
            };
          }
          return recipe;
        })
        // filter out recipes without a plannedDate or if plannedDate is before today
        .filter(
          (recipe) =>
            recipe.plannedDate &&
            new Date(recipe.plannedDate).getTime() >=
              new Date(new Date().toDateString()).getTime()
        )
    );
  });

  // **reactive state signals**
  individualShoppingLists: WritableSignal<Map<number, any>> = signal(new Map());
  allFetchesComplete: WritableSignal<boolean> = signal(false);
  selectedRecipeID: WritableSignal<number> = signal(0);

  public displaySLIngr = computed(() => {
    const combinedSLRecipeIng = this.combinedSLRecipeIng();
    // const standaloneIngr = this.standaloneIngr(); //add later when standalone ingredients are added
    // for each standalone ingredient, if 'ingredientID' is in combinedSLRecipeIng, then add the 'needMeasure' from standalone ingredient to the combinedSLRecipeIng, then put the result in the displaySLIngr and remove the item from combinedSLRecipeIng. Otherwise, just put the standalone ingredient in the displaySLIngr.
    // add any remaining items in combinedSLRecipeIng to the displaySLIngr
    return combinedSLRecipeIng;
  });

  constructor(
    public dialog: MatDialog,
    private store: Store,
    private recipeService: RecipeService
  ) {
    effect(
      () => {
        const displayRecipes = this.displayRecipes();
        console.log(`displayRecipes: `, displayRecipes);
        const tempMap = new Map();
        if (displayRecipes.length === 0) {
          this.individualShoppingLists.set(new Map(tempMap));
          this.allFetchesComplete.set(true);
        }

        displayRecipes.forEach((recipe) => {
          this.recipeService
            .getShoppingList(recipe.recipeID, new Date(recipe.plannedDate))
            .subscribe((sl) => {
              tempMap.set(recipe.recipeID, sl);

              if (tempMap.size === displayRecipes.length) {
                this.individualShoppingLists.set(new Map(tempMap));
                this.allFetchesComplete.set(true);
              }
            });
        });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        if (this.allFetchesComplete()) {
          const allShoppingLists = this.individualShoppingLists();
          const combinedList = combineShoppingLists(allShoppingLists);
          this.combinedSLRecipeIng.set(combinedList);
        }
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const lr = this.listRecipes();
      for (let i = 0; i < lr.length; i++) {
        //if the 'plannedDate' property of the listRecipe is prior to today, call the 'deleteListRecipe' method
        if (
          new Date(lr[i].plannedDate).getTime() <
          new Date(new Date().toDateString()).getTime()
        ) {
          this.deleteListRecipe(lr[i].shoppingListRecipeID);
        }
      }
    });

    function combineShoppingLists(allShoppingLists) {
      const result: any[] = [];

      allShoppingLists.forEach((sl) => {
        sl.ingredients.forEach((slItem) => {
          const matchingItem = result.find(
            (item) => item.ingredientName === slItem.ingredientName
          );
          if (matchingItem) {
            matchingItem.quantity += slItem.quantity;
          } else {
            result.push(slItem);
          }
        });
      });

      return result;
    }
  }

  ngOnInit(): void {
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
    });
    this.store
      .select(selectShoppingListRecipes)
      .subscribe((listRecipes: any) => {
        console.log(`SETTING LIST RECIPES: `, listRecipes);
        this.listRecipes.set(listRecipes);
      });
    this.store.select(selectRecipes).subscribe((recipes: any) => {
      console.log(`SETTING RECIPES: `, recipes);
      this.recipes.set(recipes);
    });
    this.store
      .select(selectRecipeIngredients)
      .subscribe((recipeIngredients: any) => {
        this.recipeIngredients.set(recipeIngredients);
      });
    this.store.select(selectIngredients).subscribe((ingredients: any) => {
      this.ingredients.set(ingredients);
    });
  }

  recipeCardClick(recipe) {
    if (this.selectedRecipeID() === recipe.shoppingListRecipeID) {
      this.selectedRecipeID.set(0);
    } else {
      this.selectedRecipeID.set(recipe.shoppingListRecipeID);
    }
  }

  onRecipeButtonClick() {
    console.log('onAddRecipeClick');
    if (this.selectedRecipeID() !== 0) {
      console.log(`DELETING LIST RECIPE: `, this.selectedRecipeID());
      console.log(
        `FROM SHOPPING LIST: `,
        this.shoppingLists()[0].shoppingListID
      );
      this.store.dispatch(
        ShoppingListRecipeActions.deleteShoppingListRecipe({
          shoppingListRecipeID: this.selectedRecipeID(),
          shoppingListID: this.shoppingLists()[0].shoppingListID,
        })
      );
    } else {
      this.dialog.open(AddShoppingListRecipeModalComponent, {
        width: '80%',
        maxWidth: '540px',
        data: {
          shoppingListRecipes: this.listRecipes(),
          recipes: this.recipes(),
        },
      });
    }
  }

  onAddItemClick() {
    console.log('onAddItemClick');
  }

  onShopClick() {
    console.log('onShopClick');
  }

  deleteListRecipe(listRecipeID) {
    console.log(`DELETING LIST RECIPE: `, listRecipeID);
  }
}
