import {
  Component,
  ElementRef,
  Inject,
  Renderer2,
  ViewChild,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Observable,
  combineLatest,
  forkJoin,
  map,
  switchMap,
  take,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { Router } from '@angular/router';
import { selectToolStocksByToolID } from '../../../Inventory/feature/tool-inventory/state/tool-stock-selectors';

import { selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddToolStockModalComponent } from '../../../Inventory/feature/tool-inventory/ui/add-tool-stock-modal/add-tool-stock-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { EditToolStockModalComponent } from '../../../Inventory/feature/tool-inventory/ui/edit-tool-stock-modal/edit-tool-stock-modal.component';
import { EditToolModalComponent } from '../edit-tool-modal/edit-tool-modal.component';
import { DeleteToolStockModalComponent } from '../../../Inventory/feature/tool-inventory/ui/delete-tool-stock-modal/delete-tool-stock-modal.component';
import { DeleteToolModalComponent } from '../delete-tool-modal/delete-tool-modal.component';
import { selectRecipeIDsByToolID } from 'src/app/recipes/state/recipe-tool/recipe-tool-selectors';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-tool-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tool-details-modal.component.html',
})
export class ToolDetailsModalComponent {
  globalClickListener: () => void = () => {};
  @ViewChild('stockDropdownMenu') stockDropdownMenu!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu!: ElementRef;
  toolStocks$!: any;
  recipeIDs$!: Observable<number[]>;
  toolRecipes$!: Observable<any>;
  displayRecipes$!: Observable<any>;
  menuOpen: boolean = false;
  tool: any;
  menuOpenForIndex: number = -1;
  profile: WritableSignal<any> = signal(null);

  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<ToolDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private recipeService: RecipeService,
    private router: Router,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.displayRecipes$ = this.toolRecipes$.pipe(
          switchMap((recipes: any[]) => {
            // Map each recipe to an observable fetching its shopping list
            const shoppingListObservables = recipes.map((recipe) =>
              this.recipeService.getShoppingList(recipe.recipeID, profile.checkIngredientStock).pipe(
                take(1),
                map((shoppingList) => ({
                  ...recipe,
                  shoppingList: shoppingList,
                }))
              )
            );
            // Use forkJoin to execute all observables concurrently and wait for all to complete
            return forkJoin(shoppingListObservables);
          })
        );
      }
    })
  }

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInsideStock =
          this.stockDropdownMenu?.nativeElement.contains(event.target);
        if (!clickedInsideStock && this.menuOpenForIndex !== -1) {
          this.menuOpenForIndex = -1;
        }

        const clickedInsideTool = this.dropdownMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInsideTool && this.menuOpen) {
          this.menuOpen = false;
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
  }

  ngOnInit(): void {
    this.tool = this.data.tool;
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.toolStocks$ = this.store.pipe(
      select(selectToolStocksByToolID(this.tool.toolID))
    );
    this.recipeIDs$ = this.store.pipe(
      select(selectRecipeIDsByToolID(this.tool.toolID))
    );

    this.toolRecipes$ = this.recipeIDs$.pipe(
      switchMap((recipeIDs: number[]) => {
        // Transform each recipeID into an observable of its corresponding recipe
        const recipeObservables = recipeIDs.map((recipeID) =>
          this.store.pipe(select(selectRecipeByID(recipeID)))
        );
        return combineLatest(recipeObservables);
      })
    );
  }

  updateMenuOpenForIndex(index: number) {
    if (this.menuOpenForIndex === index) {
      this.menuOpenForIndex = -1;
    } else {
      this.menuOpenForIndex = index;
    }
  }

  onRecipeClick(recipeID: number): void {
    this.router.navigate(['/recipe', recipeID]);
    this.dialogRef.close();
  }

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  toggleStockMenu(event: any, index: number) {
    event.stopPropagation();
    this.menuOpenForIndex = this.menuOpenForIndex === index ? -1 : index;
  }

  onAddStock() {
    const dialogRef = this.modalService.open(AddToolStockModalComponent, {
      data: {
        toolID: this.tool.toolID,
      },
    }, 2);
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: `Tool Stock added`,
            },
          }, 2, true);
        }
      });
    } else {
      console.warn('A modal at level 2 is already open.');
    }
  }

  openEditStockDialog(toolStockID: number) {
    const dialogRef = this.modalService.open(EditToolStockModalComponent, {
      data: {
        itemID: toolStockID,
      },
    }, 2);
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: `Tool Stock edited`,
            },
          }, 2, true);
        }
      });
    } else {
      console.warn('A modal at level 2 is already open.');
    }
  }

  openEditToolDialog() {
    const dialogRef = this.modalService.open(EditToolModalComponent, {
      data: {
        itemID: this.tool.toolID,
      },
    }, 2);
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: `Tool edited successfully`,
            },
          }, 2, true);
        }
      });
    } else {
      console.warn('A modal at level 2 is already open.');
    
    }
  }

  openDeleteStockDialog(toolStockID: number) {
    const dialogRef = this.modalService.open(DeleteToolStockModalComponent, {
      data: {
        itemID: toolStockID,
        toolName: this.tool.name,
      },
    }, 2);
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: `Tool Stock deleted`,
            },
          }, 2, true);
        }
      });
    } else {
      console.warn('A modal at level 2 is already open.');
    
    }
  }

  openDeleteToolDialog() {
    const dialogRef = this.modalService.open(DeleteToolModalComponent, {
      data: {
        itemID: this.tool.toolID,
        itemName: this.tool.name,
      },
    }, 2);
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: `Tool deleted successfully`,
            },
          }, 2, true);
          this.dialogRef.close();
        }
      });
    } else {
      console.warn('A modal at level 2 is already open.');
    
    }
  }
}
