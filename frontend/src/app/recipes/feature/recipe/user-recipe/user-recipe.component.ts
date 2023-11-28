import {
  Component,
  ElementRef,
  Renderer2,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectRecipeByID } from '../../../state/recipe/recipe-selectors';
import { selectRecipeIngredientsByRecipeID } from '../../../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../../../state/recipe-tool/recipe-tool-selectors';
import { selectRecipeCategoryByID } from '../../../state/recipe-category/recipe-category-selectors';
import { DomSanitizer } from '@angular/platform-browser';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { MatDialog } from '@angular/material/dialog';
import { RecipeIngredientsModalComponent } from '../../recipes-page/ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { RecipeIngredient, RecipeIngredientError } from '../../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeToolsModalComponent } from '../../recipes-page/ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { selectSteps } from '../../../state/step/step-selectors';
import { selectRecipeStepsByID } from '../../../state/recipe-step/recipe-step-selectors';
import { RecipeStepsModalComponent } from '../../recipes-page/ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRecipeModalComponent } from './../ui/delete-recipe-modal/delete-recipe-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { EditRecipeModalComponent } from './../ui/edit-recipe-modal/edit-recipe-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';
import { RecipeService } from '../../../data/recipe.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Recipe, ShoppingList } from '../../../state/recipe/recipe-state';
import { RecipeShoppingListModalComponent } from './../ui/recipe-shopping-list-modal/recipe-shopping-list-modal.component';
import { UseRecipeModalComponent } from './../ui/use-recipe-modal/use-recipe-modal.component';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { IngredientActions } from 'src/app/kitchen/feature/ingredients/state/ingredient-actions';
import { ToolActions } from 'src/app/kitchen/feature/tools/state/tool-actions';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';

function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}

@Component({
  selector: 'dl-user-recipe',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './user-recipe.component.html',
})
export class UserRecipeComponent {
  recipeID: WritableSignal<number> = signal(0);
  recipe: WritableSignal<any> = signal(null);
  recipeCategory: WritableSignal<RecipeCategory | null> = signal(null);
  ingredients: WritableSignal<any[]> = signal([]);
  tools: WritableSignal<any[]> = signal([]);
  steps: WritableSignal<any[]> = signal([]);
  recipeIngredients: WritableSignal<RecipeIngredient[]> = signal([]);
  recipeTools: WritableSignal<any[]> = signal([]);
  recipeSteps: WritableSignal<any[]> = signal([]);
  shoppingList = signal<ShoppingList | null>(null);
  displayIngredients: WritableSignal<any[]> = signal([]);
  displayTools: WritableSignal<any[]> = signal([]);
  displaySteps: WritableSignal<any[]> = signal([]);

  //****** Usage Logs ******
  //default datestring 30 days prior
  defaultDateStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  logsAfterDate: WritableSignal<string> = signal(this.defaultDateStr);
  public onlyMe: WritableSignal<string> = signal('true');
  relevantUses: Signal<any> = computed(() => {
    return this.onlyMe() === 'true'
      ? this.recipeService.myUses().length
      : this.recipeService.allUses().length;
  });
  //***********************

  usageDate: string = new Date().toLocaleDateString('en-US', {
    // initialized to today's date in format of "Jan 1, 2023"
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  public displayUsageDate!: string;

  menuOpen: boolean = false;
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private store: Store,
    private sanitizer: DomSanitizer,
    public dialog: MatDialog,
    private router: Router,
    private recipeService: RecipeService,
    private photoService: PhotoService
  ) {
    effect(
      () => {
        const recipeID = this.recipeID();
        this.store.select(selectRecipeByID(recipeID)).subscribe((recipe) => {
          this.recipe.set(recipe);
        });
        this.store
          .select(selectRecipeIngredientsByRecipeID(recipeID))
          .subscribe((recipeIngredients) => {
            this.recipeIngredients.set(recipeIngredients);
          });
        this.store
          .select(selectRecipeToolsByRecipeID(recipeID))
          .subscribe((recipeTools) => {
            this.recipeTools.set(recipeTools);
          }),
          { allowSignalWrites: true };
        this.store
          .select(selectRecipeStepsByID(recipeID))
          .subscribe((recipeSteps) => {
            this.recipeSteps.set(recipeSteps);
          });
        this.recipeService
          .getShoppingList(recipeID)
          .subscribe((shoppingList) => {
            this.shoppingList.set(shoppingList);
          });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipe = this.recipe();
        if (!recipe) return;
        this.store
          .select(selectRecipeCategoryByID(recipe.recipeCategoryID))
          .subscribe((recipeCategory) => {
            this.recipeCategory.set(recipeCategory);
          });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipeIngredients = this.recipeIngredients();
        const ingredients = this.ingredients();
        this.displayIngredients.set(
          this.mapRecipeIngredients(recipeIngredients, ingredients)
        );
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipeTools = this.recipeTools();
        const tools = this.tools();
        this.displayTools.set(this.mapRecipeTools(recipeTools, tools));
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipeSteps = this.recipeSteps();
        const steps = this.steps();
        this.displaySteps.set(this.mapRecipeSteps(recipeSteps, steps));
      },
      { allowSignalWrites: true }
    );

    //FOR USAGE LOGS
    effect(() => {
      const relevantUses =
        this.onlyMe() === 'true'
          ? this.recipeService.myUses().length
          : this.recipeService.allUses().length;
    });
    effect(() => {
      this.recipeService.loadUses(this.recipeID(), this.logsAfterDate());
    });
  }

  ngOnInit(): void {
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(ToolActions.loadTools());
    this.store.dispatch(StepActions.loadSteps());

    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
    });
    this.store.select(selectTools).subscribe((tools) => {
      this.tools.set(tools);
    });
    this.store.select(selectSteps).subscribe((steps) => {
      this.steps.set(steps);
    });

    this.route.paramMap.subscribe((params) => {
      this.recipeID.set(Number(params.get('recipeID')!));
    });

    this.displayUsageDate = this.updateDisplayUsageData(this.usageDate);
  }

  // LIFECYCLE HOOKS  *********************************
  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.rowItemMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.rowItemMenu) {
          this.closeMenu();
        }
      }
    );
  }

  // INTERACTIVITY FUNCTIONS  **************************
  selectPersonIcon(selection: string) {
    this.onlyMe.set(selection);
  }
  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }
  onUpdateClick() {
    const dialogRef = this.dialog.open(EditRecipeModalComponent, {
      data: this.recipe(),
      width: '75%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: {
            error: result,
            updateFailureMessage: `Recipe could not be updated. Try again later.`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: {
            result: result,
            updateSuccessMessage: `Recipe with ID of ${this.recipeID()} updated successfully!`,
          },
        });
      }
    });
  }
  onDeleteClick() {
    const dialogRef = this.dialog.open(DeleteRecipeModalComponent, {
      data: {
        recipeID: this.recipeID(),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'error') {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage: `Recipe could not be deleted. Try again later.`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: 'Recipe deleted successfully!',
          },
        });
        //navigate to recipes page
        this.router.navigate(['/recipes']);
      }
    });
  }
  // ***************************************************

  // UTILITY FUNCTIONS  ********************************
  private mapRecipeIngredients(
    recipeIngredients: RecipeIngredient[],
    ingredients: any[]
  ) {
    if (!recipeIngredients.length || !ingredients.length) return [];
    return recipeIngredients.map((recipeIngredient: any) => {
      const ingredient = ingredients.find(
        (ing: any) => ing.ingredientID === recipeIngredient.ingredientID
      );
      return {
        ...recipeIngredient,
        name: ingredient ? ingredient.name : 'Unknown',
        measurementUnit:
          recipeIngredient.measurementUnit === 'box' ||
          recipeIngredient.measurementUnit === 'bunch' ||
          recipeIngredient.measurementUnit === 'pinch' ||
          recipeIngredient.measurementUnit === 'dash'
            ? recipeIngredient.measurementUnit + 'es'
            : recipeIngredient.measurementUnit + 's',
      };
    });
  }
  private mapRecipeTools(recipeTools: any, tools: any) {
    if (!recipeTools.length || !tools.length) return [];
    return recipeTools.map((recipeTool: any) => {
      const tool = tools.find((tool: any) => tool.toolID === recipeTool.toolID);
      return {
        ...recipeTool,
        name: tool ? tool.name : null,
      };
    });
  }
  private mapRecipeSteps(recipeSteps: any, steps: any) {
    if (!recipeSteps.length || !steps.length) return [];
    return recipeSteps.map((recipeStep: any) => {
      const step = steps.find((step: any) => step.stepID === recipeStep.stepID);
      return {
        ...recipeStep,
        title: step ? step.title : 'Unknown',
        description: step ? step.description : 'Unknown',
      };
    });
  }
  filterPastDates(date: Date | null): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date) {
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      return dateWithoutTime >= today;
    }
    return true;
  }
  filterFutureDates(date: Date | null): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date) {
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      return dateWithoutTime <= today;
    }
    return true;
  }
  updateUsageDate(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date) {
      this.usageDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      this.displayUsageDate = this.updateDisplayUsageData(this.usageDate);

      // Update shoppingList() Signal with the new date
      this.recipeService
        .getShoppingList(this.recipeID(), new Date(this.usageDate))
        .subscribe((shoppingList) => {
          this.shoppingList.set(shoppingList);
        });
    }
  }
  updateDisplayUsageData(usageDate: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const tomorrowString = tomorrow.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (usageDate === todayString) {
      return 'Today';
    } else if (usageDate === tomorrowString) {
      return 'Tomorrow';
    } else {
      return usageDate;
    }
  }
  updateLogsAfterDate(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date) {
      this.logsAfterDate.set(
        date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    }
  }
  timeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours === 0) return `${minutes} min`;
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  }
  editRecipeIngredients() {
    const dialogRef = this.dialog.open(RecipeIngredientsModalComponent, {
      data: {
        recipe: {
          recipeID: this.recipeID(),
        },
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Recipe Ingredients edited successfully!',
          },
        });
      } else if (isRecipeIngredientError(result)) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Error submitting Ingredient changes.',
          },
        });
      }
    });
  }
  editRecipeTools() {
    const dialogRef = this.dialog.open(RecipeToolsModalComponent, {
      data: {
        recipe: {
          recipeID: this.recipeID(),
        },
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Recipe Tools edited successfully!',
          },
        });
      } else if (isRecipeIngredientError(result)) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Error submitting Tool changes.',
          },
        });
      }
    });
  }
  viewShoppingList() {
    this.dialog.open(RecipeShoppingListModalComponent, {
      data: {
        shoppingList: this.shoppingList(),
        usageDate: this.usageDate,
        recipeName: this.recipe().title,
      },
    });
  }
  useRecipe() {
    const dialogRef = this.dialog.open(UseRecipeModalComponent, {
      data: {
        recipeName: this.recipe().title,
        recipeID: this.recipeID(),
        logsAfterDate: this.logsAfterDate(),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'cancel') return;
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Recipe used successfully!',
          },
        });
      } else if (result === false) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Error using recipe.',
          },
        });
      }
    });
  }
  editRecipeSteps() {
    const dialogRef = this.dialog.open(RecipeStepsModalComponent, {
      data: {
        recipe: {
          recipeID: this.recipeID(),
        },
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Recipe Steps edited successfully!',
          },
        });
      } else if (isRecipeStepError(result)) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Recipe Steps could not be edited.',
          },
        });
      }
    });
  }
  //***************************************************
}

