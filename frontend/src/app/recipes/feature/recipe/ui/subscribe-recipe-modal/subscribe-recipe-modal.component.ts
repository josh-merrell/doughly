import {
  Component,
  Inject,
  WritableSignal,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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
    public recipeService: RecipeService
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

    // Load User Kitchen Items
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(ToolActions.loadTools());
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.userIngredients.set(ingredients);
      const initialStatuses = ingredients.map((i) => false);
      this.ingredientStatuses.set(initialStatuses);
    });
    this.store.select(selectTools).subscribe((tools) => {
      this.userTools.set(tools);
      const initialStatuses = tools.map((t) => false);
      this.toolStatuses.set(initialStatuses);
    });

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
    console.log(`onToolSelectChange: `, newUserToolID, tool);
    const newTools = this.tools().map((t) => {
      if (t.toolID === tool.toolID) {
        t.userToolID = newUserToolID;
      }
      return t;
    });
    this.tools.set(newTools);
    console.log(`newTools: `, newTools);
  }

  getProgressValue() {
    const progress =
      this.ingredientsReady() && this.toolsReady()
        ? 100
        : this.ingredientsReady()
        ? 40
        : 10;
    this.progressValue = progress;
    console.log(`getProgressValue: `, progress);
  }

  onSubscribeClick() {
    if (this.ingredientsReady() && this.toolsReady()) {
      const constructBody = {};
      // add 'title', 'recipeCategoryID', 'servings', 'lifespanDays', 'type', 'timePrep', 'photoURL', 'ingredients', 'tools', 'steps'
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
      this.recipeService.constructRecipe(constructBody).subscribe((data) => {
        this.loading.set(false);
        this.dialogRef.close(data);
      });
    }
  }
}
