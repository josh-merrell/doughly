import {
  Component,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { selectShoppingListRecipes } from '../../state/shopping-list-recipe-selectors';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


import { Store } from '@ngrx/store';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { selectRecipeIngredients } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { selectShoppingLists } from '../../state/shopping-list-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { ShoppingListRecipeActions } from '../../state/shopping-list-recipe-actions';
import { AddShoppingListRecipeModalComponent } from '../../ui/add-shopping-list-recipe-modal/add-shopping-list-recipe-modal.component';
import { MatDialog } from '@angular/material/dialog';
import {
  selectAdding,
  selectError,
  selectShoppingListIngredients,
} from '../../state/shopping-list-ingredient-selectors';
import { ShoppingListIngredientActions } from '../../state/shopping-list-ingredient-actions';
import { AddShoppingListIngredientModalComponent } from '../../ui/add-shopping-list-ingredient-modal/add-shopping-list-ingredient-modal.component';
import { combineLatest, first, map, take } from 'rxjs';
import { ShoppingListActions } from '../../state/shopping-list-actions';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-draft-page',
  standalone: true,
  imports: [
    CommonModule,
    RecipeCardComponent,
    AddShoppingListRecipeModalComponent,
    MatProgressSpinnerModule,
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
  public allShoppingListIngredients: WritableSignal<any> = signal([]);
  // **computed**
  public displayRecipes = computed(() => {
    const recipes = this.recipes();
    const listRecipes = this.listRecipes();
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
        // filter out recipes without a plannnedDate or if plannedDate is before today
        .filter(
          (recipe) =>
            recipe.plannedDate &&
            new Date(recipe.plannedDate).getTime() >=
              new Date(new Date().toDateString()).getTime()
        )
    );
  });
  public displaySLRecipeIngr = computed(() => {
    const combinedSLRecipeIng = this.combinedSLRecipeIng();
    // const standaloneIngr = this.standaloneIngr(); //add later when standalone ingredients are added
    // for each standalone ingredient, if 'ingredientID' is in combinedSLRecipeIng, then add the 'needMeasure' from standalone ingredient to the combinedSLRecipeIng, then put the result in the displaySLIngr and remove the item from combinedSLRecipeIng. Otherwise, just put the standalone ingredient in the displaySLIngr.
    // add any remaining items in combinedSLRecipeIng to the displaySLIngr
    return combinedSLRecipeIng;
  });
  public displaySLStandaloneIngr = computed(() => {
    const shoppingLists = this.shoppingLists();
    const allShoppingListIngredients = this.allShoppingListIngredients();
    const ingredients = this.ingredients();
    const filtered = allShoppingListIngredients.filter(
      (slIngr) => slIngr.shoppingListID === shoppingLists[0].shoppingListID
    );
    // for each filtered shoppingListIngredient, add the 'name' property from the corresponding ingredient
    const result = filtered.map((slIngr) => {
      const matchingIngredient = ingredients.find(
        (ingr) => ingr.ingredientID === slIngr.ingredientID
      );
      return {
        ...slIngr,
        name: matchingIngredient.name,
      };
    });
    return result;
  });

  // **reactive state signals**
  individualShoppingLists: WritableSignal<Map<number, any>> = signal(new Map());
  public isLoading: WritableSignal<boolean> = signal(false);
  allFetchesComplete: WritableSignal<boolean> = signal(false);
  selectedRecipeID: WritableSignal<number> = signal(0);
  selectedSLIngrID: WritableSignal<number> = signal(0);

  constructor(
    public dialog: MatDialog,
    private store: Store,
    private recipeService: RecipeService,
    public router: Router
  ) {
    effect(
      () => {
        const displayRecipes = this.displayRecipes();
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
        this.listRecipes.set(listRecipes);
      });
    this.store
      .select(selectShoppingListIngredients)
      .subscribe((slIngr: any) => {
        this.allShoppingListIngredients.set(slIngr);
      });
    this.store.select(selectRecipes).subscribe((recipes: any) => {
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

  standaloneIngredientCardClick(ingredient) {
    if (this.selectedSLIngrID() === ingredient.shoppingListIngredientID) {
      this.selectedSLIngrID.set(0);
    } else {
      this.selectedSLIngrID.set(ingredient.shoppingListIngredientID);
    }
  }

  onRecipeButtonClick() {
    if (this.selectedRecipeID() !== 0) {
      this.deleteListRecipe(this.selectedRecipeID());
      this.selectedRecipeID.set(0);
    } else {
      const ref = this.dialog.open(AddShoppingListRecipeModalComponent, {
        width: '80%',
        maxWidth: '540px',
        data: {
          shoppingListRecipes: this.listRecipes(),
          recipes: this.recipes(),
          shoppingListID: this.shoppingLists()[0].shoppingListID,
        },
      });
      // after the modal closes, trigger the 'loadShoppingListRecipes' action
      ref.afterClosed().subscribe(() => {
        this.store.dispatch(
          ShoppingListRecipeActions.loadShoppingListRecipes({
            shoppingListID: this.shoppingLists()[0].shoppingListID,
          })
        );
      });
    }
  }

  onItemButtonClick() {
    if (this.selectedSLIngrID() !== 0) {
      this.deleteStandaloneItem(this.selectedSLIngrID());
      this.selectedSLIngrID.set(0);
    } else {
      const ref = this.dialog.open(AddShoppingListIngredientModalComponent, {
        width: '75%',
        maxWidth: '520px',
        data: {
          shoppingListIngredients: this.displaySLStandaloneIngr(),
          ingredients: this.ingredients(),
          shoppingListID: this.shoppingLists()[0].shoppingListID,
        },
      });
      // after the modal closes, trigger the 'loadShoppingListIngredients' action
      ref.afterClosed().subscribe(() => {
        this.store.dispatch(
          ShoppingListIngredientActions.loadShoppingListIngredients({
            shoppingListID: this.shoppingLists()[0].shoppingListID,
          })
        );
      });
    }
  }

  deleteListRecipe(shoppingListRecipeID: number) {
    this.store.dispatch(
      ShoppingListRecipeActions.deleteShoppingListRecipe({
        shoppingListRecipeID: shoppingListRecipeID,
        shoppingListID: this.shoppingLists()[0].shoppingListID,
      })
    );
  }

  deleteStandaloneItem(shoppingListIngredientID: number) {
    this.store.dispatch(
      ShoppingListIngredientActions.deleteShoppingListIngredient({
        shoppingListIngredientID: shoppingListIngredientID,
        shoppingListID: this.shoppingLists()[0].shoppingListID,
      })
    );
  }

  async onShopClick() {
    this.isLoading.set(true);
    try {
      //for each of displaySLRecipeIngr, create a shoppingListIngredient. Wait for each to complete before creating the next one.
      const displaySLRecipeIngr = this.displaySLRecipeIngr();
      for (let i = 0; i < displaySLRecipeIngr.length; i++) {
        const result = await this.createShoppingListIngredient(
          this.shoppingLists()[0].shoppingListID,
          displaySLRecipeIngr[i].ingredientID,
          Math.ceil(displaySLRecipeIngr[i].quantity),
          displaySLRecipeIngr[i].unit,
          'recipe'
        );
        if (result === 'success') {
        } else {
          //throw the received error
          throw result;
        }
      }

      //update status of shoppingList to 'shopping'
      this.store.dispatch(
        ShoppingListActions.editShoppingList({
          shoppingList: {
            shoppingListID: this.shoppingLists()[0].shoppingListID,
            status: 'shopping',
          },
        })
      );

      //navigate to root shopping page
      this.router.navigate(['/groceries']);
    } catch (err) {
      console.log(err);
    }
  }

  async createShoppingListIngredient(
    shoppingListID: number,
    ingredientID: number,
    needMeasurement: number,
    needUnit: string,
    source: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.store.dispatch(
        ShoppingListIngredientActions.addShoppingListIngredient({
          shoppingListID: shoppingListID,
          ingredientID: ingredientID,
          needMeasurement: needMeasurement,
          needUnit: needUnit,
          source: source,
        })
      );
      combineLatest([
        this.store.select(selectAdding).pipe(map((adding) => !adding)),
        this.store.select(selectError),
      ])
        .pipe(
          first(([isNotAdding, error]) => isNotAdding || error != null),
          take(1) // Ensure the subscription completes after the first emission
        )
        .subscribe({
          next: ([isNotAdding, error]) => {
            if (error) {
              reject(error);
            } else if (isNotAdding) {
              resolve('success');
            }
          },
          error: (err) => reject(err),
        });
    });
  }
}
