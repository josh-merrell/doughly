import {
  Component,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { selectRecipeCategoryByID } from '../../../state/recipe-category/recipe-category-selectors';
import { MatDialog } from '@angular/material/dialog';
import {
  RecipeIngredient,
} from '../../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeService } from '../../../data/recipe.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ProfileService } from 'src/app/profile/data/profile.service';
import { RecipeCategoryActions } from 'src/app/recipes/state/recipe-category/recipe-category-actions';
import { RecipeIngredientService } from 'src/app/recipes/data/recipe-ingredients.service';
import { IngredientService } from 'src/app/kitchen/feature/ingredients/data/ingredient.service';
import { ToolService } from 'src/app/kitchen/feature/tools/data/tool.service';
import { RecipeToolService } from 'src/app/recipes/data/recipe-tool.service';
import { RecipeStepService } from 'src/app/recipes/data/recipe-step.service';
import { StepService } from 'src/app/recipes/data/step.service';
import { FriendModalComponent } from 'src/app/social/feature/friends/ui/friend-modal/friend-modal.component';
import { SubscribeRecipeModalComponent } from '../ui/subscribe-recipe-modal/subscribe-recipe-modal.component';

@Component({
  selector: 'dl-public-recipe',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    SubscribeRecipeModalComponent,
  ],
  templateUrl: './public-recipe.component.html',
})
export class PublicRecipeComponent {
  recipeID: WritableSignal<number> = signal(0);
  public recipe: WritableSignal<any> = signal(null);
  public recipeCategory: WritableSignal<RecipeCategory | null> = signal(null);
  public author: WritableSignal<any> = signal(null);
  public initials: WritableSignal<string> = signal('');
  ingredients: WritableSignal<any[]> = signal([]);
  recipeIngredients: WritableSignal<RecipeIngredient[]> = signal([]);
  displayIngredients = computed(() => {
    const recipeIngredients = this.recipeIngredients();
    const ingredients = this.ingredients();
    if (!recipeIngredients || !ingredients) return [];
    const newIngredients = ingredients.map((i) => {
      const ri = recipeIngredients.find(
        (ri) => ri.ingredientID === i.ingredientID
      );
      if (!ri) return null;
      return {
        ...i,
        measurement: ri.measurement,
        measurementUnit: ri.measurementUnit,
      };
    });
    return newIngredients;
  });
  ready = computed(() => {
    if (
      this.recipe() &&
      this.displayIngredients() &&
      this.steps() &&
      this.tools()
    )
      return true;
    return false;
  });
  tools: WritableSignal<any[]> = signal([]);
  recipeTools: WritableSignal<any[]> = signal([]);
  steps: WritableSignal<any[]> = signal([]);
  recipeSteps: WritableSignal<any[]> = signal([]);

  subscribed: WritableSignal<boolean> = signal(false);

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    public dialog: MatDialog,
    private router: Router,
    private recipeService: RecipeService,
    private profileService: ProfileService,
    private recipeIngredientService: RecipeIngredientService,
    private ingredientService: IngredientService,
    private toolService: ToolService,
    private recipeToolService: RecipeToolService,
    private recipeStepService: RecipeStepService,
    private stepService: StepService
  ) {
    effect(
      () => {
        const recipeID = this.recipeID();
        this.recipeService.getByID(recipeID).subscribe((recipeData) => {
          if (!recipeData[0]) return;
          this.recipe.set(recipeData[0]);
        });
        this.recipeIngredientService
          .getByRecipeID(recipeID)
          .subscribe((data) => {
            if (!data) return;
            this.recipeIngredients.set(data);
          });
        this.recipeToolService.getByRecipeID(recipeID).subscribe((data) => {
          if (!data) return;
          this.recipeTools.set(data);
        });
        this.recipeStepService.getByRecipeID(recipeID).subscribe((data) => {
          if (!data) return;
          this.recipeSteps.set(data);
        });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipe = this.recipe();
        if (!recipe) return;
        this.profileService.getProfile(recipe.userID).subscribe((profile) => {
          this.author.set(profile);
          this.initials.set(
            profile.nameFirst.charAt(0) + profile.nameLast.charAt(0)
          );
        });
        this.store
          .select(selectRecipeCategoryByID(recipe.recipeCategoryID))
          .subscribe((recipeCategory) => {
            this.recipeCategory.set(recipeCategory);
          });
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const recipeIngredients = this.recipeIngredients();
      if (!recipeIngredients) return;
      recipeIngredients.forEach((ri) => {
        this.ingredientService.getByID(ri.ingredientID).subscribe((data) => {
          this.ingredients.set([...this.ingredients(), data[0]]);
        });
      });
    });

    effect(() => {
      const recipeTools = this.recipeTools();
      if (!recipeTools) return;
      recipeTools.forEach((rt) => {
        if (rt.quantity === -1) return; // this is a placeholder for noTools, don't try to retrieve it
        this.toolService.getByID(rt.toolID).subscribe((data) => {
          this.tools.set([...this.tools(), data[0]]);
        });
      });
    });

    effect(() => {
      const recipeSteps = this.recipeSteps();
      if (!recipeSteps) return;
      recipeSteps.forEach((rs) => {
        this.stepService.getByID(rs.stepID).subscribe((data) => {
          if (!data) return;
          this.steps.set([...this.steps(), data]);
        });
      });
    });
  }

  ngOnInit(): void {
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
    this.route.paramMap.subscribe((params) => {
      this.recipeID.set(Number(params.get('recipeID')!));
    });
  }

  onFriendClick(friend: any): void {
    this.dialog.open(FriendModalComponent, {
      data: friend,
      width: '80%',
      maxWidth: '540px',
    });
  }

  timeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours === 0) return `${minutes} m`;
    const mins = minutes % 60;
    return `${hours} h ${mins} m`;
  }

  onSubscribeClick() {
    console.log('subscribe clicked');
    this.dialog.open(SubscribeRecipeModalComponent, {
      data: {
        recipe: this.recipe(),
        ingredients: this.displayIngredients(),
        tools: this.tools(),
        steps: this.steps(),
        author: this.author(),
      },
      width: '90%',
      maxWidth: '640px',
      maxHeight: '840px',
    });
  }
}
