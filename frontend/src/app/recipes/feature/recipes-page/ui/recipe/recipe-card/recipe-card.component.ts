import {
  Component,
  Input,
  OnInit,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeShoppingList } from 'src/app/recipes/state/recipe/recipe-state';
import { Store } from '@ngrx/store';
import { RecipeCategoryService } from 'src/app/recipes/data/recipe-category.service';
import { Router } from '@angular/router';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'dl-recipe-card',
  standalone: true,
  imports: [CommonModule, ImageFromCDN, LottieComponent],
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
  isDark: boolean = false;

  // Lottie animation
  private animationItem: AnimationItem | undefined;
  private animation2Item: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: this.isDark
      ? '/assets/animations/lottie/imagePlaceholder-dark.json'
      : '/assets/animations/lottie/imagePlaceholder-light.json',
    loop: true,
    autoplay: true,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    // height: '40px',
    // width: '40px',
  };

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

  ngAfterViewInit(): void {
    // check document for 'dark' class to determine if dark mode is enabled
    this.isDark = document.body.classList.contains('dark');
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    // set timeout for random interval between 0 and 600 ms before starting animation
    setTimeout(() => {
      this.animationItem?.play();
    }, Math.floor(Math.random() * 600));
  }
  loopComplete(): void {
    // this.animationItem?.pause();
  }
}
