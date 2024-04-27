import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
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
import {
  selectDeleting as selectDeletingShoppingList,
  selectShoppingLists,
  selectError as selectErrorShoppingList,
  selectUpdating as selectUpdatingShoppingList,
} from '../../state/shopping-list-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { ShoppingListRecipeActions } from '../../state/shopping-list-recipe-actions';
import { AddShoppingListRecipeModalComponent } from '../../ui/add-shopping-list-recipe-modal/add-shopping-list-recipe-modal.component';
import { MatDialog } from '@angular/material/dialog';
import {
  selectAdding as selectAddingShoppingListIngredient,
  selectError as selectErrorShoppingListIngredient,
  selectDeleting as selectDeletingShoppingListIngredient,
  selectShoppingListIngredients,
} from '../../state/shopping-list-ingredient-selectors';
import {
  selectError as selectErrorShoppingListRecipe,
  selectDeleting as selectDeletingShoppingListRecipe,
} from '../../state/shopping-list-recipe-selectors';
import { ShoppingListIngredientActions } from '../../state/shopping-list-ingredient-actions';
import { AddShoppingListIngredientModalComponent } from '../../ui/add-shopping-list-ingredient-modal/add-shopping-list-ingredient-modal.component';
import { combineLatest, filter, first, map, take, tap } from 'rxjs';
import { ShoppingListActions } from '../../state/shopping-list-actions';
import { Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

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
  public isDeleting: WritableSignal<boolean> = signal(false);
  @ViewChild('menu') rowItemMenu!: ElementRef;
  menuOpen: boolean = false;
  globalClickListener: () => void = () => {};

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
    return result.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  });

  // **reactive state signals**
  individualShoppingLists: WritableSignal<Map<number, any>> = signal(new Map());
  public isLoading: WritableSignal<boolean> = signal(false);
  allFetchesComplete: WritableSignal<boolean> = signal(false);
  selectedRecipeID: WritableSignal<number> = signal(0);
  selectedSLIngrID: WritableSignal<number> = signal(0);

  constructor(
    public dialog: MatDialog,
    private renderer: Renderer2,
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

    effect(
      () => {
        const lr = this.listRecipes();
        for (let i = 0; i < lr.length; i++) {
          //if the 'plannedDate' property of the listRecipe is prior to today, call the 'deleteListRecipe' method
          const now = new Date(
            new Date().toLocaleDateString('en-US')
          ).getTime();
          const plannedDate = new Date(
            new Date(lr[i].plannedDate).toLocaleDateString('en-US')
          ).getTime();
          if (plannedDate < now) {
            console.log(
              'deleting list recipe due to date. PLANNED: ',
              plannedDate,
              ' NOW: ',
              now
            );
            this.deleteListRecipe(lr[i].shoppingListRecipeID, 'date');
          }
        }
      },
      { allowSignalWrites: true }
    );

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

      return result.sort((a, b) => {
        if (a.ingredientName < b.ingredientName) {
          return -1;
        } else if (a.ingredientName > b.ingredientName) {
          return 1;
        }
        return 0;
      });
    }
  }

  // LIFECYCLE HOOKS  *********************************
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
  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.rowItemMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.rowItemMenu) {
          this.closeMenu();
        }
      }
    );
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
        width: '90%',
        data: {
          shoppingListRecipes: this.listRecipes(),
          recipes: this.recipes(),
          shoppingListID: this.shoppingLists()[0].shoppingListID,
        },
      });
      // after the modal closes, trigger the 'loadShoppingListRecipes' action
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(ConfirmationModalComponent, {
            maxWidth: '380px',
            data: {
              confirmationMessage: 'Recipe added to shopping list',
            },
          });
        }
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
        data: {
          shoppingListIngredients: this.displaySLStandaloneIngr(),
          ingredients: this.ingredients(),
          shoppingListID: this.shoppingLists()[0].shoppingListID,
        },
      });
      // after the modal closes, trigger the 'loadShoppingListIngredients' action
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(ConfirmationModalComponent, {
            maxWidth: '380px',
            data: {
              confirmationMessage:
                'Standalone Ingredient added to shopping list',
            },
          });
        }
        this.store.dispatch(
          ShoppingListIngredientActions.loadShoppingListIngredients({
            shoppingListID: this.shoppingLists()[0].shoppingListID,
          })
        );
      });
    }
  }

  // INTERACTIVITY FUNCTIONS **************************
  onDeleteClick() {
    this.closeMenu();
    this.isDeleting.set(true);
    this.store.dispatch(
      ShoppingListActions.deleteShoppingList({
        shoppingListID: this.shoppingLists()[0].shoppingListID,
      })
    );
    this.store
      .select(selectDeletingShoppingList)
      .pipe(
        filter((deleting) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingList)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Failed to delete shopping list: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              this.dialog.open(ConfirmationModalComponent, {
                maxWidth: '380px',
                data: {
                  confirmationMessage: 'Shopping list deleted',
                },
              });
            }
            this.isDeleting.set(false);
          });
      });
  }

  closeMenu() {
    this.menuOpen = false;
  }
  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  deleteListRecipe(shoppingListRecipeID: number, reason?: string) {
    this.isDeleting.set(true);
    this.store.dispatch(
      ShoppingListRecipeActions.deleteShoppingListRecipe({
        shoppingListRecipeID: shoppingListRecipeID,
        shoppingListID: this.shoppingLists()[0].shoppingListID,
      })
    );
    this.store
      .select(selectDeletingShoppingListRecipe)
      .pipe(
        filter((deleting) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingListRecipe)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Failed to remove recipe from shopping list: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              if (reason === 'date') {
                console.log('deleting list recipe due to date');
                this.dialog.open(ConfirmationModalComponent, {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage:
                      'Removed recipe planned for a past date',
                  },
                });
              }
              this.dialog.open(ConfirmationModalComponent, {
                maxWidth: '380px',
                data: {
                  confirmationMessage: 'Recipe removed from shopping list',
                },
              });
            }
            this.isDeleting.set(false);
          });
      });
  }

  deleteStandaloneItem(shoppingListIngredientID: number) {
    this.isDeleting.set(true);
    this.store.dispatch(
      ShoppingListIngredientActions.deleteShoppingListIngredient({
        shoppingListIngredientID: shoppingListIngredientID,
        shoppingListID: this.shoppingLists()[0].shoppingListID,
      })
    );
    this.store
      .select(selectDeletingShoppingListIngredient)
      .pipe(
        filter((deleting) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingListIngredient)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Failed to remove standalone ingredient from shopping list: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              this.dialog.open(ConfirmationModalComponent, {
                maxWidth: '380px',
                data: {
                  confirmationMessage:
                    'Standalone ingredient removed from shopping list',
                },
              });
            }
            this.isDeleting.set(false);
          });
      });
  }

  async onShopClick() {
    this.isLoading.set(true);
    try {
      const displaySLRecipeIngr = this.displaySLRecipeIngr();
      //use batchCreateShoppingListIngredients to create all shoppingListIngredients at once. Do this by calling the ShoppingListIngredientActions.batchAddShoppingListIngredients action.
      const ingredients = displaySLRecipeIngr.map((ingr) => {
        return {
          ingredientID: ingr.ingredientID,
          needMeasurement: Math.ceil(ingr.quantity),
          needUnit: ingr.unit,
          source: 'recipe',
        };
      });
      if (ingredients.length) {
        this.store.dispatch(
          ShoppingListIngredientActions.batchAddShoppingListIngredients({
            shoppingListID: this.shoppingLists()[0].shoppingListID,
            ingredients: ingredients,
          })
        );
        //subscribe to selectAdding. When it is false, use selectError to check if there was an error. If there was, throw the error. If there wasn't, continue.
        combineLatest([
          this.store
            .select(selectAddingShoppingListIngredient)
            .pipe(map((adding) => !adding)),
          this.store.select(selectErrorShoppingListIngredient),
        ])
          .pipe(
            first(([isNotAdding, error]) => isNotAdding || error != null),
            take(1),
            tap(([isNotAdding, error]) => {
              if (error) {
                // Handle the error here
                console.error(
                  `Error creating shopping list ingredients for recipes on list: ${JSON.stringify(
                    error
                  )}`
                );
                this.isLoading.set(false);
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: `Error creating shopping list ingredients for recipes on list: ${JSON.stringify(
                      error
                    )}`,
                    statusCode: '500',
                  },
                });
              }
              if (isNotAdding) {
                this.store.dispatch(
                  ShoppingListActions.editShoppingList({
                    shoppingListID: this.shoppingLists()[0].shoppingListID,
                    status: 'shopping',
                  })
                );
                this.store
                  .select(selectUpdatingShoppingList)
                  .pipe(
                    filter((updating) => !updating),
                    take(1)
                  )
                  .subscribe(() => {
                    this.store
                      .select(selectErrorShoppingList)
                      .pipe(take(1))
                      .subscribe((error) => {
                        if (error) {
                          console.error(
                            `Error updating shopping list status to 'shopping': ${JSON.stringify(
                              error
                            )}`
                          );
                          this.isLoading.set(false);
                          this.dialog.open(ErrorModalComponent, {
                            maxWidth: '380px',
                            data: {
                              errorMessage: `Error updating shopping list status to 'shopping': ${JSON.stringify(
                                error
                              )}`,
                              statusCode: '500',
                            },
                          });
                        } else {
                          this.router.navigate(['/groceries']);
                        }
                      });
                  });
              }
            })
          )
          .subscribe();
      } else {
        this.store.dispatch(
          ShoppingListActions.editShoppingList({
            shoppingListID: this.shoppingLists()[0].shoppingListID,
            status: 'shopping',
          })
        );
        this.router.navigate(['/groceries']);
      }
    } catch (err) {
      console.error(
        `Error creating shopping list ingredients: ${JSON.stringify(err)}`
      );
      this.isLoading.set(false);
      this.dialog.open(ErrorModalComponent, {
        maxWidth: '380px',
        data: {
          errorMessage: `Error creating shopping list ingredients: ${JSON.stringify(
            err
          )}`,
          statusCode: '500',
        },
      });
    }
  }
}
