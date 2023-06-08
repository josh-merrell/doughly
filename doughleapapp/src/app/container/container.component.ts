import { Component, ContentChild } from '@angular/core';
import { EmployeeComponent } from '../employee/employee.component';
import { IngredientsService } from '../ingredients/services/ingredients.service';

@Component({
  selector: 'dl-container',
  templateUrl: './container.component.html',
  // providers: [IngredientsService]
})
export class ContainerComponent {

  @ContentChild(EmployeeComponent) employeeComponent!: EmployeeComponent;
  
  ngAfterContentInit() {
    this.employeeComponent.empID = 124;
  }
}
