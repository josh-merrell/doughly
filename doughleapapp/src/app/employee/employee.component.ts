import { Component } from '@angular/core';
import { IngredientsService } from '../ingredients/services/ingredients.service';

@Component({
  selector: 'dl-employee',
  templateUrl: './employee.component.html',
  providers: [IngredientsService]
})
export class EmployeeComponent {
  name: string = 'Jonny';
  empID: number = 123;

  constructor(private ingredientsService: IngredientsService) {
  }

}
