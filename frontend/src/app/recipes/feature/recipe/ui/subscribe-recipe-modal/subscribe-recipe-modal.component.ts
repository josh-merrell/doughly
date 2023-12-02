import {
  Component,
  Inject,
  WritableSignal,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { IngredientActions } from 'src/app/kitchen/feature/ingredients/state/ingredient-actions';
import { Store } from '@ngrx/store';
import { ToolActions } from 'src/app/kitchen/feature/tools/state/tool-actions';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';

@Component({
  selector: 'dl-subscribe-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatInputModule, FormsModule],
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

  // User Kitchen Items
  public userIngredients: WritableSignal<any[]> = signal([]);
  public userTools: WritableSignal<any[]> = signal([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public store: Store) {
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

  onSubscribeClick() {
    if (this.ingredientsReady() && this.toolsReady()) {
      console.log(`onSubscribeClick`);
    }
  }
}
