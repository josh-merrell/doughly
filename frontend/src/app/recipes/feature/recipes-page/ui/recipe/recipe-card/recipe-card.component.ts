import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { Store } from '@ngrx/store';
import { RecipeCategoryActions } from 'src/app/recipes/state/recipe-category/recipe-category-actions';
import { RecipeCategoryService } from 'src/app/recipes/data/recipe-category.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
})
export class RecipeCardComponent implements OnInit {
  @Input() recipe!: Recipe;
  @Input() friendUserID!: string;
  @Input() isUserRecipe!: boolean;

  constructor(private store: Store, private recipeCategoryService: RecipeCategoryService, public router: Router) {}

  ngOnInit(): void {
  }
}
