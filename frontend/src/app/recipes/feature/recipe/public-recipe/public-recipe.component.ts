import {
  Component,
  Signal,
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
import { RecipeIngredient } from '../../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeService } from '../../../data/recipe.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ProfileService } from 'src/app/profile/data/profile.service';
import { RecipeIngredientService } from 'src/app/recipes/data/recipe-ingredients.service';
import { IngredientService } from 'src/app/kitchen/feature/ingredients/data/ingredient.service';
import { ToolService } from 'src/app/kitchen/feature/tools/data/tool.service';
import { RecipeToolService } from 'src/app/recipes/data/recipe-tool.service';
import { RecipeStepService } from 'src/app/recipes/data/recipe-step.service';
import { StepService } from 'src/app/recipes/data/step.service';
import { FriendModalComponent } from 'src/app/social/feature/friends/ui/friend-modal/friend-modal.component';
import { SubscribeRecipeModalComponent } from '../ui/subscribe-recipe-modal/subscribe-recipe-modal.component';
import {
  selectRecipeSubscriptions,
  selectRecipes,
  selectSubscriptionBySourceRecipeID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { FractionService } from 'src/app/shared/utils/fractionService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { ProductService } from 'src/app/shared/utils/productService';
import { PrompUpgradeModalComponent } from 'src/app/account/feature/products/ui/promp-upgrade-modal/promp-upgrade-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';

interface displayIngredientsByComponent {
  noComponent: any[];
  components: { [componentName: string]: any[] };
}

@Component({
  selector: 'dl-public-recipe',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    SubscribeRecipeModalComponent,
    ImageFromCDN,
  ],
  templateUrl: './public-recipe.component.html',
})
export class PublicRecipeComponent {
  recipeID: WritableSignal<number> = signal(0);
  public toolsExpanded: WritableSignal<boolean> = signal(false);
  public recipe: WritableSignal<any> = signal(null);
  public recipeCategory: WritableSignal<RecipeCategory | null> = signal(null);
  public author: WritableSignal<any> = signal(false);
  public initials: WritableSignal<string> = signal('');
  ingredients: WritableSignal<any[]> = signal([]);
  recipeIngredients: WritableSignal<RecipeIngredient[]> = signal([]);
  recipeSubscription: WritableSignal<any> = signal(null);
  private profile: WritableSignal<any> = signal(null);
  private freeTierSubscribedRecipeCount: WritableSignal<number | null> =
    signal(null);

  // Onboarding
  // ** OLD ONBOARDING **
  // public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  // public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  // private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  enhancedIngredients = computed(() => {
    const recipeIngredients = this.recipeIngredients();
    const ingredients = this.ingredients();
    if (!recipeIngredients || !ingredients) return [];
    const newIngredients: any[] = [];
    for (const ingredient of ingredients) {
      const ri = recipeIngredients.find(
        (ri) => ri.ingredientID === ingredient.ingredientID
      );
      if (!ri) {
        return null;
      }
      newIngredients.push({
        ...ingredient,
        purchaseUnitRatio: ri.purchaseUnitRatio,
        component: ri.component,
        preparation: ri.preparation,
        measurement: ri.measurement,
        measurementUnit: ri.measurementUnit,
      });
    }
    return newIngredients;
  });
  displayIngredientsByComponent: Signal<displayIngredientsByComponent> =
    computed(() => {
      const enhancedIngredients = this.enhancedIngredients();
      if (!enhancedIngredients) return [];

      const mappedIngredients = enhancedIngredients.map((i) => {
        if (!i) return null;

        // Convert the measurement to a fraction
        let newMeasurement = this.fractionService.decimalToFraction(
          i.measurement
        );
        if (i.measurementUnit === 'single') {
          return {
            ...i,
            measurement: newMeasurement,
            measurementUnit: '',
          };
        }

        return {
          ...i,
          measurement: newMeasurement,
          measurementUnit:
            Number(i.measurement) > 1
              ? i.measurementUnit === 'box' ||
                i.measurementUnit === 'bunch' ||
                i.measurementUnit === 'pinch' ||
                i.measurementUnit === 'dash'
                ? i.measurementUnit + 'es'
                : i.measurementUnit + 's'
              : i.measurementUnit,
        };
      });

      mappedIngredients.sort((a, b) => a.name.localeCompare(b.name));
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
        const ing = mappedIngredients[i];
        if (ing.component) {
          if (!displayIngredientsByComponent.components[ing.component]) {
            displayIngredientsByComponent.components[ing.component] = [];
          }
          displayIngredientsByComponent.components[ing.component].push(ing);
        } else {
          displayIngredientsByComponent.noComponent.push(ing);
        }
      }
      return displayIngredientsByComponent;
    });
  ready = computed(() => {
    if (
      this.recipe() &&
      this.displayIngredientsByComponent() &&
      this.steps() &&
      this.tools() &&
      this.author() &&
      this.freeTierSubscribedRecipeCount() !== null
    ) {
      return true;
    }
    return false;
  });
  tools: WritableSignal<any[]> = signal([]);
  recipeTools: WritableSignal<any[]> = signal([]);
  steps: WritableSignal<any[]> = signal([]);
  public displaySteps: Signal<any> = computed(() => {
    const steps = this.steps();
    return steps.sort((a, b) => a.sequence - b.sequence);
  });
  recipeSteps: WritableSignal<any[]> = signal([]);

  public subscriptions: WritableSignal<any[]> = signal([]);

  private userSubscriptions: WritableSignal<any[]> = signal([]);

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
    private stepService: StepService,
    private fractionService: FractionService,
    private authService: AuthService,
    private stringsService: StringsService,
    private productService: ProductService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService
  ) {
    // handle onboarding
    // ** OLD ONBOARDING **
    // effect(
    //   () => {
    //     const profile = this.profile();
    //     if (!profile || profile.onboardingState === 0) return;
    //     if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
    //       this.onboardingHandler(profile.onboardingState);
    //     }
    //   },
    //   { allowSignalWrites: true }
    // );

    // if user is the author, redirect to the recipe page
    effect(() => {
      const recipeID = this.recipeID();
      const profile = this.authService.profile();
      const author = this.author();
      if (profile && author && profile.user_id === author.userID) {
        this.router.navigate(['/recipe', recipeID]);
      }
    });

    effect(
      () => {
        const recipeID = this.recipeID();
        this.store
          .select(selectSubscriptionBySourceRecipeID(recipeID))
          .subscribe((subscription) => {
            this.recipeSubscription.set(subscription);
          });
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
        this.recipeService
          .getSubscriptionsByRecipeID(recipeID)
          .subscribe((data) => {
            if (!data) return;
            this.subscriptions.set(data);
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
          if (profile.nameFirst || profile.nameLast) {
            this.initials.set(
              profile.nameFirst.charAt(0) + profile.nameLast.charAt(0)
            );
          }
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
          this.tools.set([
            ...this.tools(),
            { ...data[0], quantity: rt.quantity },
          ]);
        });
      });
    });

    effect(() => {
      const recipeSteps = this.recipeSteps();
      if (!recipeSteps) return;
      recipeSteps.forEach((rs) => {
        this.stepService.getByID(rs.stepID).subscribe((data) => {
          if (!data) return;
          this.steps.set([
            ...this.steps(),
            { ...data, sequence: rs.sequence, photoURL: rs.photoURL },
          ]);
        });
      });
    });
  }

  ngOnInit(): void {
    this.store.select(selectRecipes).subscribe((recipes) => {
      const subscriptions = recipes.filter((r) => r.type === 'subscription');
      this.freeTierSubscribedRecipeCount.set(
        subscriptions.filter((r) => r.freeTier === true).length
      );
    });
    this.store.select(selectRecipeSubscriptions).subscribe((subscriptions) => {
      this.userSubscriptions.set(subscriptions);
    });
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.route.paramMap.subscribe((params) => {
      this.recipeID.set(Number(params.get('recipeID')!));
    });
  }

  onFriendClick(friend: any): void {
    this.modalService.open(
      FriendModalComponent,
      {
        data: friend,
        width: '80%',
        maxWidth: '540px',
      },
      1,
      true
    );
  }

  timeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours === 0) return `${minutes}m`;
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  onSubscribeClick() {
    let allowSubscribe = false;
    // check perms for profile
    const license = this.productService.licences.recipeSubscribeLimit;
    if (this.profile().permRecipeSubscribeUnlimited === false) {
      if (this.freeTierSubscribedRecipeCount()! >= license) {
        const ref = this.modalService.open(
          PrompUpgradeModalComponent,
          {
            data: {
              titleMessage: this.stringsService.productStrings.timeToUpgrade,
              promptMessage: `You have reached the number of allowed free-tier Subscribed Recipes. Please upgrade to add more.`,
              buttonMessage: 'UPGRADE',
            },
          },
          1
        );
        if (ref) {
          ref.afterClosed().subscribe((result) => {
            if (result === 'routeToUpgrade') {
              this.router.navigate(['/products']);
            }
          });
        } else {
        }
      } else {
        allowSubscribe = true;
      }
    } else {
      allowSubscribe = true;
    }

    if (allowSubscribe) {
      if (this.recipeSubscription()) {
        this.router.navigate([
          '/recipe',
          this.recipeSubscription().newRecipeID,
        ]);
      }
      if (!this.recipeSubscription()) {
        this.modalService.open(
          SubscribeRecipeModalComponent,
          {
            data: {
              recipe: this.recipe(),
              ingredients: this.enhancedIngredients(),
              tools: this.tools(),
              steps: this.steps(),
              author: this.author(),
              // ** OLD ONBOARDING **
              // onboarding: this.profile().onboardingState === (3 || 4),
            },
            width: '90%',
            maxWidth: '640px',
            maxHeight: '840px',
          },
          1
        );
      }
    }
  }

  displayIngredientName(name: string, measurement, measurementUnit) {
    if (
      Number(measurement) > 1 &&
      (measurementUnit === 'single' || measurementUnit === '') &&
      !['s', 'S'].includes(name[name.length - 1])
    ) {
      return name + 's';
    }
    return name;
  }

  displayMeasurementUnit(unit: string, measurement: number) {
    if (unit === 'weightOunces' || unit === 'weightOunce') {
      return 'oz';
    } else if (unit.includes('tablespoon')) {
      return unit.replace('tablespoon', 'Tbsp');
    } else if (unit.includes('teaspoon')) {
      return unit.replace('teaspoon', 'tsp');
    } else return unit;
  }

  flipToolsExpanded() {
    this.toolsExpanded.set(!this.toolsExpanded());
  }

  onboardingHandler(onboardingState: number) {
    // ** OLD ONBOARDING **
    // if (onboardingState === 3) {
    //   this.onboardingModalOpen.set(true);
    //   this.reopenOnboardingModal.set(false);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.publicRecipePage,
    //         currentStep: 3,
    //         showNextButton: false,
    //       },
    //       position: {
    //         top: '40%',
    //       },
    //     },
    //     1
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe(() => {
    //       this.onboardingModalOpen.set(false);
    //       if (this.profile().onboardingState === 3) {
    //         this.showOnboardingBadge.set(true);
    //       } else {
    //         this.showOnboardingBadge.set(false);
    //       }
    //     });
    //   } else {
    //   }
    // }
    // if (onboardingState === 4) {
    //   this.onSubscribeClick();
    // }
  }

  // onboardingBadgeClick() {
  //   this.showOnboardingBadge.set(false);
  //   this.onboardingHandler(this.profile().onboardingState);
  // }
}
