import { Component, ElementRef, Input, Renderer2, ViewChild, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';

@Component({
  selector: 'dl-recipe-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-category-card.component.html',
})
export class RecipeCategoryCardComponent {
  @Input() category!: RecipeCategory;
  @Input() inModal: boolean = false;
  constructor(public dialog: MatDialog, private renderer: Renderer2) {}

  countText(): string {
    return this.category.recipeCount === 1 ? 'recipe' : 'recipes';
  }

  ngOnInit(): void {}
}
