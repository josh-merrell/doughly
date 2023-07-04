import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EmployeeService } from '../data/employee.service';
import { EmployeeActions } from './employee-actions';

@Injectable()
export class EmployeeEffects {
  constructor(
    private actions$: Actions,
    private employeeService: EmployeeService
  ) {}

  addEmployee$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(EmployeeActions.addEmployee),
      mergeMap((action) =>
        this.employeeService.add(action.employee).pipe(
          map((employee) =>
            EmployeeActions.addEmployeeSuccess({
              employee
            })
          ),
          catchError((error) =>
            of(EmployeeActions.addEmployeeFailure({ error }))
          )
        )
      )
    );
  });

  loadEmployees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployees),
      mergeMap(() =>
        this.employeeService.getAll().pipe(
          map((employees) =>
            EmployeeActions.loadEmployeesSuccess({
              employees,
            })
          ),
          catchError((error) =>
            of(EmployeeActions.loadEmployeesFailure({ error }))
          )
        )
      )
    )
  );
}
