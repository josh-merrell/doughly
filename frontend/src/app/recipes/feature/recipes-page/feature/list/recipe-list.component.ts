import {
  Input,
  Component,
  WritableSignal,
  signal,
  effect,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategoryCardComponent } from '../../ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from '../../ui/recipe/recipe-card/recipe-card.component';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { Location } from '@angular/common';

import {
  RecipeCategory,
  RecipeCategoryError,
} from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { AddRecipeModalComponent } from '../../ui/recipe/add-recipe-modal/add-recipe-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { RecipeIngredientError } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-state';
import { RecipeIngredientsModalComponent } from '../../ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { RecipeToolsModalComponent } from '../../ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { RecipeStepsModalComponent } from '../../ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { NavigationEnd, Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { PrompUpgradeModalComponent } from 'src/app/account/feature/products/ui/promp-upgrade-modal/promp-upgrade-modal.component';
import { filter, map } from 'rxjs';
import { StringsService } from 'src/app/shared/utils/strings';
import {
  selectProfile,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { ProfileActions } from 'src/app/profile/state/profile-actions';

function isRecipeCategoryError(obj: any): obj is RecipeCategoryError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeToolError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe-list',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent {
  @Input() type!: string;
  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef;
  showScrollDownArrow = false;
  showScrollUpArrow = false;

  public listView: WritableSignal<string> = signal('all');
  public searchFilter: WritableSignal<string> = signal('');
  public categories: WritableSignal<RecipeCategory[]> = signal([]);
  private profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  public filteredCategories = computed(() => {
    const searchFilter = this.searchFilter();
    const categories = this.categories();
    if (searchFilter) {
      return categories.filter((category) => {
        return category.name.toLowerCase().includes(searchFilter.toLowerCase());
      });
    } else {
      return categories;
    }
  });
  public displayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public recipes: WritableSignal<Recipe[]> = signal([]);
  public freeTierRecipeCount: WritableSignal<number> = signal(0);
  displayRecipes = computed(() => {
    let recipes = this.recipes();
    const profile = this.profile();
    const categories = this.displayCategories();

    // if user does not have premium membership, only show repices where 'freeTier' is true
    if (profile && profile.permRecipeCreateUnlimited === false) {
      recipes = recipes.filter((recipe) => {
        return recipe.freeTier === true;
      });
    }

    const recipesWithCategoryName = recipes.map((recipe) => {
      const category = categories.find((category) => {
        return category.recipeCategoryID === recipe.recipeCategoryID;
      });
      return {
        ...recipe,
        recipeCategoryName: category?.name,
      };
    });
    return recipesWithCategoryName;
  });
  public filteredRecipes = computed(() => {
    const searchFilter = this.searchFilter();
    const recipes = this.displayRecipes().sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    if (searchFilter) {
      return recipes.filter((recipe) => {
        return (
          recipe.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          recipe.recipeCategoryName
            ?.toLowerCase()
            .includes(searchFilter.toLowerCase())
        );
      });
    } else {
      return recipes;
    }
  });

  constructor(
    private router: Router,
    private store: Store,
    private location: Location,
    private stringsService: StringsService,
    private productService: ProductService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService
  ) {
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
        const filteredCategories = this.filteredCategories();
        let recipes = this.recipes();

        let newCategories: RecipeCategory[] = filteredCategories.map(
          (category) => {
            const recipeCount = recipes.filter((recipe) => {
              return recipe.recipeCategoryID === category.recipeCategoryID;
            }).length;

            return {
              ...category,
              recipeCount: recipeCount,
            };
          }
        );
        newCategories = newCategories.filter((category) => {
          return category.recipeCount !== 0;
        });
        this.displayCategories.set(
          newCategories.sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    // Check the initial URL
    this.checkUrlAndAct(this.router.url);

    // Listen for future URL changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        map((event) => event as NavigationEnd)
      )
      .subscribe((navigationEndEvent) => {
        this.checkUrlAndAct(navigationEndEvent.urlAfterRedirects);
      });

    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectRecipes).subscribe((recipes) => {
      recipes = recipes.filter((recipe) => {
        return this.type === 'subscription'
          ? recipe.type === 'subscription'
          : recipe.type !== 'subscription';
      });

      this.recipes.set(
        [...recipes].sort((a, b) => a.title.localeCompare(b.title))
      );
      this.freeTierRecipeCount.set(
        recipes.filter((recipe) => recipe.freeTier === true).length
      );
    });
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  ngAfterViewInit(): void {
    const checkScrollHeight = () => {
      const childHeight = Array.from(
        this.scrollContainer.nativeElement.children as HTMLElement[]
      ).reduce((height, child: HTMLElement) => height + child.clientHeight, 0);
      this.showScrollDownArrow =
        childHeight > this.scrollContainer.nativeElement.clientHeight;
    };
    checkScrollHeight();
  }

  private checkUrlAndAct(fullUrl: string) {
    if (fullUrl.includes('/add')) {
      this.onAddClick();
    }
    // Any other URL checks can be added here
  }

  checkScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showScrollUpArrow = element.scrollTop > 0;
      this.showScrollDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  //** INTERACTIVITY FUNCTIONS **************************
  setListView(listView: string) {
    this.listView.set(listView);
    this.searchFilter.set('');
  }
  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
  onAddClick(): void {
    let allowCreate = false;
    // check perms for profile
    const license =
      this.type === 'subscription'
        ? this.productService.licences.recipeSubscribeLimit
        : this.productService.licences.recipeCreateLimit;

    if (this.profile() && this.profile().permRecipeCreateUnlimited === false) {
      if (license <= this.freeTierRecipeCount()) {
        // open upgradePromptModal
        const ref = this.modalService.open(
          PrompUpgradeModalComponent,
          {
            data: {
              titleMessage: this.stringsService.productStrings.timeToUpgrade,
              promptMessage: `You have reached the number of allowed free-tier Created Recipes. Please upgrade to create more.`,
              buttonMessage: 'UPGRADE',
            },
          },
          1
        );
        if (ref) {
          ref.afterClosed().subscribe((result) => {
            if (result === 'routeToUpgrade') {
              this.router.navigate(['/products']);
            }
          });
        } else {
        }
      } else {
        allowCreate = true;
      }
    } else {
      allowCreate = true;
    }

    if (allowCreate) {
      // update url to include '/add' if it's not already there
      this.location.go('/recipes/created/add');
      console.log('OPEN ADD RECIPE MODAL')
      const ref = this.modalService.open(
        AddRecipeModalComponent,
        {
          data: {
            recipeCategories: this.categories(),
          },
          width: '80%',
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.closeAll();
            this.modalService.open(
              ConfirmationModalComponent,
              {
                data: {
                  confirmationMessage: `Recipe added successfully.`,
                },
              },
              1,
              true
            );
          }
          // remove '/add' from the url
          this.location.go('/recipes/created');
        });
      } else {
      }
    }
  }
  categoryCardClick(category: RecipeCategory): void {
    this.updateSearchFilter(category.name);
    this.listView.set('all');
  }
  recipeCardClick(recipe: Recipe) {
    if (recipe.status === 'noIngredients') {
      //if the recipe status of 'noIngredients', show the 'RecipeIngredients' modal
      const ref = this.modalService.open(
        RecipeIngredientsModalComponent,
        {
          data: {
            recipe,
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              AddRequestConfirmationModalComponent,
              {
                data: {
                  results: result,
                  addSuccessMessage: 'Recipe Ingredients added successfully!',
                },
              },
              1,
              true
            );
          } else if (isRecipeIngredientError(result)) {
            this.modalService.open(
              AddRequestErrorModalComponent,
              {
                data: {
                  error: result,
                  addFailureMessage: 'Recipe Ingredients could not be added.',
                },
              },
              1,
              true
            );
          }
        });
      } else {
      }
    } else if (recipe.status === 'noTools') {
      //else if the recipe has status of 'noTools', show the 'addRecipeTools' modal
      const ref = this.modalService.open(
        RecipeToolsModalComponent,
        {
          data: {
            recipe,
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              AddRequestConfirmationModalComponent,
              {
                data: {
                  results: result,
                  addSuccessMessage: 'Recipe Tools added successfully!',
                },
              },
              1,
              true
            );
          } else if (isRecipeToolError(result)) {
            this.modalService.open(
              AddRequestErrorModalComponent,
              {
                data: {
                  error: result,
                  addFailureMessage: 'Recipe Tools could not be added.',
                },
              },
              1,
              true
            );
          }
        });
      } else {
      }
    } else if (recipe.status === 'noSteps') {
      //else if the recipe has status of 'noSteps', show the 'addRecipeSteps' modal
      const ref = this.modalService.open(
        RecipeStepsModalComponent,
        {
          data: {
            recipe,
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              AddRequestConfirmationModalComponent,
              {
                data: {
                  results: result,
                  addSuccessMessage: 'Recipe Steps added successfully!',
                },
              },
              1,
              true
            );
          } else if (isRecipeStepError(result)) {
            this.modalService.open(
              AddRequestErrorModalComponent,
              {
                data: {
                  error: result,
                  addFailureMessage: 'Recipe Steps could not be added.',
                },
              },
              1,
              true
            );
          }
        });
      } else {
      }
    } else {
      this.router.navigate(['/recipe', recipe.recipeID]);
    }
  }

  // ***************************************************

  onboardingHandler(onboardingState: number): void {
    if (onboardingState === 4) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      console.log('OPEN ONBOARDING MODAL');
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.recipesCreatedPage,
            currentStep: 4,
            showNextButton: true,
          },
          position: {
            top: '30%',
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(true);
          if (result === 'nextClicked') {
            this.router.navigate(['/tempRoute']);
          }
        });
      }
    } else if (onboardingState === 5) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.recipeCreateOverview,
            currentStep: 5,
            showNextButton: true,
          },
          position: {
            bottom: '10%',
          },
        },
        2
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          if (result === 'nextClicked') {
            this.modalService.closeAll();
            this.router.navigate(['/tempRoute']);
          } else this.showOnboardingBadge.set(false);
        });
      }
    } else {
      this.router.navigate(['/tempRoute']);
    }
    // ** OLD ONBOARDING STEPS **
    // if (onboardingState === 8) {
    //   this.showOnboardingBadge.set(false);
    //   this.reopenOnboardingModal.set(false);
    //   this.onboardingModalOpen.set(true);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.recipesCreatedPage,
    //         currentStep: 8,
    //         showNextButton: true,
    //       },
    //       position: {
    //         bottom: '30%',
    //       },
    //     },
    //     1
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe((result) => {
    //       this.router.navigate(['/tempRoute']);
    //     });
    //   } else {
    //   }
    // }
  }

  onboardingCallback() {
    setTimeout(() => {
      console.log(`ONBOARDING STATE: ${this.profile().onboardingState}`);
      this.onboardingHandler(this.profile().onboardingState);
    }, 1000);
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
