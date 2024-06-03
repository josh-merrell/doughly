import {
  Component,
  Input,
  OnInit,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RecipeShoppingList,
} from 'src/app/recipes/state/recipe/recipe-state';
import { Store } from '@ngrx/store';
import { RecipeCategoryService } from 'src/app/recipes/data/recipe-category.service';
import { Router } from '@angular/router';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';


@Component({
  selector: 'dl-recipe-card',
  standalone: true,
  imports: [CommonModule, ImageFromCDN],
  templateUrl: './recipe-card.component.html',
})
export class RecipeCardComponent implements OnInit {
  @Input() recipe!: any;
  @Input() friendUserID!: string;
  // @Input() isUserRecipe!: boolean;
  @Input() isSelected: boolean = false;
  @Input() shoppingPage: boolean = false;
  @Input() inModal: boolean = false;
  @Input() fromMyRecipes: boolean = false;
  shoppingList: WritableSignal<RecipeShoppingList | null> = signal(null);
  profile: WritableSignal<any> = signal(null);

  constructor(
    private store: Store,
    private recipeCategoryService: RecipeCategoryService,
    private router: Router,
    private recipeService: RecipeService
  ) {
    effect(
      () => {
        const profile = this.profile();
        if (profile) {
          this.recipeService
            .getShoppingList(this.recipe.recipeID, profile.userID)
            .subscribe((shoppingList) => {
              this.shoppingList.set(shoppingList);
            });
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    if (this.recipe.plannedDate) {
      //convert yyyy-mm-dd 'plannedDate' to day of week string like "Monday"
      const date = new Date(this.recipe.plannedDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      this.recipe.plannedDate = dayOfWeek;
    }
  }
}
