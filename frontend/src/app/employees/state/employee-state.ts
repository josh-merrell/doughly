export interface Employee {
  personID: number;
  //employee table fields
  employeeID: number;
  payPerHour: number;
  hireDate: string;
  position: string;
  status: string;
  //person table fields
  nameFirst: string;
  nameLast: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  address1: string;
  address2?: string; // This may not always be provided
}

export interface EmployeeState {
  employees: Employee[];
  loading: boolean;
  error: any;
}
