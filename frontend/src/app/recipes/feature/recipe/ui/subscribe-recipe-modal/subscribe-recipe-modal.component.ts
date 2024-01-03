import {
  Component,
  Inject,
  WritableSignal,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IngredientActions } from 'src/app/kitchen/feature/ingredients/state/ingredient-actions';
import { Store } from '@ngrx/store';
import { ToolActions } from 'src/app/kitchen/feature/tools/state/tool-actions';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { selectAdding, selectError } from 'src/app/recipes/state/recipe/recipe-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-subscribe-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './subscribe-recipe-modal.component.html',
})
export class SubscribeRecipeModalComponent {
  public recipe: any;
  public ingredients: WritableSignal<any[]> = signal([]);
  public ingredientStatuses: WritableSignal<boolean[]> = signal([]);
  public ingredientsReady: WritableSignal<boolean> = signal(false);
  public tools: WritableSignal<any[]> = signal([]);
  public toolStatuses: WritableSignal<boolean[]> = signal([]);
  public toolsReady: WritableSignal<boolean> = signal(false);
  public steps: any;
  public author: any;
  public initials: string = '';
  public progressValue: number = 10;
  public loading: WritableSignal<boolean> = signal(false);

  // User Kitchen Items
  public userIngredients: WritableSignal<any[]> = signal([]);
  public userTools: WritableSignal<any[]> = signal([]);

  constructor(
    public dialogRef: MatDialogRef<SubscribeRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public store: Store,
    public recipeService: RecipeService,
    public dialog: MatDialog
  ) {
    effect(
      () => {
        let allTrue = true;
        const ingredients = this.ingredients();
        const newStatuses: any[] = [];
        for (let i = 0; i < ingredients.length; i++) {
          const ingredient = ingredients[i];
          if (ingredient.userIngredientID === 0) {
            newStatuses.push(true);
          } else if (
            ingredient.userIngredientID &&
            ingredient.userPurchaseUnitRatio
          ) {
            newStatuses.push(true);
          } else {
            newStatuses.push(false);
            allTrue = false;
          }
        }
        this.ingredientStatuses.set(newStatuses);
        this.ingredientsReady.set(allTrue);
        this.getProgressValue();
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        let allTrue = true;
        const tools = this.tools();
        const newStatuses: any[] = [];
        for (let i = 0; i < tools.length; i++) {
          const tool = tools[i];
          if (tool.userToolID === 0 || tool.userToolID) {
            newStatuses.push(true);
          } else {
            newStatuses.push(false);
            allTrue = false;
          }
        }
        this.toolStatuses.set(newStatuses);
        this.toolsReady.set(allTrue);
        this.getProgressValue();
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    if (!this.data.tools) this.toolsReady.set(true);

    this.recipe = this.data.recipe;
    this.data.ingredients.map((i: any) => {
      i.userIngredientID = null;
      i.userPurchaseUnitRatio = null;
      this.ingredients.set([...this.ingredients(), i]);
    });
    this.data.tools.map((t: any) => {
      t.userToolID = null;
      this.tools.set([...this.tools(), t]);
    });
    this.steps = this.data.steps;
    this.author = this.data.author;
    this.initials = this.author.nameFirst[0] + this.author.nameLast[0];

    // Load User Kitchen Items
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.userIngredients.set(ingredients);
      // Iterate over each source ingredient and premap any where the name matches that of a user ingredient
      const updatedIngredients = this.ingredients().map((sourceIngredient) => {
        const matchingUserIngredient = this.findMatchingUserIngredient(
          sourceIngredient.name,
          this.userIngredients()
        );
        if (matchingUserIngredient) {
          sourceIngredient.userIngredientID =
            matchingUserIngredient.ingredientID;
        }
        return sourceIngredient;
      });
      this.ingredients.set(updatedIngredients);
      const initialStatuses = ingredients.map((i) => false);
      this.ingredientStatuses.set(initialStatuses);
    });
    // Load User Tools and pre-map them
    this.store.select(selectTools).subscribe((userTools) => {
      this.userTools.set(userTools);

      // Iterate over each source tool and premap any where the name matches that of a user tool
      const updatedTools = this.tools().map((sourceTool) => {
        const matchingUserTool = this.findMatchingUserTool(
          sourceTool.name,
          this.userTools()
        );
        if (matchingUserTool) {
          sourceTool.userToolID = matchingUserTool.toolID;
        }
        return sourceTool;
      });
      this.tools.set(updatedTools);
      const initialStatuses = userTools.map(() => false);
      this.toolStatuses.set(initialStatuses);
    });
  }

  getIngredientPlaceholder(sourceIngredient: any): string {
    if (sourceIngredient.userIngredientID) {
      const matchedIngredient = this.userIngredients().find(
        (ui) => ui.ingredientID === sourceIngredient.userIngredientID
      );
      return matchedIngredient ? matchedIngredient.name : 'Select Ingredient';
    }
    return 'Select Ingredient';
  }
  getToolPlaceholder(sourceTool: any): string {
    if (sourceTool.userToolID) {
      const matchedTool = this.userTools().find(
        (ut) => ut.toolID === sourceTool.userToolID
      );
      return matchedTool ? matchedTool.name : 'Select Tool';
    }
    return 'Select Tool';
  }

  private findMatchingUserIngredient(
    sourceIngredientName: string,
    userIngredients: any[]
  ): any {
    return userIngredients.find(
      (ui) => ui.name.toLowerCase() === sourceIngredientName.toLowerCase()
    );
  }
  private findMatchingUserTool(sourceToolName: string, userTools: any[]): any {
    return userTools.find(
      (ut) => ut.name.toLowerCase() === sourceToolName.toLowerCase()
    );
  }

  ingredientMeasurementUnitString(ingredient) {
    const userIngredient = this.userIngredients().find(
      (i) => i.ingredientID === ingredient.userIngredientID
    );
    return `${userIngredient.purchaseUnit}`;
  }
  onIngredientSelectChange(newUserIngredientID, ingredient) {
    const newIngredients = this.ingredients().map((i) => {
      if (i.ingredientID === ingredient.ingredientID) {
        i.userIngredientID = newUserIngredientID;
        i.userPurchaseUnitRatio = null;
      }
      return i;
    });
    this.ingredients.set(newIngredients);
  }
  onPurchaseUnitRatioChange(inputElement: EventTarget | null, ingredient) {
    if (!inputElement) return;
    // Cast inputElement to HTMLInputElement
    const input = inputElement as HTMLInputElement;
    const newPurchaseUnitRatio = input.value;

    const newIngredients = this.ingredients().map((i) => {
      if (i.ingredientID === ingredient.ingredientID) {
        i.userPurchaseUnitRatio = newPurchaseUnitRatio;
      }
      return i;
    });

    this.ingredients.set(newIngredients);
  }

  onToolSelectChange(newUserToolID, tool) {
    const newTools = this.tools().map((t) => {
      if (t.toolID === tool.toolID) {
        t.userToolID = newUserToolID;
      }
      return t;
    });
    this.tools.set(newTools);
  }

  getProgressValue() {
    const progress =
      this.ingredientsReady() && this.toolsReady()
        ? 100
        : this.ingredientsReady()
        ? 40
        : 10;
    this.progressValue = progress;
  }

  onSubscribeClick() {
    if (this.ingredientsReady() && this.toolsReady()) {
      const constructBody = {};
      // add 'sourceRecipeID', 'title', 'recipeCategoryID', 'servings', 'lifespanDays', 'type', 'timePrep', 'photoURL', 'ingredients', 'tools', 'steps'
      constructBody['sourceRecipeID'] = this.recipe.recipeID;
      constructBody['title'] = this.recipe.title;
      constructBody['recipeCategoryID'] = this.recipe.recipeCategoryID;
      constructBody['servings'] = this.recipe.servings;
      constructBody['lifespanDays'] = this.recipe.lifespanDays;
      constructBody['type'] = 'subscription';
      constructBody['timePrep'] = this.recipe.timePrep;
      constructBody['photoURL'] = this.recipe.photoURL;
      constructBody['ingredients'] = [];
      constructBody['tools'] = [];
      constructBody['steps'] = [];

      // Add Ingredients
      const ingredients = this.ingredients();
      for (let i in ingredients) {
        const newIngredient = {};
        // if userIngredientID is 0, this ingredient needs 'name', 'lifespanDays', 'purchaseUnit', 'gramRatio', 'brand', 'purchaseUnitRatio', 'measurementUnit', 'measurement
        if (ingredients[i].userIngredientID === 0) {
          newIngredient['ingredientID'] = 0;
          newIngredient['name'] = ingredients[i].name;
          newIngredient['lifespanDays'] = Number(ingredients[i].lifespanDays);
          newIngredient['purchaseUnit'] = ingredients[i].purchaseUnit;
          newIngredient['gramRatio'] = Number(ingredients[i].gramRatio);
          newIngredient['brand'] = ingredients[i].brand;
          newIngredient['purchaseUnitRatio'] = Number(
            ingredients[i].purchaseUnitRatio
          );
          newIngredient['measurementUnit'] = ingredients[i].measurementUnit;
          newIngredient['measurement'] = Number(ingredients[i].measurement);
        }

        // if userIngredientID is not 0, this ingredient needs 'userIngredientID', 'userPurchaseUnitRatio', 'measurementUnit', 'measurement'
        else {
          newIngredient['ingredientID'] = ingredients[i].userIngredientID;
          newIngredient['purchaseUnitRatio'] = Number(
            ingredients[i].userPurchaseUnitRatio
          );
          newIngredient['measurementUnit'] = ingredients[i].measurementUnit;
          newIngredient['measurement'] = Number(ingredients[i].measurement);
        }

        constructBody['ingredients'].push(newIngredient);
      }

      // Add Tools
      const tools = this.tools();
      for (let i in tools) {
        const newTool = {};
        // if userToolID is 0, this tool needs 'name', 'lifespanDays', 'brand'
        if (tools[i].userToolID === 0) {
          newTool['toolID'] = 0;
          newTool['name'] = tools[i].name;
          newTool['brand'] = tools[i].brand;
          newTool['quantity'] = Number(tools[i].quantity);
        }

        // if userToolID is not 0, this tool needs 'userToolID' and 'quantity'
        else {
          newTool['toolID'] = tools[i].userToolID;
          newTool['quantity'] = Number(tools[i].quantity);
        }

        constructBody['tools'].push(newTool);
      }

      // Add Steps
      const steps = this.steps;
      for (let i in steps) {
        const newStep = {};
        newStep['stepID'] = 0;
        newStep['description'] = steps[i].description;
        newStep['title'] = steps[i].title;
        newStep['sequence'] = Number(steps[i].sequence);
        newStep['photoURL'] = steps[i].photoURL;
        constructBody['steps'].push(newStep);
      }

      this.loading.set(true);
      this.store.dispatch(
        RecipeActions.constructRecipe({
          constructBody,
        })
      );
      this.store.select(selectAdding).pipe(filter((adding) => !adding)).subscribe(() => {
        this.store.select(selectError).pipe(take(1)).subscribe((error) => {
          if (error) {
            console.error(
              `Recipe add failed: ${error.message}, CODE: ${error.statusCode}`
            );
            this.dialog.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                errorMessage: error.message,
                statusCode: error.statusCode,
              },
            });
          } else {
            this.dialogRef.close('success');
          }
          this.loading.set(false);
        });
      });
    }
  }
}
