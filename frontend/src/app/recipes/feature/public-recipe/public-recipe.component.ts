import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeIngredient } from '../../state/recipe-ingredient/recipe-ingredient-state';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import { RecipeTool } from '../../state/recipe-tool/recipe-tool-state';
import { RecipeStep } from '../../state/recipe-step/recipe-step-state';
import { RecipeService } from '../../data/recipe.service';
import { IngredientService } from 'src/app/kitchen/feature/ingredients/data/ingredient.service';
import {
  lastValueFrom,
} from 'rxjs';
import { ToolService } from 'src/app/kitchen/feature/tools/data/tool.service';
import { StepService } from '../../data/step.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { RecipeActions } from '../../state/recipe/recipe-actions';

@Component({
  selector: 'dl-public-recipe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-recipe.component.html',
})
export class PublicRecipeComponent {
  recipeID!: number;
  public ingredients: WritableSignal<Ingredient[]> = signal([]);
  public tools: WritableSignal<any[]> = signal([]);
  public steps: WritableSignal<any[]> = signal([]);

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private toolService: ToolService,
    private stepService: StepService
  ) {
    // //update ingredients when recipeIngredients changes
    // effect(() => {
    //   const recipeIngredients = this.recipeIngredients();
    //   const ingredientPromises = recipeIngredients.map((ingredient) =>
    //     lastValueFrom(this.ingredientService.getByID(ingredient.ingredientID))
    //   );
    //   Promise.allSettled(ingredientPromises).then((results) => {
    //     const ingredients = results
    //       .filter((result) => result.status === 'fulfilled')
    //       .map(
    //         (result) => (result as PromiseFulfilledResult<Ingredient>).value
    //       );
    //     this.ingredients.set(ingredients);
    //   });
    // });
    // //update tools when recipeTools changes
    // effect(() => {
    //   const recipeTools = this.recipeTools();
    //   const toolPromises = recipeTools.map((tool) =>
    //     lastValueFrom(this.toolService.getByID(tool.toolID))
    //   );
    //   Promise.allSettled(toolPromises).then((results) => {
    //     const tools = results
    //       .filter((result) => result.status === 'fulfilled')
    //       .map((result) => (result as PromiseFulfilledResult<any>).value);
    //     this.tools.set(tools);
    //   });
    // });
    // //update steps when recipeSteps changes
    // effect(() => {
    //   const recipeSteps = this.recipeSteps();
    //   const stepPromises = recipeSteps.map((step) =>
    //     lastValueFrom(this.stepService.getByID(step.stepID))
    //   );
    //   Promise.allSettled(stepPromises).then((results) => {
    //     const steps = results
    //       .filter((result) => result.status === 'fulfilled')
    //       .map((result) => (result as PromiseFulfilledResult<any>).value);
    //     this.steps.set(steps);
    //   });
    // });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.recipeID = +params.get('recipeID')!;
      this.store.dispatch(
        RecipeActions.loadRecipe({ recipeID: this.recipeID })
      );
      this.store.dispatch(RecipeActions.loadIngredients({ recipeID: this.recipeID }));
      this.store.dispatch(RecipeActions.loadTools({ recipeID: this.recipeID }));
      this.store.dispatch(RecipeActions.loadSteps({ recipeID: this.recipeID }));
    });
  }
}

