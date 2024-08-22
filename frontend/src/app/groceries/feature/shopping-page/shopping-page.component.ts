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
import { ShareListModalComponent } from './ui/share-list-modal/share-list-modal.component';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { UnitService } from 'src/app/shared/utils/unitService';
import { selectSharedShoppingLists } from '../../state/sharedShoppingLists/shared-shopping-list-selectors';
import {
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { ViewListSharesModalComponent } from './ui/view-list-shares-modal/view-list-shares-modal.component';

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
  checkmark: WritableSignal<string> = signal('');
  trash: WritableSignal<string> = signal('');
  draftIcon: WritableSignal<string> = signal('');
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  menuOpen: boolean = false;

  shoppingListID: WritableSignal<number> = signal(0);
  private shoppingListIngredients: WritableSignal<any> = signal([]);
  private allSharedLists: WritableSignal<any> = signal([]);
  private ingredients: WritableSignal<any> = signal([]);
  private profile: WritableSignal<any> = signal(null);
  private friends: WritableSignal<any[]> = signal([]);
  public friendsNotShared: WritableSignal<any[]> = signal([]);
  public friendsShared: WritableSignal<any[]> = signal([]);
  public listShares: WritableSignal<any[]> = signal([]);
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
  ) {
    effect(
      () => {
        const profile = this.profile();
        const allSharedLists = this.allSharedLists();
        const shoppingListID = this.shoppingListID();
        if (!profile || !allSharedLists || !shoppingListID) return;
        const sharedLists = allSharedLists.filter(
          (list: any) =>
            list.shoppingListID === shoppingListID &&
            list.invitedUserID !== profile.user_id
        );
        this.listShares.set(sharedLists);
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const friends = this.friends();
        const listShares = this.listShares();
        // update friendsNotShared
        if (friends && listShares) {
          const friendsNotShared = friends.filter(
            (friend) =>
              !listShares.find(
                (listShare) => listShare.invitedUserID === friend.userID
              )
          );
          this.friendsNotShared.set(friendsNotShared);
        }

        // update friendsShared
        if (friends && listShares) {
          const friendsShared = friends.filter((friend) =>
            listShares.find(
              (listShare) => listShare.invitedUserID === friend.userID
            )
          );
          this.friendsShared.set(friendsShared);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectFriends).subscribe((friends: any) => {
      this.friends.set(
        [...friends].sort((a, b) => {
          const nameA = a.nameLast?.toLowerCase() || '';
          const nameB = b.nameLast?.toLowerCase() || '';

          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        })
      );
    });
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
    this.store.select(selectSharedShoppingLists).subscribe((lists) => {
      this.allSharedLists.set(lists);
    });

    this.setAnimationPath();
  }

  setAnimationPath() {
    if (!document.body.classList.contains('dark')) {
      this.checkmark.set('/assets/icons/Checkmark-light.svg');
      this.trash.set('/assets/icons/Trash-light.svg');
      this.draftIcon.set('/assets/icons/Edit-light.svg');
    } else {
      this.checkmark.set('/assets/icons/Checkmark-dark.svg');
      this.trash.set('/assets/icons/Trash-dark.svg');
      this.draftIcon.set('/assets/icons/Edit-dark.svg');
    }
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
        if (result === undefined) {
          this.isLoading.set(false);
          return;
        } else if (result.status === 'cancel') {
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
              userID: null,
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
                          } Item${itemsToSave.length > 1 ? 's' : ''}. ${
                            itemsToSave.length === neededItemCount
                              ? 'Shopping List Complete!'
                              : ''
                          }`,
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
        return { ...ingr, purchasedMeasurement: this.Math.floor(newAmount) };
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

  onViewListShares() {
    console.log('view list shares clicked');
    this.modalService.open(
      ViewListSharesModalComponent,
      {
        width: '90%',
        maxWidth: '500px',
        data: {
          friendsShared: this.friendsShared(),
          shoppingListID: this.shoppingListID(),
        },
      },
      1
    );
  }

  displayIngredientName(name: string, measurement, measurementUnit) {
    if (
      Number(measurement) > 1 &&
      (measurementUnit === 'single' || measurementUnit === '') &&
      !['s', 'S'].includes(name[name.length - 1])
    ) {
      // if last letter is "y" and not preceded by a vowel, change "y" to "ies"
      if (['y'].includes(name[name.length - 1])) {
        return name.slice(0, -1) + 'ies';
      } else if (['sh'].includes(name.slice(-2))) {
        return name + 'es';
      } else {
        return name + 's';
      }
    } else if (measurementUnit === 'dozen') {
      return name + 's';
    }
    return name;
  }
  displayMeasurementUnit(unit: string, measurement: number) {
    if (!unit) return '';
    if (unit === 'weightOunces' || unit === 'weightOunce') {
      return 'oz';
    } else if (unit.includes('tablespoon')) {
      return unit.replace('tablespoon', 'Tbsp');
    } else if (unit.includes('teaspoon')) {
      return unit.replace('teaspoon', 'tsp');
    } else if (unit.includes('milliliters')) {
      return unit.replace('milliliters', 'ml');
    } else return unit;
  }

  onShareClick() {
    this.modalService.open(
      ShareListModalComponent,
      {
        width: '90%',
        maxWidth: '500px',
        data: {
          friendsNotShared: this.friendsNotShared(),
          shoppingListID: this.shoppingListID(),
        },
      },
      1
    );
  }
}
