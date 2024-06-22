import {
  Component,
  Renderer2,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from '../../state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { RecipeCardComponent } from '../recipes-page/ui/recipe/recipe-card/recipe-card.component';
import { RecipeCategoryCardComponent } from '../recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { selectRecipeCategories } from '../../state/recipe-category/recipe-category-selectors';
import { Recipe } from '../../state/recipe/recipe-state';
import { selectDiscoverRecipes } from '../../state/recipe/recipe-selectors';
import { selectRecipeByID } from '../../state/recipe/recipe-selectors';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { filter, take } from 'rxjs';

import {
  selectError,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { StylesService } from 'src/app/shared/utils/stylesService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { DarkMode } from '@aparajita/capacitor-dark-mode';
import { ProductService } from 'src/app/shared/utils/productService';

@Component({
  selector: 'dl-discover-recipes',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './discover-recipes.component.html',
})
export class DiscoverRecipesComponent {
  public discoverRecipes: WritableSignal<Recipe[]> = signal([]);
  public selectedCategory: WritableSignal<RecipeCategory | null> = signal(null);
  private categories: WritableSignal<RecipeCategory[]> = signal([]);
  public dayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public worldCategories: WritableSignal<RecipeCategory[]> = signal([]);
  private profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  constructor(
    private store: Store,
    private router: Router,
    private stringsService: StringsService,
    public extraStuffService: ExtraStuffService,
    private modalService: ModalService,
    private renderer: Renderer2,
    private stylesService: StylesService,
    private authService: AuthService,
    private productService: ProductService
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
        const categories = this.categories();
        const recipes = this.discoverRecipes();

        // populate the 'recipes' array on each category with the recipes that belong to that category
        const categoriesWithRecipes = categories.map((category) => {
          const categoryWithRecipes = {
            ...category,
            recipes: recipes.filter(
              (recipe) => recipe.recipeCategoryID === category.recipeCategoryID
            ),
          };
          // sort the recipes by title
          categoryWithRecipes.recipes.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          categoryWithRecipes['recipeCount'] =
            categoryWithRecipes.recipes.length;
          return categoryWithRecipes;
        });

        // remove the 'Other' category
        const otherCategoryIndex = categoriesWithRecipes.findIndex(
          (category) => category.recipeCategoryID === 1
        );
        if (otherCategoryIndex !== -1) {
          categoriesWithRecipes.splice(otherCategoryIndex, 1);
        }

        this.categoryPlacement(categoriesWithRecipes);
      },
      { allowSignalWrites: true }
    );
  }
  ngOnInit(): void {
    // DarkMode.init().catch((err) => console.error(err));
    DarkMode.addAppearanceListener((darkMode: any) => {
      this.extraStuffService.systemDarkMode.set(darkMode.dark);
      if (this.authService.profile()!.darkMode !== 'System Default') {
        return;
      }
      if (darkMode.dark) {
        this.renderer.addClass(document.body, 'dark');
        this.renderer.removeClass(document.body, 'light');
        this.stylesService.updateStyles('#1F2933', 'dark');
      } else {
        this.renderer.addClass(document.body, 'light');
        this.renderer.removeClass(document.body, 'dark');
        this.stylesService.updateStyles('#FFFFFF', 'light');
      }
    });
    // if (Capacitor.isNativePlatform()) {
    //   this.setStatusBarStyleLight();
    // }

    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    this.store.select(selectDiscoverRecipes).subscribe((recipes) => {
      this.discoverRecipes.set(recipes);
    });
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
      this.checkProfilePerms(profile);
      const darkMode = profile.darkMode;
      if (darkMode === 'Enabled') {
        this.renderer.addClass(document.body, 'dark');
        this.renderer.removeClass(document.body, 'light');
        this.stylesService.updateStyles('#1F2933', 'dark');
      } else if (darkMode === 'Disabled') {
        this.renderer.addClass(document.body, 'light');
        this.renderer.removeClass(document.body, 'dark');
        this.stylesService.updateStyles('#FFFFFF', 'light');
      } else {
        // default is 'System Default'
        let darkModePreference: string;
        // get system dark mode preference
        DarkMode.isDarkMode().then((isDarkMode) => {
          this.extraStuffService.systemDarkMode.set(isDarkMode.dark);
          darkModePreference = isDarkMode.dark ? 'Enabled' : 'Disabled';
          if (this.authService.profile()!.darkMode !== 'System Default') {
            return;
          }
          if (darkModePreference === 'Enabled') {
            this.renderer.addClass(document.body, 'dark');
            this.renderer.removeClass(document.body, 'light');
            this.stylesService.updateStyles('#1F2933', 'dark');
          } else {
            this.renderer.addClass(document.body, 'light');
            this.renderer.removeClass(document.body, 'dark');
            this.stylesService.updateStyles('#FFFFFF', 'light');
          }
        });
      }
    });
  }

  onRecipeCardClick(recipeID: number): void {
    if (this.profile().onboardingState === 1) {
      this.onboardingHandler(1);
      return;
    } else if (this.profile().onboardingState === 2) {
      //save selected recipe to extraStuffService
      this.extraStuffService.onboardingPublicRecipe.set(recipeID);
      //need to advance onboarding state to 3
      this.store.dispatch(
        ProfileActions.updateProfileProperty({
          property: 'onboardingState',
          value: 3,
        })
      );
      this.store
        .select(selectUpdating)
        .pipe(
          filter((updating) => !updating),
          take(1)
        )
        .subscribe(() => {
          this.store
            .select(selectError)
            .pipe(take(1))
            .subscribe((error) => {
              if (error) {
                console.error(
                  `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
                );
              }
            });
        });
    }
    this.store
      .select(selectRecipeByID(recipeID))
      .subscribe((recipe: unknown) => {
        // Treat incoming data as unknown
        const typedRecipe = recipe as Recipe | undefined; // Assert the type
        if (typedRecipe && typedRecipe.userID === this.profile().userID) {
          this.router.navigate(['/recipe/', recipeID]);
        } else {
          // Else, navigate to the public recipe page
          this.router.navigate(['/recipe/public', recipeID]);
        }
      });
  }

  public scroll(element: any) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  categoryCardClick(category: any) {
    if (category.recipeCount === 0) return;
    const previouslySelected =
      this.selectedCategory()?.recipeCategoryID === category.recipeCategoryID;
    this.selectedCategory.set(previouslySelected ? null : category);
  }

  categoryPlacement(categories: RecipeCategory[]) {
    const dayCategoryIDs = [
      9, 4, 5, 6, 10, 13, 19, 20, 24, 25, 26, 27, 30, 32, 33,
    ];
    const dayCategories = categories.filter((category) =>
      dayCategoryIDs.includes(category.recipeCategoryID)
    );
    const worldCategories = categories.filter(
      (category) => !dayCategoryIDs.includes(category.recipeCategoryID)
    );
    this.dayCategories.set(dayCategories);
    this.worldCategories.set(worldCategories);
  }
  // ********************************

  onboardingHandler(onboardingState: number) {
    if (!onboardingState) return;
    if (onboardingState === 3) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      this.modalService.closeAll();
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.discoverPageOverview,
            currentStep: 3,
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
            this.onboardingCallback();
          }
        });
      }
    } else if (onboardingState === 7) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(false);
      this.modalService.closeAll();
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.onboardingComplete,
            currentStep: 7,
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
          this.showOnboardingBadge.set(false);
          // set onboardingState back to 0 (done)
          if (result === 'nextClicked')
            this.store.dispatch(
              ProfileActions.updateProfileProperty({
                property: 'onboardingState',
                value: 0,
              })
            );
          this.store
            .select(selectUpdating)
            .pipe(
              filter((updating) => !updating),
              take(1)
            )
            .subscribe(() => {
              this.store
                .select(selectError)
                .pipe(take(1))
                .subscribe((error) => {
                  if (error) {
                    console.error(
                      `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
                    );
                  } else {
                    this.showOnboardingBadge.set(false);
                  }
                });
            });
        });
      }
    } else {
      this.router.navigate(['/tempRoute']);
    }
    // ** OLD ONBOARDING STEPS **
    // if (onboardingState === 1) {
    //   this.reopenOnboardingModal.set(false);
    //   this.onboardingModalOpen.set(true);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.welcomeToDoughly,
    //         currentStep: 1,
    //         showNextButton: true,
    //       },
    //       position: {
    //         top: '50%',
    //       },
    //     },
    //     1
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe((result) => {
    //       this.showOnboardingBadge.set(true);
    //       this.onboardingModalOpen.set(false);
    //       if (result === 'nextClicked') {
    //         this.onboardingCallback();
    //       }
    //     });
    //   } else {
    //   }
    // } else if (onboardingState === 2) {
    //   this.reopenOnboardingModal.set(false);
    //   this.onboardingModalOpen.set(true);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.discoverPageOverview,
    //         currentStep: 2,
    //         showNextButton: false,
    //       },
    //       position: {
    //         top: '20%',
    //       },
    //     },
    //     1,
    //     true
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe(() => {
    //       this.onboardingModalOpen.set(false);
    //       this.showOnboardingBadge.set(true);
    //     });
    //   } else {
    //   }
    // } else this.router.navigate(['/tempRoute']);
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

  async checkProfilePerms(profile: any) {
    if (!profile || !profile.lastPermRefreshDate) return;
    // check if it's been more than 1 day since the last permission refresh
    const lastRefreshDate = new Date(profile.lastPermRefreshDate);
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - lastRefreshDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    if (daysDiff >= 1) {
      await this.productService.updatePermissions();
      // update lastPermRefreshDate
      this.store.dispatch(
        ProfileActions.updateProfileProperty({
          property: 'lastPermRefreshDate',
          value: new Date().toISOString(),
        })
      );
    }
  }
}
