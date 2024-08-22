import { CommonModule } from '@angular/common';
import { Component, WritableSignal, effect, signal } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { selectSharedShoppingLists } from '../../state/sharedShoppingLists/shared-shopping-list-selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { Profile } from 'src/app/profile/state/profile-state';
import { ShoppingListIngredientService } from '../../data/shopping-list-ingredient.service';
import { filter, forkJoin, map, take } from 'rxjs';
import { Router } from '@angular/router';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { UnitService } from 'src/app/shared/utils/unitService';
import { FormsModule } from '@angular/forms';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { ModalService } from 'src/app/shared/utils/modalService';
import { PurchaseIngredientsModalComponent } from '../shopping-page/ui/purchase-ingredients-modal/purchase-ingredients-modal.component';
import {
  selectLoading as selectLoadingShoppingList,
  selectError as selectErrorShoppingList,
  selectShoppingLists,
} from '../../state/shopping-list-selectors';
import { ShoppingListActions } from '../../state/shopping-list-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';

@Component({
  selector: 'dl-shared-shopping-lists-page',
  standalone: true,
  imports: [CommonModule, ImageFromCDN, MatProgressSpinnerModule, FormsModule],
  templateUrl: './shared-shopping-lists-page.component.html',
})
export class SharedShoppingListsPageComponent {
  Math = Math;
  public isLoading: WritableSignal<boolean> = signal(false);
  private profile: WritableSignal<Profile | null> = signal(null);
  public displaySharedShoppingLists: WritableSignal<any[]> = signal([]);
  public selectedSLIngred: WritableSignal<any> = signal([]);
  public sharedLists: WritableSignal<any[]> = signal([]);
  private allSharedLists: WritableSignal<any> = signal([]);
  private friends: WritableSignal<any[]> = signal([]);
  public selectedListID: WritableSignal<number | null> = signal(null);
  public sharedListIngredients: WritableSignal<any> = signal({});
  checkmark: WritableSignal<string> = signal('');
  trash: WritableSignal<string> = signal('');
  draftIcon: WritableSignal<string> = signal('');

  constructor(
    private store: Store,
    private shoppingListIngredientService: ShoppingListIngredientService,
    private router: Router,
    public extraStuffService: ExtraStuffService,
    public unitService: UnitService,
    private modalService: ModalService,
    private pushTokenService: PushTokenService
  ) {
    effect(
      () => {
        const profile = this.profile();
        const allSharedLists = this.allSharedLists();
        if (!profile || !allSharedLists) return;
        const sharedLists = allSharedLists.filter(
          (list: any) => list.invitedUserID === profile.userID
        );
        this.sharedLists.set(sharedLists);
        if (sharedLists.length > 0) {
          this.selectedListID.set(sharedLists[0].shoppingListID);
        }
        this.isLoading.set(true);

        const ingredientObservables = sharedLists.map((list: any) =>
          this.shoppingListIngredientService
            .getDisplayIngredientsByShoppingListID(list.shoppingListID)
            .pipe(
              map((ingredients) => ({
                shoppingListID: list.shoppingListID,
                ingredients,
              }))
            )
        );
        forkJoin(ingredientObservables).subscribe((results: any) => {
          const updatedIngredients = results.reduce(
            (acc, { shoppingListID, ingredients }) => {
              acc[shoppingListID] = ingredients;
              return acc;
            },
            { ...this.sharedListIngredients() }
          );
          this.sharedListIngredients.set(updatedIngredients);
          this.isLoading.set(false);
        });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        console.log('here');
        const selectedListID = this.selectedListID();
        if (!selectedListID) return;
        const sharedListIngredients = this.sharedListIngredients();
        const selectedSLIngred = sharedListIngredients[selectedListID];
        // add 'valueValid' property to each ingredient. Should be false if 'purchasedMeasurement' is present and less than 'neededMeasurement'
        if (!selectedSLIngred) return;
        selectedSLIngred.forEach((ingr: any) => {
          ingr.valueValid =
            !ingr.purchasedMeasurement ||
            ingr.purchasedMeasurement >= ingr.neededMeasurement;
        });
        const newSelectedSLIngred = {
          items: selectedSLIngred,
          itemsToSave: [],
        };
        this.selectedSLIngred.set(newSelectedSLIngred);
        console.log(`SELECTED SL INGRED: `, newSelectedSLIngred);
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const sharedLists = this.sharedLists();
        const friends = this.friends();
        if (sharedLists.length === 0 || friends.length === 0) return;
        const displaySharedShoppingLists = sharedLists.map((list: any) => {
          const friend = friends.find((f) => f.userID === list.userID);
          return {
            ...list,
            friend,
          };
        });

        this.displaySharedShoppingLists.set(displaySharedShoppingLists);
        console.log(
          `DISPLAY SHARED SHOPPING LISTS: `,
          displaySharedShoppingLists
        );
      },
      { allowSignalWrites: true }
    );
  }

  onPurchasedMeasurementChange(ingredientID: number, newAmount: number): void {
    let itemsToSave: any[] = [];
    const updatedIngredients = this.selectedSLIngred().items.map((ingr) => {
      const valueValid =
        !ingr.purchasedMeasurement ||
        ingr.purchasedMeasurement >= ingr.needMeasurement;
      if (!ingr.store && ingr.purchasedMeasurement && valueValid) {
        itemsToSave.push({
          shoppingListIngredientID: ingr.shoppingListIngredientID,
          ingredientID: ingr.ingredientID,
          purchasedMeasurement: this.Math.floor(ingr.purchasedMeasurement),
          purchasedUnit: ingr.needUnit,
        });
      }
      if (ingr.ingredientID === ingredientID) {
        return {
          ...ingr,
          purchasedMeasurement: this.Math.floor(newAmount),
          valueValid,
        };
      }
      return { ...ingr, valueValid };
    });
    this.selectedSLIngred.set({
      items: updatedIngredients,
      itemsToSave,
    });
    console.log(`SELECTED SL INGRED: `, this.selectedSLIngred());
  }

  get saveButtonText(): string {
    const itemCount = this.selectedSLIngred().itemsToSave.length;
    const selectedList = this.displaySharedShoppingLists().find(
      (list) => list.shoppingListID === this.selectedListID()
    );
    const authorUsername = selectedList?.friend?.username || 'Friend';
    const itemText = itemCount > 1 ? 'Items' : 'Item';
    return `Add ${itemCount} ${itemText} to ${authorUsername}'s Kitchen`;
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectSharedShoppingLists).subscribe((lists) => {
      if (lists.length === 0) {
        this.router.navigate(['/groceries']);
      }
      this.allSharedLists.set(lists);
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

  onSaveClick() {
    console.log(`SAVING ITEMS: `, this.selectedSLIngred().itemsToSave);
    // get correct list
    const selectedList = this.displaySharedShoppingLists().find(
      (list) => list.shoppingListID === this.selectedListID()
    );

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
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (!result || !result.store) {
          console.error(`Store required`);
          this.isLoading.set(false);
          this.modalService.open(
            ErrorModalComponent,
            {
              maxWidth: '380px',
              data: {
                errorMessage: `Store required`,
                statusCode: 400,
              },
            },
            1,
            true
          );
        } else if (result.status === 'cancel') {
          this.isLoading.set(false);
          return;
        } else if (result.status === 'confirm') {
          const itemsToSave = this.selectedSLIngred().itemsToSave;
          itemsToSave.forEach((ingr) => {
            ingr.purchasedDate = new Date().toISOString();
          });

          const neededItemCount = this.selectedSLIngred().items.filter(
            (ingr) => !ingr.store
          ).length;
          this.store.dispatch(
            ShoppingListActions.receiveItems({
              shoppingListID: this.selectedListID() || 0,
              items: itemsToSave,
              store: result.store,
              purchasedBy: this.profile()!.userID,
              userID: selectedList.friend.userID,
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
                    this.sendPushNotification(
                      selectedList.friend.userID,
                      itemsToSave.length
                    );
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
    }
  }

  sendPushNotification(friendUserID, itemCount: number) {
    if (!friendUserID || !itemCount) {
      return;
    }
    this.pushTokenService
      .sendPushNotificationToUserNoCheck(
        friendUserID,
        'notifyFriendListProgress',
        {
          purchasedBy: this.profile()!.username,
          itemCount,
        }
      )
      .subscribe(
        () => {},
        (error) => {
          console.error(
            'Error sending push notification after sharing list: ',
            error
          );
        }
      );
  }

  onListClick(shoppingListID: number): void {
    this.selectedListID.set(shoppingListID);
  }

  getItemCountString(list: any) {
    const listIngredients = this.sharedListIngredients()[list.shoppingListID];
    const totalCount = listIngredients.length;
    const purchasedCount = listIngredients.filter(
      (ingr) => ingr.store && ingr.purchasedMeasurement
    ).length;
    return `${purchasedCount} of ${totalCount}`;
  }
}
