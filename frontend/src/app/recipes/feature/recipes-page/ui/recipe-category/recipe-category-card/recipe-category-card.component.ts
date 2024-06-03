import { Component, Input, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { MatDialog } from '@angular/material/dialog';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';

@Component({
  selector: 'dl-recipe-category-card',
  standalone: true,
  imports: [CommonModule, ImageFromCDN],
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
