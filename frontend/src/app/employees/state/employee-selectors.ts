import { createSelector } from '@ngrx/store';

export const selectEmployees = (state: any) => state.employee.employees;

export const selectIngredientByID = (employeeID: number) =>
  createSelector(selectEmployees, (employees) =>
    employees.find(
      (employee: any) => employee.employeeID === employeeID
    )
  );
