import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Employee } from '../state/employee-state';


@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private API_URL = `${environment.BACKEND}/employees`;

  constructor(private http: HttpClient, private store: Store) {}

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.API_URL);
  }

  getByID(employeeID: number): Observable<Employee> {
    return this.http.get<Employee>(
      `${this.API_URL}/${employeeID}`
    );
    }
    
  add(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.API_URL, employee);
  }

}
