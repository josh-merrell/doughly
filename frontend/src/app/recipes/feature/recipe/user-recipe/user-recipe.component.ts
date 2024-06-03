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
import { environment } from 'src/environments/environment';
import {
  selectNewRecipeID,
  selectRecipeByID,
  selectSubscriptionByNewRecipeID,
  selectUpdating,
} from '../../../state/recipe/recipe-selectors';
import { selectRecipeIngredientsByRecipeID } from '../../../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../../../state/recipe-tool/recipe-tool-selectors';
import { selectRecipeCategoryByID } from '../../../state/recipe-category/recipe-category-selectors';
import { ProfileCardComponent } from 'src/app/social/feature/friends/ui/profile-card/profile-card.component';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { MatDialog } from '@angular/material/dialog';
import { RecipeIngredientsModalComponent } from '../../recipes-page/ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import {
  RecipeIngredient,
  RecipeIngredientError,
} from '../../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeToolsModalComponent } from '../../recipes-page/ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { selectSteps } from '../../../state/step/step-selectors';
import { selectRecipeStepsByID } from '../../../state/recipe-step/recipe-step-selectors';
import { RecipeStepsModalComponent } from '../../recipes-page/ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { DeleteRecipeModalComponent } from './../ui/delete-recipe-modal/delete-recipe-modal.component';
import { EditRecipeModalComponent } from './../ui/edit-recipe-modal/edit-recipe-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { RecipeService } from '../../../data/recipe.service';
import { FractionService } from 'src/app/shared/utils/fractionService';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RecipeShoppingList } from '../../../state/recipe/recipe-state';
import { RecipeShoppingListModalComponent } from './../ui/recipe-shopping-list-modal/recipe-shopping-list-modal.component';
import { UseRecipeModalComponent } from './../ui/use-recipe-modal/use-recipe-modal.component';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ProfileService } from 'src/app/profile/data/profile.service';
import { Profile } from 'src/app/profile/state/profile-state';
import { UnsubscribeRecipeModalComponent } from '../ui/unsubscribe-recipe-modal/unsubscribe-recipe-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import JSConfetti from 'js-confetti';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { setReviewRecipe } from 'src/app/kitchen/state/kitchen-actions';
import { selectReviewRecipeID } from 'src/app/kitchen/state/kitchen-selectors';
import {
  selectError,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { selectShoppingLists } from 'src/app/groceries/state/shopping-list-selectors';
import { selectShoppingListRecipes } from 'src/app/groceries/state/shopping-list-recipe-selectors';
// import { Share } from '/node_modules/@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { filter, take } from 'rxjs';
import { ModalService } from 'src/app/shared/utils/modalService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { StylesService } from 'src/app/shared/utils/stylesService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';

function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}

interface displayIngredientsByComponent {
  noComponent: any[];
  components: { [componentName: string]: any[] };
}

@Component({
  selector: 'dl-user-recipe',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ProfileCardComponent,
    ImageFromCDN,
  ],
  templateUrl: './user-recipe.component.html',
})
export class UserRecipeComponent {
  recipeID: WritableSignal<number> = signal(0);
  recipe: WritableSignal<any> = signal(null);
  recipeSubscription: WritableSignal<any> = signal(null);
  sourceAuthor: WritableSignal<Profile | null> = signal(null);
  recipeCategory: WritableSignal<RecipeCategory | null> = signal(null);
  ingredients: WritableSignal<any[]> = signal([]);
  tools: WritableSignal<any[]> = signal([]);
  steps: WritableSignal<any[]> = signal([]);
  recipeIngredients: WritableSignal<RecipeIngredient[]> = signal([]);
  recipeTools: WritableSignal<any[]> = signal([]);
  recipeSteps: WritableSignal<any[]> = signal([]);
  shoppingList = signal<RecipeShoppingList | null>(null); // informative, what would this recipe need to be made
  public shoppingLists: WritableSignal<any> = signal([]); // current shopping lists ('draft' or 'shopping')
  private listRecipes: WritableSignal<any> = signal([]); // recipes currently in the shopping list(s)
  displayIngredientsByComponent: WritableSignal<displayIngredientsByComponent> =
    signal({ noComponent: [], components: {} });
  displayTools: WritableSignal<any[]> = signal([]);
  displaySteps: WritableSignal<any[]> = signal([]);
  public subscriptions: WritableSignal<any[]> = signal([]);
  public sourceRecipeVersion: WritableSignal<number> = signal(0);
  public ingredientsNeedReview: WritableSignal<boolean> = signal(false);
  public recipeIngredientsNeedReview: WritableSignal<boolean> = signal(false);
  public profile: WritableSignal<Profile | null> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

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
  usernameOpen: boolean = false;
  syncMessageOpen: boolean = false;
  @ViewChild('menu') rowItemMenu!: ElementRef;
  @ViewChild('username') username!: ElementRef;
  @ViewChild('syncMessage') syncMessage!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private store: Store,
    public dialog: MatDialog,
    private router: Router,
    private recipeService: RecipeService,
    private profileService: ProfileService,
    private fractionService: FractionService,
    private stringsService: StringsService,
    private modalService: ModalService,
    private authService: AuthService,
    private stylesService: StylesService
  ) {
    effect(
      () => {
        const recipeID = this.recipeID();
        const profile = this.profile();
        this.store
          .select(selectSubscriptionByNewRecipeID(recipeID))
          .subscribe((subscription) => {
            this.recipeSubscription.set(subscription);
          });
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
        if (profile) {
          this.recipeService
            .getShoppingList(recipeID, profile.checkIngredientStock)
            .subscribe((shoppingList) => {
              this.shoppingList.set(shoppingList);
            });
        }
        this.recipeService
          .getSubscriptionsByRecipeID(recipeID)
          .subscribe((data) => {
            if (!data) return;
            this.subscriptions.set(data);
          });
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const recipeSubscription = this.recipeSubscription();
      if (!recipeSubscription) return;
      this.profileService
        .getProfile(recipeSubscription.authorID)
        .subscribe((profile) => {
          this.sourceAuthor.set(profile);
        });
      this.recipeService
        .getByID(recipeSubscription.sourceRecipeID)
        .subscribe((sr) => {
          this.sourceRecipeVersion.set(sr[0].version);
        });
    });

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
        this.displayIngredientsByComponent.set(
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
    // effect(() => {
    //   const relevantUses =
    //     this.onlyMe() === 'true'
    //       ? this.recipeService.myUses().length
    //       : this.recipeService.allUses().length;
    // });
    effect(() => {
      this.recipeService.loadUses(this.recipeID(), this.logsAfterDate());
    });

    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
        if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
          this.onboardingHandler(profile.onboardingState);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
      this.ingredientsNeedReview.set(
        ingredients.some((ing) => ing.needsReview)
      );
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

    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
    });
    this.store
      .select(selectShoppingListRecipes)
      .subscribe((listRecipes: any) => {
        this.listRecipes.set(listRecipes);
      });

    this.displayUsageDate = this.updateDisplayUsageData(this.usageDate);
    this.store.select(selectNewRecipeID).subscribe((newRecipeID) => {
      if (newRecipeID) {
        //this means this page was rendered after vision create of new recipe or subscribe, so let's throw confetti then remove newRecipeID from store
        const jsConfetti = new JSConfetti();
        jsConfetti.addConfetti({
          confettiColors: ['#5cd0fa', '#d9127c', '#ffb8d2'],
        });
        this.store.dispatch(RecipeActions.clearNewRecipeID());
        // also open the ConfirmationModal
        this.modalService.open(
          ConfirmationModalComponent,
          {
            data: {
              confirmationMessage: `Recipe added successfully! Edit details as needed.`,
            },
          },
          1,
          true
        );
      }
    });
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
        const clickedAuthor = this.username?.nativeElement.contains(
          event.target
        );
        if (!clickedAuthor && this.username) {
          this.closeUsername();
        }
        const clickedSyncMessage = this.syncMessage?.nativeElement.contains(
          event.target
        );
        if (!clickedSyncMessage && this.syncMessage) {
          this.closeSyncMessage();
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
  toggleUsername(event: any) {
    event.stopPropagation();
    this.usernameOpen = !this.usernameOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }
  closeUsername() {
    this.usernameOpen = false;
  }
  toggleSyncMessage(event: any) {
    event.stopPropagation();
    this.syncMessageOpen = !this.syncMessageOpen;
  }
  closeSyncMessage() {
    this.syncMessageOpen = false;
  }
  onUnsubscribeClick() {
    this.closeMenu();
    if (this.recipeSubscription()) {
      const ref = this.modalService.open(
        UnsubscribeRecipeModalComponent,
        {
          data: {
            subscriptionID: this.recipeSubscription().subscriptionID,
            title: this.recipe().title,
            authorName: this.sourceAuthor()!.username,
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              ConfirmationModalComponent,
              {
                data: {
                  confirmationMessage: `Unsubscribed from ${
                    this.recipe().title
                  }`,
                },
              },
              1,
              true
            );
            this.router.navigate(['/recipes']);
          }
        });
      } else {
      }
    }
  }
  onUpdateClick() {
    this.closeMenu();
    const ref = this.modalService.open(
      EditRecipeModalComponent,
      {
        data: this.recipe(),
        width: '90%',
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result instanceof HttpErrorResponse) {
          this.modalService.open(
            UpdateRequestErrorModalComponent,
            {
              data: {
                error: result,
                updateFailureMessage: `Recipe could not be updated. Try again later.`,
              },
            },
            1,
            true
          );
        } else if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Recipe updated!`,
              },
            },
            1,
            true
          );
        }
      });
    } else {
    }
  }
  onDeleteClick() {
    this.closeMenu();
    const ref = this.modalService.open(
      DeleteRecipeModalComponent,
      {
        data: {
          recipeID: this.recipeID(),
        },
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            maxWidth: '380px',
            data: {
              confirmationMessage: 'Recipe deleted successfully!',
            },
          });
          //navigate to recipes page
          this.router.navigate(['/recipes']);
        }
      });
    } else {
    }
  }
  // ***************************************************

  // UTILITY FUNCTIONS  ********************************
  private mapRecipeIngredients(
    recipeIngredients: RecipeIngredient[],
    ingredients: any[]
  ) {
    if (!recipeIngredients.length || !ingredients.length) return [];
    //update recipeIngredientsNeedReview
    this.recipeIngredientsNeedReview.set(
      recipeIngredients.some((ri) => ri.RIneedsReview)
    );
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
            ? recipeIngredient.measurementUnit === 'box' ||
              recipeIngredient.measurementUnit === 'bunch' ||
              recipeIngredient.measurementUnit === 'pinch' ||
              recipeIngredient.measurementUnit === 'dash'
              ? recipeIngredient.measurementUnit + 'es'
              : recipeIngredient.measurementUnit + 's'
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
      // return usageDate;
      // return 'usageDate' without the year
      return usageDate.split(',').slice(0, 1).join(',');
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
    if (hours === 0) return `${minutes}m`;
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  editRecipeIngredients() {
    const ref = this.modalService.open(
      RecipeIngredientsModalComponent,
      {
        data: {
          recipe: {
            recipeID: this.recipeID(),
          },
        },
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: 'Recipe Ingredients edited successfully!',
              },
            },
            1,
            true
          );
        }
      });
    } else {
    }
  }
  editRecipeTools() {
    const ref = this.modalService.open(
      RecipeToolsModalComponent,
      {
        data: {
          recipe: {
            recipeID: this.recipeID(),
          },
        },
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: 'Recipe Tools edited successfully!',
              },
            },
            1,
            true
          );
        }
      });
    } else {
    }
  }
  viewShoppingList() {
    this.modalService.open(
      RecipeShoppingListModalComponent,
      {
        data: {
          shoppingList: this.shoppingList(),
          usageDate: this.usageDate,
          recipeName: this.recipe().title,
          recipeID: this.recipeID(),
          checkIngredientStock: this.profile()!.checkIngredientStock,
          shoppingLists: this.shoppingLists(),
          listRecipes: this.listRecipes(),
          plannedDate: this.usageDate,
        },
        width: '90%',
      },
      1
    );
  }
  useRecipe() {
    this.router.navigate(['/recipe/using/' + this.recipeID()]);
  }
  editRecipeSteps() {
    const ref = this.modalService.open(
      RecipeStepsModalComponent,
      {
        data: {
          recipe: {
            recipeID: this.recipeID(),
          },
        },
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: 'Recipe Steps edited successfully!',
              },
            },
            1,
            true
          );
        } else if (isRecipeStepError(result)) {
          this.modalService.open(
            AddRequestErrorModalComponent,
            {
              data: {
                error: result,
                addFailureMessage: 'Recipe Steps could not be edited.',
              },
            },
            1,
            true
          );
        }
      });
    } else {
    }
  }

  reviewIngredients() {
    const recipeID = this.recipeID();
    // add recipeID to 'reviewRecipeID' property in kitchen store
    this.store.dispatch(setReviewRecipe({ recipeID }));
    // wait half a second
    setTimeout(() => {
      // if any ingredients need review, navigate to the ingredients page
      if (this.ingredientsNeedReview()) {
        this.router.navigate(['/kitchen/ingredients']);
      }
      // else only recipeIngredients need review so call editRecipeIngredients()
      else {
        this.editRecipeIngredients();
      }
    }, 500);
  }

  async onShareClicked() {
    console.log('Share clicked');
    await Clipboard.write({
      // this will send the social crawler to get the link preview details for the recipe. Users will be redirected to the app.
      string: `${environment.BACKEND}/link-previews/recipe/${this.recipeID()}`,
    });

    this.modalService.open(
      ConfirmationModalComponent,
      {
        data: {
          confirmationMessage:
            'Link copied to clipboard! Share in any Messenging App.',
        },
      },
      1,
      true
    );
  }

  //***************************************************

  onboardingHandler(state: number) {
    if (state === 5) {
      this.showOnboardingBadge.set(false);
      this.onboardingModalOpen.set(true);
      this.reopenOnboardingModal.set(false);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.subscribeRecipePage,
            currentStep: 5,
            showNextButton: false,
          },
          position: {
            top: '10%',
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe(() => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(true);
        });
      } else {
      }
    } else if (state === 13) {
      this.showOnboardingBadge.set(false);
      this.onboardingModalOpen.set(true);
      this.reopenOnboardingModal.set(false);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message:
              this.stringsService.onboardingStrings.recipeCreateImageSuccess,
            currentStep: 13,
            showNextButton: true,
          },
          position: {
            bottom: '70%',
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          if (result === 'nextClicked') {
            this.onboardingCallback();
          } else this.showOnboardingBadge.set(true);
        });
      } else {
      }
    } else if (state === 14) {
      this.showOnboardingBadge.set(false);
      this.onboardingModalOpen.set(true);
      this.reopenOnboardingModal.set(false);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message:
              this.stringsService.onboardingStrings.recipeCreateCreditUsage,
            currentStep: 14,
            showNextButton: true,
          },
          position: {
            bottom: '20%',
          },
        },
        1
      );
      if (ref) {
      } else {
      }
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          if (result === 'nextClicked') {
            this.onboardingCallback();
          } else this.showOnboardingBadge.set(true);
        });
      } else {
      }
    } else if (state === 15) {
      this.showOnboardingBadge.set(false);
      this.onboardingModalOpen.set(true);
      this.reopenOnboardingModal.set(false);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.onboardingComplete,
            currentStep: 15,
            showNextButton: false,
          },
          position: {
            bottom: '50%',
          },
        },
        1
      );
      if (ref) {
      } else {
      }
      if (ref) {
        ref.afterClosed().subscribe(() => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(false);
          // set onboardingState back to 0 (done)
          this.store.dispatch(
            ProfileActions.updateProfileProperty({
              property: 'onboardingState',
              value: 0,
            })
          );
          this.store
            .select(selectUpdating)
            .pipe(
              filter((updating) => !updating),
              take(1)
            )
            .subscribe(() => {
              this.store
                .select(selectError)
                .pipe(take(1))
                .subscribe((error) => {
                  if (error) {
                    console.error(
                      `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
                    );
                  }
                });
            });
        });
      } else {
      }
    }
  }

  onboardingCallback() {
    setTimeout(() => {
      this.onboardingHandler(this.profile()!.onboardingState);
    }, 1000);
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile()!.onboardingState);
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode
          ? this.stylesService.getHex('pink-4')
          : this.stylesService.getHex('pink-7');
      case 2:
        return darkMode
          ? this.stylesService.getHex('grey-4')
          : this.stylesService.getHex('grey-7');
      case 3:
        return darkMode
          ? this.stylesService.getHex('blue-2')
          : this.stylesService.getHex('blue-9');
      case 4:
        return darkMode
          ? this.stylesService.getHex('grey-8')
          : this.stylesService.getHex('grey-2');
      default:
        return darkMode
          ? this.stylesService.getHex('blue-2')
          : this.stylesService.getHex('blue-9');
    }
  }
}
