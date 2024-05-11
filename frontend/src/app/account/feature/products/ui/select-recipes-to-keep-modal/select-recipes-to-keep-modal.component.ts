import { Component, WritableSignal, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { Profile } from 'src/app/profile/state/profile-state';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { ProductService } from 'src/app/shared/utils/productService';

@Component({
  selector: 'dl-select-recipes-to-keep-modal',
  standalone: true,
  imports: [],
  templateUrl: './select-recipes-to-keep-modal.component.html',
})
export class SelectRecipesToKeepModalComponent {
  public recipes: WritableSignal<Recipe[]> = signal([]);
  public profile!: WritableSignal<Profile>;
  public license = this.productService.licences;

  constructor(private store: Store, private productService: ProductService) {}

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.recipes.set(recipes);
    });
  }
}
