import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  WritableSignal,
  computed,
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
import {
  selectLoading as selectLoadingShoppingList,
  selectError as selectErrorShoppingList,
  selectShoppingLists,
} from '../../state/shopping-list-selectors';
import { Store } from '@ngrx/store';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ShoppingListIngredientActions } from '../../state/shopping-list-ingredient-actions';
import { ShoppingListActions } from '../../state/shopping-list-actions';
import { PurchaseIngredientsModalComponent } from './ui/purchase-ingredients-modal/purchase-ingredients-modal.component';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { UnitService } from 'src/app/shared/utils/unitService';

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
    private router: Router,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService,
    public unitService: UnitService
  ) {}

  ngOnInit(): void {
    this.store.select(selectShoppingLists).subscribe((sl: any) => {
      this.shoppingListID.set(sl[0].shoppingListID);
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
            ShoppingListActions.receiveItems({
              shoppingListID: this.shoppingListID(),
              items: itemsToSave,
              store: modalResult.store,
              purchasedBy: null,
            })
          );
          this.store
            .select(selectLoadingShoppingList)
            .pipe(
              filter((loading) => !loading),
              take(1)
            )
            .subscribe(() => {
              this.store
                .select(selectErrorShoppingList)
                .pipe(take(1))
                .subscribe((error) => {
                  if (error) {
                    console.error(
                      `Shopping List receiveItems failed: ${error.message}, CODE: ${error.statusCode}`
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
                        data: {
                          confirmationMessage: `Purchased ${
                            itemsToSave.length
                          } Item${itemsToSave.length > 1 ? 's' : ''}. ${itemsToSave.length === neededItemCount ? 'Shopping List Complete!' : ''}`,
                        },
                      },
                      1,
                      true
                    );
                  }
                });
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
    if (this.isDeleting()) {
      return;
    }
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
}
