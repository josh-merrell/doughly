import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import { IngredientsComponent } from 'src/app/ingredients/feature/ingredients/ingredients.component';

@Component({
  selector: 'dl-ingredient-inventory-table',
  standalone: true,
  imports: [CommonModule, TableFullComponent, IngredientsComponent],
  templateUrl: './ingredient-inventory-table.component.html',
})
export class IngredientInventoryTableComponent {
  constructor(private http: HttpClient, private auth: AuthService) {}

  title = 'Ingredient Inventory';
  heading_phrase = 'Multiple entries may exist for each Ingredient.';
  button_title = 'Add Ingredient';

  ngOnInit() {}

  sendRequest = () => {
    console.log('Sending request');
    this.http
      .get('http://localhost:3000/ingredientStocks')
      .subscribe((data) => {
        console.log(data);
      });
  };
}
