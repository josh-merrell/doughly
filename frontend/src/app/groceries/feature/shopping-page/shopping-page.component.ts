import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import {
  selectDeleting as selectDeletingShoppingListIngredient,
  selectShoppingListIngredients,
  selectTempPurchasing,
  selectUpdating as selectUpdatingShoppingListIngredient,
  selectError as selectErrorShoppingListIngredient,
} from '../../state/shopping-list-ingredient-selectors';
import { Store } from '@ngrx/store';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ShoppingListIngredientActions } from '../../state/shopping-list-ingredient-actions';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseIngredientsModalComponent } from './ui/purchase-ingredients-modal/purchase-ingredients-modal.component';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { StylesService } from 'src/app/shared/utils/stylesService';

@Component({
  selector: 'dl-shopping-page',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './shopping-page.component.html',
})
export class ShoppingPageComponent {
  Math = Math;
  public isDeleting: WritableSignal<boolean> = signal(false);
  public isLoading: WritableSignal<boolean> = signal(true);
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  menuOpen: boolean = false;

  shoppingListID: WritableSignal<number> = signal(0);
  private shoppingListIngredients: WritableSignal<any> = signal([]);
  private ingredients: WritableSignal<any> = signal([]);
  public displaySLIngr = computed(() => {
    const ingredients = this.ingredients() || [];
    const slIngr = this.shoppingListIngredients() || [];
    let itemsToSave: any[] = [];
    const items = slIngr.map((sling: any) => {
      if (!sling || typeof sling !== 'object') return sling;
      const matchingIngredient = ingredients.find(
        (ingredient: any) => ingredient.ingredientID === sling.ingredientID
      );
      const newSLI = {
        ...sling,
        name:
          matchingIngredient && matchingIngredient.name
            ? matchingIngredient.name
            : '',
      };
      newSLI.valueValid =
        newSLI.purchasedMeasurement &&
        newSLI.purchasedMeasurement < newSLI.needMeasurement
          ? false
          : true;
      if (!sling.store && sling.purchasedMeasurement && newSLI.valueValid) {
        itemsToSave.push({
          shoppingListIngredientID: sling.shoppingListIngredientID,
          ingredientID: sling.ingredientID,
          purchasedMeasurement: sling.purchasedMeasurement,
          purchasedUnit: sling.needUnit,
        });
      }
      return newSLI;
    });
    return {
      items: items.sort((a: any, b: any) => {
        // Additional check for undefined or null names
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      }),
      itemsToSave,
    };
  });

  constructor(
    private store: Store,
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private modalService: ModalService,
    private authService: AuthService,
    private stylesService: StylesService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.shoppingListID.set(Number(params.get('shoppingListID')!));
    });
    this.store.select(selectIngredients).subscribe((ingr: any) => {
      this.ingredients.set(ingr);
    });
    this.store
      .select(selectShoppingListIngredients)
      .subscribe((slIngr: any) => {
        this.isLoading.set(false);
        this.shoppingListIngredients.set(slIngr);
      });
  }

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
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

  // INTERACTIVITY FUNCTIONS **************************
  onDeleteClick() {
    console.log('delete clicked');
  }

  onSaveClick() {
    this.isLoading.set(true);
    // open storeSelect Modal
    const ref = this.modalService.open(
      PurchaseIngredientsModalComponent,
      {
        width: '50%',
        maxWidth: '360px',
      },
      1
    );
    let modalResult;
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result.status === 'cancel') {
          this.isLoading.set(false);
          return;
        } else if (result.status === 'confirm') {
          modalResult = result;

          const itemsToSave = this.displaySLIngr().itemsToSave;
          itemsToSave.forEach((item: any) => {
            item.purchasedDate = new Date().toISOString();
          });
          const neededItemCount = this.displaySLIngr().items.filter(
            (item: any) => !item.store
          ).length;
          this.store.dispatch(
            ShoppingListIngredientActions.batchUpdateShoppingListIngredientStocks(
              {
                shoppingListID: this.shoppingListID(),
                store: modalResult.store,
                shoppingListIngredients: itemsToSave,
                listComplete: itemsToSave.length === neededItemCount,
              }
            )
          );

          // subscribe to 'selectTempPurchase'. When it is false, then set isLoading to false and navigate navigate to /groceries page
          this.store
            .select(selectTempPurchasing)
            .subscribe((tempPurchasing: any) => {
              if (!tempPurchasing) {
                this.isLoading.set(false);
                if (itemsToSave.length === neededItemCount) {
                  this.modalService.open(
                    ConfirmationModalComponent,
                    {
                      data: {
                        confirmationMessage: 'Shopping List Completed',
                      },
                    },
                    1,
                    true
                  );
                } else {
                  this.router.navigate(['/groceries']);
                }
              }
            });
        } else {
          this.isLoading.set(false);
          return;
        }
      });
    } else {
    }
  }

  onPurchasedAmountChange(ingredientID: number, newAmount: number): void {
    const updatedIngredients = this.displaySLIngr().items.map((ingr) => {
      if (ingr.ingredientID === ingredientID) {
        return { ...ingr, purchasedMeasurement: newAmount };
      }
      return ingr;
    });

    this.shoppingListIngredients.set(updatedIngredients);
  }

  get saveButtonText(): string {
    const itemCount = this.displaySLIngr().itemsToSave.length;
    const itemText = itemCount > 1 ? 'Items' : 'Item';
    return `Add ${itemCount} ${itemText} to Kitchen`;
  }

  onDeleteItemClick(shoppingListIngredientID: number) {
    this.isDeleting.set(true);
    this.store.dispatch(
      ShoppingListIngredientActions.deleteShoppingListIngredient({
        shoppingListIngredientID,
        shoppingListID: this.shoppingListID(),
      })
    );
    this.store
      .select(selectDeletingShoppingListIngredient)
      .pipe(
        filter((deleting) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingListIngredient)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Shopping List Ingredient delete failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                1,
                true
              );
            } else {
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage: 'Item removed from Shopping List.',
                  },
                },
                1,
                true
              );
            }
            this.isDeleting.set(false);
          });
      });
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode ? '#27AB83' : '#3EBD93';
      case 2:
        return darkMode ? '#CBD2D9' : '#3E4C59';
      case 3:
        return darkMode ? '#BC0A6F' : '#F364A2';
      default:
        return darkMode ? '#27AB83' : '#3EBD93';
    }
  }
}
