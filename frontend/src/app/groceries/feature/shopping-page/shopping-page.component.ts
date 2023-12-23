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
  selectDeleting,
  selectShoppingListIngredients,
  selectTempPurchasing,
  selectUpdating,
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
import { ListFulfilledModalComponent } from './ui/list-fulfilled-modal/list-fulfilled-modal.component';

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
    const ingredients = this.ingredients();
    const slIngr = this.shoppingListIngredients();
    let itemsToSave: any[] = [];
    const items = slIngr.map((sling: any) => {
      const matchingIngredient = ingredients.find(
        (ingredient: any) => ingredient.ingredientID === sling.ingredientID
      );
      const newSLI = {
        ...sling,
        name: matchingIngredient.name,
      };
      newSLI.valueValid = newSLI.purchasedMeasurement && newSLI.purchasedMeasurement < newSLI.needMeasurement ? false : true;
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
      items: items,
      itemsToSave,
    };
  });

  constructor(
    private store: Store,
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
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
    const ref = this.dialog.open(PurchaseIngredientsModalComponent, {
      width: '50%',
      maxWidth: '360px',
    });
    let modalResult;
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
        this.store.select(selectTempPurchasing).subscribe((tempPurchasing: any) => {
          if (!tempPurchasing) {
            this.isLoading.set(false);
            if (itemsToSave.length === neededItemCount) {
              const successRef = this.dialog.open(ListFulfilledModalComponent, {
                width: '50%',
                maxWidth: '360px',
              });
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
    this.store.select(selectDeleting).subscribe((deleting) => {
      if (!deleting) {
        this.isDeleting.set(false);
      }
    });
  }
}
