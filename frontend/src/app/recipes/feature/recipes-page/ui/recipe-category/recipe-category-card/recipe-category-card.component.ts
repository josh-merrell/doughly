import { Component, ElementRef, Input, Renderer2, ViewChild, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { MatDialog } from '@angular/material/dialog';
import { DeleteRecipeCategoryModalComponent } from '../delete-recipe-category-modal/delete-recipe-category-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { EditRecipeCategoryModalComponent } from '../edit-recipe-category-modal/edit-recipe-category-modal.component';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';

@Component({
  selector: 'dl-recipe-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-category-card.component.html',
})
export class RecipeCategoryCardComponent {
  @Input() category!: RecipeCategory;
  public menuOpen: WritableSignal<boolean> = signal(false);
  @ViewChild('categoryMenu') categoryMenu!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(public dialog: MatDialog, private renderer: Renderer2) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.categoryMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.categoryMenu) {
          this.closeCategoryMenu();
        }
      }
    );
  }

  closeCategoryMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(event: any): void {
    event.stopPropagation();
    this.menuOpen.set(!this.menuOpen());
  }

  openDeleteDialog(categoryName: string): void {
    const dialogRef = this.dialog.open(DeleteRecipeCategoryModalComponent, {
      data: {
        categoryName,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage:
              'Category could not be delete. Try again later.',
          },
        });
      } else if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `Category "${categoryName}" deleted successfully.`,
          },
        });
      }
    });
  }

  openEditDialog(category: RecipeCategory): void {
    const dialogRef = this.dialog.open(EditRecipeCategoryModalComponent, {
      data: category,
      width: '75%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage:
              'Category could not be delete. Try again later.',
          },
        });
      } else if (result === 'success') {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `Category "${category.name}" deleted successfully.`,
          },
        });
      }
    });
  }
}
