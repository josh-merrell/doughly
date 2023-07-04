import { createReducer, on } from '@ngrx/store';
import { EmployeeActions } from './employee-actions';
import { EmployeeState } from './employee-state';

export const initialState: EmployeeState = {
  employees: [],
  loading: false,
  error: null,
};

export const employeeReducer = createReducer(
  initialState,
  on(EmployeeActions.loadEmployees, (state) => ({
    ...state,
    loading: true,
  })),
  on(
    EmployeeActions.loadEmployeesSuccess,
    (state, { employees }) => ({
      ...state,
      employees,
      loading: false,
    })
  ),
  on(
    EmployeeActions.loadEmployeesFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  )
);