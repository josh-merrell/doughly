import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { selectRecipeByID } from '../../state/recipe/recipe-selectors';
import { selectRecipeIngredientsByRecipeID } from '../../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../../state/recipe-tool/recipe-tool-selectors';
import { Recipe } from '../../state/recipe/recipe-state';
import { selectRecipeCategoryByID } from '../../state/recipe-category/recipe-category-selectors';
import { DomSanitizer } from '@angular/platform-browser';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { MatDialog } from '@angular/material/dialog';
import { RecipeIngredientsModalComponent } from '../recipes-page/ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { RecipeIngredientError } from '../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeToolsModalComponent } from '../recipes-page/ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { selectSteps } from '../../state/step/step-selectors';
import { selectRecipeStepsByID } from '../../state/recipe-step/recipe-step-selectors';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { RecipeStepsModalComponent } from '../recipes-page/ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRecipeModalComponent } from './ui/delete-recipe-modal/delete-recipe-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { EditRecipeModalComponent } from './ui/edit-recipe-modal/edit-recipe-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';

function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe.component.html',
})
export class RecipeComponent {
  recipeID!: number;
  private recipeSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  recipe$: Observable<any> = this.recipeSubject.asObservable();
  displayRecipe$ = new BehaviorSubject<any>(null);
  recipeCategory$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  recipeIngredients$!: Observable<any[]>;
  private recipeIngredientsSubscription: Subscription = new Subscription();
  displayIngredients$ = new BehaviorSubject<any[]>([]);
  ingredients$!: Observable<any[]>;
  recipeTools$!: Observable<any[]>;
  private recipeToolsSubscription: Subscription = new Subscription();
  tools$!: Observable<any[]>;
  displayTools$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  recipeSteps$!: Observable<any[]>;
  steps$!: Observable<any[]>;
  displaySteps$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  displayStepsWithPhoto$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    []
  );

  private onDestroy$ = new Subject<void>();

  menuOpen: boolean = false;
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private store: Store,
    private sanitizer: DomSanitizer,
    public dialog: MatDialog,
    private router: Router
  ) {}

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }

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

  onUpdateClick() {
    const dialogRef = this.dialog.open(EditRecipeModalComponent, {
      data: this.displayRecipe$.value,
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
        this.dialog.open(UpdateRequestConfirmationModalComponent,{
          data: {
            result: result,
            updateSuccessMessage: `Recipe with ID of ${this.recipeID} updated successfully!`,
          }
        });
      }
    });
  }

  onDeleteClick() {
    const dialogRef = this.dialog.open(DeleteRecipeModalComponent, {
      data: {
        recipeID: this.recipeID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'error') {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage: `Recipe could not be deleted. Try again later.`
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

  private mapRecipeIngredients(recipeIngredients: any[], ingredients: any[]) {
    return recipeIngredients.map((recipeIngredient: any) => {
      const ingredient = ingredients.find(
        (ing: any) => ing.ingredientID === recipeIngredient.ingredientID
      );
      return {
        ...recipeIngredient,
        name: ingredient ? ingredient.name : 'Unknown',
      };
    });
  }

  private mapRecipeTools(recipeTools: any, tools: any) {
    return recipeTools.map((recipeTool: any) => {
      const tool = tools.find((tool: any) => tool.toolID === recipeTool.toolID);
      return {
        ...recipeTool,
        name: tool ? tool.name : null,
      };
    });
  }

  private mapRecipeSteps(recipeSteps: any, steps: any) {
    return recipeSteps.map((recipeStep: any) => {
      const step = steps.find((step: any) => step.stepID === recipeStep.stepID);
      return {
        ...recipeStep,
        title: step ? step.title : 'Unknown',
        description: step ? step.description : 'Unknown',
      };
    });
  }

  ngOnInit() {
    this.ingredients$ = this.store.select(selectIngredients);
    this.tools$ = this.store.select(selectTools);
    this.steps$ = this.store.select(selectSteps);

    this.route.params
      .pipe(
        map((params) => Number(params['recipeID'])),
        tap((recipeID) => (this.recipeID = recipeID)),
        switchMap((recipeID) => {
          this.recipe$ = this.store.select(selectRecipeByID(recipeID));
          this.recipeIngredients$ = this.store.select(
            selectRecipeIngredientsByRecipeID(recipeID)
          );
          this.recipeTools$ = this.store.select(
            selectRecipeToolsByRecipeID(recipeID)
          );
          this.recipeSteps$ = this.store.select(
            selectRecipeStepsByID(recipeID)
          );
          return combineLatest([
            this.recipeIngredients$,
            this.recipeTools$,
            this.ingredients$,
            this.tools$,
            this.recipeSteps$,
            this.steps$,
          ]);
        }),
        catchError((err) => {
          console.error(`Error loading recipe and related state: ${err}`);
          return of([]);
        }),
        map(
          ([
            recipeIngredients,
            recipeTools,
            ingredients,
            tools,
            recipeSteps,
            steps,
          ]) => {
            const displayIngredients =
              recipeIngredients && ingredients
                ? this.mapRecipeIngredients(recipeIngredients, ingredients)
                : recipeIngredients;
            const displayTools = this.mapRecipeTools(recipeTools, tools);
            const displaySteps = this.mapRecipeSteps(recipeSteps, steps);
            return {
              displayIngredients,
              displayTools,
              displaySteps,
            };
          }
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe(({ displayIngredients, displayTools, displaySteps }) => {
        this.displayIngredients$.next(displayIngredients);
        this.displayTools$.next(displayTools);
        this.displaySteps$.next(displaySteps);
      });

    this.recipe$
      .pipe(
        filter((recipe) => !!recipe),
        switchMap((recipe) => {
          if (recipe!.photoURL) {
            return from(
              fetch(recipe!.photoURL)
                .then((res) => res.blob())
                .then((blob) => {
                  const objectURL = URL.createObjectURL(blob);
                  const updatedRecipe = {
                    ...recipe,
                    photo: this.sanitizer.bypassSecurityTrustUrl(objectURL),
                  };
                  return updatedRecipe;
                })
            );
          }
          return of(recipe);
        }),
        tap((recipeWithPhoto) => {
          this.displayRecipe$.next(recipeWithPhoto);
        }),
        switchMap((recipeWithPhoto) =>
          this.store.select(
            selectRecipeCategoryByID(recipeWithPhoto!.recipeCategoryID)
          )
        ),
        tap((recipeCategory) => {
          this.recipeCategory$.next(recipeCategory);
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();

    this.displaySteps$
      .pipe(
        switchMap((steps) => {
          return from(steps).pipe(
            mergeMap((step) => {
              if (step.photoURL) {
                return from(
                  fetch(step.photoURL)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const objectURL = URL.createObjectURL(blob);
                      return {
                        ...step,
                        photo: this.sanitizer.bypassSecurityTrustUrl(objectURL),
                      };
                    })
                );
              }
              return of(step);
            }),
            toArray()
          );
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe((stepsWithPhotos) => {
        const sorted = stepsWithPhotos.sort((a, b) => a.sequence - b.sequence);
        this.displayStepsWithPhoto$.next(sorted);
      });
  }

  timeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours === 0) return `${minutes} min`;
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  }

  editRecipe() {
    console.log('edit recipe');
  }

  editReciptIngredients() {
    const dialogRef = this.dialog.open(RecipeIngredientsModalComponent, {
      data: {
        recipe: {
          recipeID: this.recipeID,
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
          recipeID: this.recipeID,
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

  editRecipeSteps() {
    const dialogRef = this.dialog.open(RecipeStepsModalComponent, {
      data: {
        recipe: {
          recipeID: this.recipeID,
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

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
