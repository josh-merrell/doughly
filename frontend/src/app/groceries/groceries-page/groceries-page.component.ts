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
import { DraftPageComponent } from '../feature/draft-page/draft-page.component';
import { ShoppingPageComponent } from '../feature/shopping-page/shopping-page.component';
import { Store } from '@ngrx/store';
import { selectShoppingLists } from '../state/shopping-list-selectors';
import { ShoppingListRecipeActions } from '../state/shopping-list-recipe-actions';
import {
  selectLoading,
  selectShoppingListRecipes,
} from '../state/shopping-list-recipe-selectors';
import { ShoppingListIngredientActions } from '../state/shopping-list-ingredient-actions';

@Component({
  selector: 'dl-groceries-page',
  standalone: true,
  imports: [CommonModule, DraftPageComponent, ShoppingPageComponent],
  templateUrl: './groceries-page.component.html',
})
export class GroceriesPageComponent {
  menuOpen: boolean = false;
  public status: WritableSignal<string> = signal('draft');
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  public shoppingLists: WritableSignal<any> = signal([]);
  public listRecipes: WritableSignal<any> = signal([]);

  constructor(private renderer: Renderer2, private store: Store) {
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
    this.store.select(selectShoppingLists).subscribe((shoppingLists: any) => {
      this.shoppingLists.set(shoppingLists);
      if (shoppingLists.length === 0) {
        this.status.set('noList');
      } else if (shoppingLists.length === 1) {
        this.status.set('draft');
      } else {
        this.status.set('multipleLists');
      }
    });

    this.store.select(selectShoppingListRecipes).subscribe((listRecipes) => {
      this.listRecipes.set(listRecipes);
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
}
