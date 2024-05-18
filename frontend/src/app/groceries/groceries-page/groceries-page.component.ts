import {
  Component,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraftPageComponent } from '../feature/draft-page/draft-page.component';
import { ShoppingPageComponent } from '../feature/shopping-page/shopping-page.component';
import { Store } from '@ngrx/store';
import { selectShoppingLists } from '../state/shopping-list-selectors';
import { ShoppingListRecipeActions } from '../state/shopping-list-recipe-actions';
import { selectShoppingListRecipes } from '../state/shopping-list-recipe-selectors';
import { ShoppingListIngredientActions } from '../state/shopping-list-ingredient-actions';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';



@Component({
  selector: 'dl-groceries-page',
  standalone: true,
  imports: [
    CommonModule,
    DraftPageComponent,
    ShoppingPageComponent,
    RouterModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './groceries-page.component.html',
})
export class GroceriesPageComponent {
  public isDeleting: WritableSignal<boolean> = signal(false);
  menuOpen: boolean = false;
  public status: WritableSignal<string> = signal('');
  public shoppingLists: WritableSignal<any> = signal([]);
  public listRecipes: WritableSignal<any> = signal([]);

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private store: Store
  ) {
    effect(
      () => {
        const shoppingLists = this.shoppingLists();
        if (shoppingLists.length === 1) {
          this.store.dispatch(
            ShoppingListRecipeActions.loadShoppingListRecipes({
              shoppingListID: shoppingLists[0].shoppingListID,
            })
          );
          this.store.dispatch(
            ShoppingListIngredientActions.loadShoppingListIngredients({
              shoppingListID: shoppingLists[0].shoppingListID,
            })
          );
        }
      },
      { allowSignalWrites: true }
    );
    effect(() => {
      const status = this.status();
      if (status === 'draft') {
        this.router.navigate([
          '/groceries/draft',
          this.shoppingLists()[0].shoppingListID,
        ]);
      } else if (status === 'shopping') {
        this.router.navigate([
          '/groceries/shopping',
          this.shoppingLists()[0].shoppingListID,
        ]);
      }
    });
  }

  ngOnInit(): void {
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
      if (shoppingLists.length === 0) {
        this.status.set('noList');
        // this.generateList();
      } else if (shoppingLists.length === 1) {
        this.status.set(shoppingLists[0].status);
      } else {
        this.status.set(shoppingLists[0].status);
      }
    });

    this.store.select(selectShoppingListRecipes).subscribe((listRecipes) => {
      this.listRecipes.set(listRecipes);
    });
  }

}
