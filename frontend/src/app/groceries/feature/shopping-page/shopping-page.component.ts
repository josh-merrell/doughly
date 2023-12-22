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
import { ActivatedRoute } from '@angular/router';
import { selectShoppingListIngredients } from '../../state/shopping-list-ingredient-selectors';
import { Store } from '@ngrx/store';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

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
  public isLoading: WritableSignal<boolean> = signal(true);
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  menuOpen: boolean = false;

  shoppingListID: WritableSignal<number> = signal(0);
  private shoppingListIngredients: WritableSignal<any> = signal([]);
  private ingredients: WritableSignal<any> = signal([]);
  public displaySLIngr = computed(() => {
    const ingredients = this.ingredients();
    const slIngr = this.shoppingListIngredients();
    let itemsToSave: any[] = [];
    const items = slIngr.map((sling: any) => {
      const matchingIngredient = ingredients.find(
        (ingredient: any) => ingredient.ingredientID === sling.ingredientID
      );
      if (!sling.store && sling.purchasedMeasurement) {
        itemsToSave.push({
          ingredientID: sling.ingredientID,
          purchasedMeasurement: sling.purchasedMeasurement,
          purchasedUnit: sling.needUnit,
        });
      }
      return {
        ...sling,
        name: matchingIngredient.name,
      };
    });
    return {
      items: items,
      itemsToSave,
    };
  });

  constructor(
    private store: Store,
    private renderer: Renderer2,
    private route: ActivatedRoute
  ) {
    effect(() => {
      const shoppingListID = this.shoppingListID();
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.shoppingListID.set(Number(params.get('shoppingListID')!));
    });
    this.store.select(selectIngredients).subscribe((ingr: any) => {
      console.log(`INGR: `, ingr);
      this.ingredients.set(ingr);
    });
    this.store
      .select(selectShoppingListIngredients)
      .subscribe((slIngr: any) => {
        this.isLoading.set(false);
        console.log(`SLINGR: `, slIngr);
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
    console.log('save clicked');
    // open storeSelect Modal

    // if result is not 'cancel', proceed

    // bulkAddIngredientStocks action

    // for any that succeeded, update shoppingListIngredient

    // if any items still have no 'store' value, return

    // update state of shoppingList to 'complete' (server will create new draft list)

    // navigate to /groceries page
    this.isLoading.set(false);
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
}
