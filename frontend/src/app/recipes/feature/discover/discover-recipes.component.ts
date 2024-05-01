import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
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
import { MatDialog } from '@angular/material/dialog';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
@Component({
  selector: 'dl-discover-recipes',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './discover-recipes.component.html',
})
export class DiscoverRecipesComponent {
  public discoverRecipes: WritableSignal<Recipe[]> = signal([]);
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public selectedCategory: WritableSignal<RecipeCategory | null> = signal(null);
  private categories: WritableSignal<RecipeCategory[]> = signal([]);
  public dayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public worldCategories: WritableSignal<RecipeCategory[]> = signal([]);
  private profile: WritableSignal<any> = signal(null);

  constructor(
    private store: Store,
    private router: Router,
    private el: ElementRef,
    private dialog: MatDialog,
    private stringsService: StringsService
  ) {
    effect(() => {
      const profile = this.profile();
      if (!profile || profile.onboardingState === 0) return;
      this.onboardingHandler(profile.onboardingState);
    });
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
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    this.store.select(selectDiscoverRecipes).subscribe((recipes) => {
      this.discoverRecipes.set(recipes);
    });
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
  }

  onRecipeCardClick(recipeID: number): void {
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
    if (onboardingState === 1) {
      const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
        data: {
          message: this.stringsService.onboardingStrings.welcomeToDoughly,
        },
        position: {
          top: '40%',
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.showOnboardingBadge.set(true);
        console.log('showOnboardingBadge', this.showOnboardingBadge());
      });
    }
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
