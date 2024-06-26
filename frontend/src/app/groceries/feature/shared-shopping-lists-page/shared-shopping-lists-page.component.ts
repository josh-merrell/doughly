import { CommonModule } from '@angular/common';
import { Component, WritableSignal, effect, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSharedShoppingLists } from '../../state/sharedShoppingLists/shared-shopping-list-selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { Profile } from 'src/app/profile/state/profile-state';
import { ShoppingListIngredientService } from '../../data/shopping-list-ingredient.service';
import { forkJoin, map } from 'rxjs';
import { Router } from '@angular/router';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { UnitService } from 'src/app/shared/utils/unitService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dl-shared-shopping-lists-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, FormsModule],
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
  private selectedListID: WritableSignal<number | null> = signal(null);
  public sharedListIngredients: WritableSignal<any> = signal({});

  constructor(
    private store: Store,
    private shoppingListIngredientService: ShoppingListIngredientService,
    private router: Router,
    public extraStuffService: ExtraStuffService,
    public unitService: UnitService
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
        const selectedListID = this.selectedListID();
        if (!selectedListID) return;
        const sharedListIngredients = this.sharedListIngredients();
        const selectedSLIngred = sharedListIngredients[selectedListID];
        const newSelectedSLIngred = {
          items: selectedSLIngred,
          itemsToSave: [],
        };
        this.selectedSLIngred.set(newSelectedSLIngred);
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
        console.log(`DISPLAY SHARED SHOPPING LISTS: `, displaySharedShoppingLists)
      },
      { allowSignalWrites: true }
    );
  }

  onPurchasedAmountChange(ingredientID: number, newAmount: number): void {
    const updatedIngredients = this.selectedSLIngred().items.map((ingr) => {
      if (ingr.ingredientID === ingredientID) {
        return { ...ingr, purchasedMeasurement: newAmount };
      }
      return ingr;
    });
    this.selectedSLIngred().items = updatedIngredients;
  }

  get saveButtonText(): string {
    const itemCount = this.selectedSLIngred().itemsToSave.length;
    const itemText = itemCount > 1 ? 'Items' : 'Item';
    return `Add ${itemCount} ${itemText} to Kitchen`;
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
  }
}
