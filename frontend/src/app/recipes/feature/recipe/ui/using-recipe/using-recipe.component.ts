import {
  Component,
  ElementRef,
  Renderer2,
  Signal,
  ViewChild,
  ViewChildren,
  AfterViewInit,
  WritableSignal,
  computed,
  effect,
  signal,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import Fraction from 'fraction.js';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { selectRecipeIngredientsByRecipeID } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { RecipeIngredient } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-state';
import { selectRecipeStepsByID } from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { selectSteps } from 'src/app/recipes/state/step/step-selectors';
import { FractionService } from 'src/app/shared/utils/fractionService';
import { UnitService } from 'src/app/shared/utils/unitService';
import { UseRecipeModalComponent } from '../use-recipe-modal/use-recipe-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { StylesService } from 'src/app/shared/utils/stylesService';
import { AuthService } from 'src/app/shared/utils/authenticationService';

interface displayIngredientsByComponent {
  noComponent: any[];
  components: { [componentName: string]: any[] };
}

@Component({
  selector: 'dl-using-recipe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './using-recipe.component.html',
})
export class UsingRecipeComponent {
  @ViewChildren('stepElement') stepElements!: QueryList<ElementRef>;
  recipeID: WritableSignal<number> = signal(0);
  recipe: WritableSignal<any> = signal(null);
  ingredients: WritableSignal<any[]> = signal([]);
  steps: WritableSignal<any[]> = signal([]);
  recipeIngredients: WritableSignal<RecipeIngredient[]> = signal([]);
  recipeSteps: WritableSignal<any[]> = signal([]);
  displayIngredientsByComponent: WritableSignal<displayIngredientsByComponent> =
    signal({ noComponent: [], components: {} });
  displaySteps: WritableSignal<any[]> = signal([]);
  currentStepIndex: WritableSignal<number> = signal(0);

  constructor(
    private dialog: MatDialog,
    private store: Store,
    private router: Router,
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private unitService: UnitService,
    private fractionService: FractionService,
    private modalService: ModalService,
    private authService: AuthService,
    private stylesService: StylesService
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
          .select(selectRecipeStepsByID(recipeID))
          .subscribe((recipeSteps) => {
            this.recipeSteps.set(recipeSteps);
          });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const recipeIngredients = this.recipeIngredients();
        const ingredients = this.ingredients();
        this.displayIngredientsByComponent.set(
          this.mapRecipeIngredients(recipeIngredients, ingredients)
        );
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

    effect(
      () => {
        const currentStepIndex = this.currentStepIndex();
        this.scrollToCurrentStep(currentStepIndex);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.recipeID.set(Number(params.get('recipeID')!));
    });
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
    });
    this.store.select(selectSteps).subscribe((steps) => {
      this.steps.set(steps);
    });
  }

  private scrollToCurrentStep(index: number): void {
    const stepElement = this.stepElements.toArray()[index]?.nativeElement;
    if (stepElement) {
      this.scroll(stepElement);
    }
  }

  setCurrentStepIndex(newIndex: number): void {
    // Assuming you have a way to update currentStepIndex
    this.currentStepIndex.set(newIndex); // Update the index as per your state management
    setTimeout(() => this.scrollToCurrentStep(newIndex), 0); // Ensure changes are rendered
  }

  private mapRecipeIngredients(
    recipeIngredients: RecipeIngredient[],
    ingredients: any[]
  ) {
    if (!recipeIngredients.length || !ingredients.length) return [];

    const mappedIngredients = recipeIngredients.map((recipeIngredient: any) => {
      const ingredient = ingredients.find(
        (ing: any) => ing.ingredientID === recipeIngredient.ingredientID
      );
      // Convert the measurement to a fraction if it's not a 'single' unit
      let measurement = this.fractionService.decimalToFraction(
        recipeIngredient.measurement
      );

      if (recipeIngredient.measurementUnit === 'single') {
        return {
          ...recipeIngredient,
          name: ingredient ? ingredient.name : 'Unknown',
          measurement: measurement,
          measurementUnit: '',
        };
      }
      return {
        ...recipeIngredient,
        name: ingredient ? ingredient.name : 'Unknown',
        measurement: measurement,
        measurementUnit:
          Number(recipeIngredient.measurement) > 1
            ? this.unitService.plural(recipeIngredient.measurementUnit)
            : recipeIngredient.measurementUnit,
      };
    });
    mappedIngredients.sort((a: any, b: any) => a.name.localeCompare(b.name));
    /**
    displayIngredientsByComponent: {
      noComponent: [mappedIngredients],
      components: {
        sauce: [mappedSauceIngredients],
        filling: [mappedFillingIngredients],
      }
    }
    **/
    const displayIngredientsByComponent: any = {
      noComponent: [],
      components: {},
    };
    for (let i = 0; i < mappedIngredients.length; i++) {
      if (mappedIngredients[i].component) {
        if (
          !displayIngredientsByComponent.components[
            mappedIngredients[i].component
          ]
        ) {
          displayIngredientsByComponent.components[
            mappedIngredients[i].component
          ] = [];
        }
        displayIngredientsByComponent.components[
          mappedIngredients[i].component
        ].push(mappedIngredients[i]);
      } else {
        displayIngredientsByComponent.noComponent.push(mappedIngredients[i]);
      }
    }
    return displayIngredientsByComponent;
  }

  private mapRecipeSteps(recipeSteps: any, steps: any) {
    if (!recipeSteps.length || !steps.length) return [];
    const mappedSteps = recipeSteps.map((recipeStep: any) => {
      const step = steps.find((step: any) => step.stepID === recipeStep.stepID);
      return {
        ...recipeStep,
        title: step ? step.title : 'Unknown',
        description: step ? step.description : 'Unknown',
      };
    });
    return mappedSteps.sort((a: any, b: any) => a.sequence - b.sequence);
  }

  goToPreviousStep() {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.set(this.currentStepIndex() - 1);
    }
  }

  goToNextStep() {
    if (this.currentStepIndex() < this.displaySteps().length - 1) {
      this.currentStepIndex.set(this.currentStepIndex() + 1);
    }
  }

  public scroll(element: any) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onUseRecipe() {
    const ref = this.modalService.open(
      UseRecipeModalComponent,
      {
        data: {
          recipeName: this.recipe().title,
          recipeID: this.recipeID(),
        },
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'cancel') return;
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              maxWidth: '380px',
              data: {
                confirmationMessage: 'Bon appétit!',
              },
            },
            1,
            true
          );
          this.router.navigate(['/recipe/' + this.recipeID()]);
        }
      });
    } else {
    }
  }

  onExitClick() {
    this.router.navigate(['/recipe/' + this.recipeID()]);
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode
          ? this.stylesService.getHex('grey-8')
          : this.stylesService.getHex('grey-3');
      default:
        return darkMode
          ? this.stylesService.getHex('grey-2')
          : this.stylesService.getHex('grey-9');
    }
  }
}
