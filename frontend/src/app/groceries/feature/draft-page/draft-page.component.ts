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
import {
  selectError,
  selectShoppingListRecipes,
} from '../../state/shopping-list-recipe-selectors';
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
  selectUpdating,
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
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { UnitService } from 'src/app/shared/utils/unitService';
import { selectSharedShoppingLists } from '../../state/sharedShoppingLists/shared-shopping-list-selectors';
import { NgAutoAnimateDirective } from 'ng-auto-animate';

@Component({
  selector: 'dl-draft-page',
  standalone: true,
  imports: [
    CommonModule,
    RecipeCardComponent,
    AddShoppingListRecipeModalComponent,
    MatProgressSpinnerModule,
    NgAutoAnimateDirective,
  ],
  templateUrl: './draft-page.component.html',
})
export class DraftPageComponent {
  Math = Math;
  public isDeleting: WritableSignal<boolean> = signal(false);
  view: WritableSignal<string>;
  @ViewChild('menu') rowItemMenu!: ElementRef;
  menuOpen: boolean = false;
  globalClickListener: () => void = () => {};

  public shoppingLists: WritableSignal<any> = signal([]);
  public sharedShoppingLists: WritableSignal<any> = signal([]);
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
  private profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  constructor(
    public dialog: MatDialog,
    private renderer: Renderer2,
    private store: Store,
    private recipeService: RecipeService,
    public router: Router,
    private stringsService: StringsService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService,
    public unitService: UnitService,
    private route: ActivatedRoute
  ) {
    this.view = signal('draft');
    effect(
      () => {
        const view = this.view();
        if (view === 'shared') {
          this.router.navigate(['groceries/shared']);
        } else {
          this.view.set('draft');
          this.router.navigate(['groceries/draft']);
        }
      },
      { allowSignalWrites: true }
    );
    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
        if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
          this.onboardingHandler(profile.onboardingState);
        }
      },
      { allowSignalWrites: true }
    );
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
            .getShoppingList(
              recipe.recipeID,
              this.profile().checkIngredientStock,
              new Date(recipe.plannedDate)
            )
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
    this.checkAndUpdateView();
    this.store.select(selectProfile).subscribe((profile) => {
      if (profile.onboardingState !== 0) {
        this.showOnboardingBadge.set(true);
      }
      this.profile.set(profile);
    });
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
    });
    this.store
      .select(selectSharedShoppingLists)
      .subscribe((sharedShoppingLists: any) => {
        this.sharedShoppingLists.set(sharedShoppingLists);
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
  private checkAndUpdateView() {
    const childRoute = this.route.snapshot.firstChild;
    const childSegment = childRoute ? childRoute.url[0]?.path : 'draft';
    this.view.set(childSegment);
  }
  updateView(view: string) {
    this.view.set(view);
  }
  // ngAfterViewInit() {
  //   this.globalClickListener = this.renderer.listen(
  //     'document',
  //     'click',
  //     (event) => {
  //       const clickedInside = this.rowItemMenu?.nativeElement.contains(
  //         event.target
  //       );
  //       if (!clickedInside && this.rowItemMenu) {
  //         this.closeMenu();
  //       }
  //     }
  //   );
  // }

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
      const ref = this.modalService.open(
        AddShoppingListRecipeModalComponent,
        {
          width: '90%',
          data: {
            shoppingListRecipes: this.listRecipes(),
            recipes: this.recipes(),
            shoppingListID: this.shoppingLists()[0].shoppingListID,
          },
        },
        1,
        false,
        'AddShoppingListRecipeModalComponent'
      );

      if (ref) {
        // after the modal closes, trigger the 'loadShoppingListRecipes' action
        ref.afterClosed().subscribe((result) => {
          if (result === 'successOnboarding') {
            this.modalService.open(
              ConfirmationModalComponent,
              {
                maxWidth: '380px',
                data: {
                  confirmationMessage: 'Recipe added to shopping list',
                },
              },
              1,
              true,
              'ConfirmationModalComponent'
            );
            if (this.profile().onboardingState === 7) {
              this.store.dispatch(
                ProfileActions.updateProfileProperty({
                  property: 'onboardingState',
                  value: 8,
                })
              );
            }
          }
          this.store.dispatch(
            ShoppingListRecipeActions.loadShoppingListRecipes({
              shoppingListID: this.shoppingLists()[0].shoppingListID,
            })
          );
        });
      } else {
      }
    }
  }

  onItemButtonClick() {
    if (this.selectedSLIngrID() !== 0) {
      this.deleteStandaloneItem(this.selectedSLIngrID());
      this.selectedSLIngrID.set(0);
    } else {
      const ref = this.modalService.open(
        AddShoppingListIngredientModalComponent,
        {
          data: {
            shoppingListIngredients: this.displaySLStandaloneIngr(),
            ingredients: this.ingredients(),
            shoppingListID: this.shoppingLists()[0].shoppingListID,
          },
        },
        1,
        false,
        'AddShoppingListIngredientModalComponent'
      );
      // after the modal closes, trigger the 'loadShoppingListIngredients' action
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              ConfirmationModalComponent,
              {
                maxWidth: '380px',
                data: {
                  confirmationMessage:
                    'Standalone Ingredient added to shopping list',
                },
              },
              1,
              true,
              'ConfirmationModalComponent'
            );
          }
          this.store.dispatch(
            ShoppingListIngredientActions.loadShoppingListIngredients({
              shoppingListID: this.shoppingLists()[0].shoppingListID,
            })
          );
        });
      } else {
      }
    }
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
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                1,
                true,
                'ErrorModalComponent'
              );
            } else {
              if (reason === 'date') {
                console.log('deleting list recipe due to date');
                this.modalService.open(
                  ConfirmationModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      confirmationMessage:
                        'Removed recipe planned for a past date',
                    },
                  },
                  1,
                  true,
                  'ConfirmationModalComponent'
                );
              }
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage: 'Recipe removed from shopping list',
                  },
                },
                1,
                true,
                'ConfirmationModalComponent'
              );
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
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                1,
                true,
                'ErrorModalComponent'
              );
            } else {
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage:
                      'Standalone ingredient removed from shopping list',
                  },
                },
                1,
                true,
                'ConfirmationModalComponent'
              );
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
                this.modalService.open(
                  ErrorModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      errorMessage: `Error creating shopping list ingredients for recipes on list: ${JSON.stringify(
                        error
                      )}`,
                      statusCode: '500',
                    },
                  },
                  1,
                  false,
                  'ErrorModalComponent'
                );
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
                          this.modalService.open(
                            ErrorModalComponent,
                            {
                              maxWidth: '380px',
                              data: {
                                errorMessage: `Error updating shopping list status to 'shopping': ${JSON.stringify(
                                  error
                                )}`,
                                statusCode: '500',
                              },
                            },
                            1,
                            false,
                            'ErrorModalComponent'
                          );
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
      this.modalService.open(
        ErrorModalComponent,
        {
          maxWidth: '380px',
          data: {
            errorMessage: `Error creating shopping list ingredients: ${JSON.stringify(
              err
            )}`,
            statusCode: '500',
          },
        },
        1,
        false,
        'ErrorModalComponent'
      );
    }
  }

  onboardingHandler(onboardingState: number) {
    if (onboardingState === 6) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.shoppingPageOverview,
            currentStep: 6,
            showNextButton: true,
          },
          position: {
            top: '50%',
          },
        },
        1,
        false,
        'OnboardingMessageModalComponent'
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(true);
          if (result === 'nextClicked') {
            this.onboardingCallback();
          }
        });
      }
    } else {
      this.router.navigate(['/tempRoute']);
    }
  }

  onboardingCallback() {
    setTimeout(() => {
      this.onboardingHandler(this.profile().onboardingState);
    }, 1000);
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
