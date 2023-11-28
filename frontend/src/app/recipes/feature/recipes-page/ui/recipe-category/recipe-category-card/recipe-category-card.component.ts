import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';

@Component({
  selector: 'dl-recipe-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-category-card.component.html',
})
export class RecipeCategoryCardComponent {
  @Input() category!: RecipeCategory;
}
