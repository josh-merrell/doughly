import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/utils/authenticationService';

@Component({
  selector: 'dl-ingredient-inventory-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-inventory-table.component.html',
})
export class IngredientInventoryTableComponent {
  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {

  }
  
  sendRequest = () => {
    console.log('Sending request');
    this.http
      .get(
        'http://localhost:3000/ingredientStocks'
      )
      .subscribe((data) => {
        console.log(data);
      });
  };
}
