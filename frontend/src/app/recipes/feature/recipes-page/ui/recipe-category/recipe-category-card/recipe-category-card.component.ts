import { Component, ElementRef, Input, Renderer2, ViewChild, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { MatDialog } from '@angular/material/dialog';

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
