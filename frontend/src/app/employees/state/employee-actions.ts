import { createAction, props } from '@ngrx/store';
import { Employee } from './employee-state';

const loadEmployees = createAction('[Employees] Load');
const loadEmployeesSuccess = createAction(
  '[Employees] Load Success',
  props<{ employees: Employee[] }>()
  );  
const loadEmployeesFailure = createAction(
  '[Employees] Load Failure',
  props<{ error: any }>()
  );
    
const addEmployee = createAction(
  '[Employees] Add',
  props<{ employee: Employee }>()
);
const addEmployeeSuccess = createAction(
  '[Employees] Add Success',
  props<{ employee: Employee }>()
);
const addEmployeeFailure = createAction(
  '[Employees] Add Failure',
  props<{ error: any }>()
);

export const EmployeeActions = {
  loadEmployees,
  loadEmployeesSuccess,
  loadEmployeesFailure,
  addEmployee,
  addEmployeeSuccess,
  addEmployeeFailure,
}