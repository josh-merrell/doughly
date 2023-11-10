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
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  filter,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { selectRecipeByID } from '../../state/recipe/recipe-selectors';
import { selectRecipeIngredientsByRecipeID } from '../../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../../state/recipe-tool/recipe-tool-selectors';
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
import { RecipeStepsModalComponent } from '../recipes-page/ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRecipeModalComponent } from './ui/delete-recipe-modal/delete-recipe-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { EditRecipeModalComponent } from './ui/edit-recipe-modal/edit-recipe-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';
import { RecipeService } from '../../data/recipe.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ShoppingList } from '../../state/recipe/recipe-state';
import { RecipeShoppingListModalComponent } from './ui/recipe-shopping-list-modal/recipe-shopping-list-modal.component';
import { UseRecipeModalComponent } from './ui/use-recipe-modal/use-recipe-modal.component';

function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './recipe.component.html',
})
export class RecipeComponent {
  recipeID!: number;
  private recipeSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  recipe$: Observable<any> = this.recipeSubject.asObservable();
  displayRecipe$ = new BehaviorSubject<any>(null);
  recipeCategory$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  recipeIngredients$!: Observable<any[]>;
  displayIngredients$ = new BehaviorSubject<any[]>([]);
  ingredients$!: Observable<any[]>;
  recipeTools$!: Observable<any[]>;
  tools$!: Observable<any[]>;
  displayTools$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  recipeSteps$!: Observable<any[]>;
  steps$!: Observable<any[]>;
  displaySteps$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  displayStepsWithPhoto$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    []
  );
  private shoppingListSubject$ = new BehaviorSubject<any>({ ingredients: [] });
  shoppingList$: Observable<ShoppingList> =
    this.shoppingListSubject$.asObservable();
  shoppingList!: ShoppingList;

  //****** Usage Logs ******/
  //default datstring 30 days prior
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

  private subscription: Subscription = new Subscription();

  // initialized to today's date in format of "Jan 1, 2023"
  usageDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  public displayUsageDate!: string;

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
    private router: Router,
    private recipeService: RecipeService
  ) {
    effect(() => {
      const relevantUses =
        this.onlyMe() === 'true'
          ? this.recipeService.myUses().length
          : this.recipeService.allUses().length;
    });

    effect(() => {
      this.recipeService.loadUses(this.recipeID, this.logsAfterDate());
    });
  }
  ngOnInit() {
    this.displayUsageDate = this.updateDisplayUsageData(this.usageDate);
    this.ingredients$ = this.store.select(selectIngredients);
    this.tools$ = this.store.select(selectTools);
    this.steps$ = this.store.select(selectSteps);

    this.route.paramMap.subscribe((params) => {
      this.recipeID = +params.get('recipeID')!;
    });

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
          this.shoppingList$ = this.recipeService.getShoppingList(recipeID); // Set the observable here
          return combineLatest([
            this.recipeIngredients$,
            this.recipeTools$,
            this.ingredients$,
            this.tools$,
            this.recipeSteps$,
            this.steps$,
            this.shoppingList$, // Use the observable here
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
            shoppingList, // You'll get the current value of the shoppingList$ observable here
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
              shoppingList, // Include shoppingList in the return value
            };
          }
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe(
        ({ displayIngredients, displayTools, displaySteps, shoppingList }) => {
          this.displayIngredients$.next(displayIngredients);
          this.displayTools$.next(displayTools);
          this.displaySteps$.next(displaySteps);
          this.shoppingList = shoppingList; // Set the component property here
        }
      );

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

    this.recipeService.loadUses(this.recipeID, this.logsAfterDate());
  }

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
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: {
            result: result,
            updateSuccessMessage: `Recipe with ID of ${this.recipeID} updated successfully!`,
          },
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

  private mapRecipeIngredients(recipeIngredients: any[], ingredients: any[]) {
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

      // Update shoppingList$ observable with the new date
      this.recipeService
        .getShoppingList(this.recipeID, new Date(this.usageDate))
        .subscribe((shoppingList) => {
          this.shoppingListSubject$.next(shoppingList);
          this.shoppingList = shoppingList;
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

  viewShoppingList() {
    this.dialog.open(RecipeShoppingListModalComponent, {
      data: {
        shoppingList: this.shoppingList,
        usageDate: this.usageDate,
        recipeName: this.displayRecipe$.value.title,
      },
    });
  }

  useRecipe() {
    const dialogRef = this.dialog.open(UseRecipeModalComponent, {
      data: {
        recipeName: this.displayRecipe$.value.title,
        recipeID: this.recipeID,
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
    this.subscription.unsubscribe();
  }
}
