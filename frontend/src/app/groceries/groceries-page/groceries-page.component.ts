import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraftPageComponent } from '../feature/draft-page/draft-page.component';
import { ShoppingPageComponent } from '../feature/shopping-page/shopping-page.component';
import { Store } from '@ngrx/store';
import { selectShoppingLists } from '../state/shopping-list-selectors';
import { ShoppingListRecipeActions } from '../state/shopping-list-recipe-actions';
import { selectShoppingListRecipes } from '../state/shopping-list-recipe-selectors';
import { ShoppingListIngredientActions } from '../state/shopping-list-ingredient-actions';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { selectSharedShoppingLists } from '../state/sharedShoppingLists/shared-shopping-list-selectors';

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
  view: WritableSignal<string>;
  menuOpen: boolean = false;
  public shoppingLists: WritableSignal<any> = signal([]);
  private allSharedLists: WritableSignal<any> = signal([]);
  public listRecipes: WritableSignal<any> = signal([]);

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.view = signal('draft');
    effect(
      () => {
        const view = this.view();
        if (view === 'shared') {
          this.router.navigate(['groceries/shared']);
        } else if (view === 'shopping') {
          this.router.navigate(['groceries/shopping']);
        } else {
          this.view.set('draft');
          this.router.navigate(['groceries/draft']);
        }
      },
      { allowSignalWrites: true }
    );
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
  }

  ngOnInit(): void {
    this.checkAndUpdateView();
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
      if (shoppingLists.length === 0) {
        this.view.set('noList');
        // this.generateList();
      } else if (shoppingLists.length === 1) {
        this.view.set(shoppingLists[0].status);
      } else {
        this.view.set(shoppingLists[0].status);
      }
    });
    this.store.select(selectSharedShoppingLists).subscribe((lists) => {
      this.allSharedLists.set(lists);
    });

    this.store.select(selectShoppingListRecipes).subscribe((listRecipes) => {
      this.listRecipes.set(listRecipes);
    });
  }

  hasSharedList() {
    return this.allSharedLists().length > 0;
  }

  private checkAndUpdateView() {
    const childRoute = this.route.snapshot.firstChild;
    const childSegment = childRoute ? childRoute.url[0]?.path : 'ingredients';
    this.view.set(childSegment);
  }

  updateView(view: string) {
    this.view.set(view);
  }
}
