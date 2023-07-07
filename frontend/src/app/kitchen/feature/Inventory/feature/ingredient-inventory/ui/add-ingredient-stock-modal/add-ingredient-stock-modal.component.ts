import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subscription, map } from 'rxjs';
import { Ingredient } from 'src/app/ingredients/state/ingredient-state';
import { selectIngredientByID, selectIngredients } from 'src/app/ingredients/state/ingredient-selectors';
import { selectEmployees } from 'src/app/employees/state/employee-selectors';
import { Employee } from 'src/app/employees/state/employee-state';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';

@Component({
  selector: 'dl-add-ingredient-stock-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
  ],
  templateUrl: './add-ingredient-stock-modal.component.html',
})
export class AddIngredientStockModalComponent {
  form: FormGroup;
  submittingChanges: boolean = false;
  private BACKEND_URL = `${environment.BACKEND}`;

  ingredients$!: Observable<Ingredient[]>;
  ingredient$!: Observable<Ingredient>;
  employees$!: Observable<any>;

  private ingredientIDSubscription!: Subscription;
  private purchasedDateSubscription!: Subscription;
  private purchasedBySubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddIngredientStockModalComponent>,
    private store: Store,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      ingredientID: ['', Validators.required],
      purchasedBy: ['', Validators.required],
      purchasedDate: ['', Validators.required],
      measurement: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.ingredients$ = this.store.select(selectIngredients);
    this.employees$ = this.store.select(selectEmployees);

    const purchasedByControl = this.form.get('purchasedBy')!;
    const purchasedDateControl = this.form.get('purchasedDate')!;
    const measurementControl = this.form.get('measurement')!;
    const ingredientIDControl = this.form.get('ingredientID')!;

    this.form.get('measurement')!.disable();

    //handle changes made to 'ingredientID' field
    this.ingredientIDSubscription = this.form
      .get('ingredientID')!
      .valueChanges.subscribe((ingredientID) => {
        if (ingredientID) {
          console.log(`INGREDIENT ID: ${ingredientID}`)
          this.form.get('measurement')!.enable();
          this.ingredient$ = this.store.pipe(
            select(selectIngredientByID(ingredientID))
          );
        } else {
          this.form.get('measurement')!.disable();
        }
      });

    //handle changes made to 'purchasedBy' field
    this.purchasedBySubscription = this.form
      .get('purchasedBy')!
      .valueChanges.subscribe((selectedEmployeeID) => {
        this.employees$
          .pipe(
            map((employees: Employee[]) =>
              employees.find(
                (employee: any) => employee.employeeID === selectedEmployeeID
              )
            )
          )
          .subscribe((employee) => {
            const hireDate = new Date(employee?.hireDate || '');
            this.form
              .get('purchasedDate')!
              .setValidators([
                Validators.required,
                this.dateValidator(hireDate),
              ]);
            this.form.get('purchasedDate')!.updateValueAndValidity();
          });
      });

    //handle changes made to 'purchasedDate' field
    this.purchasedDateSubscription = this.form
      .get('purchasedDate')!
      .valueChanges.subscribe((selectedDate) => {
        const selectedDateTime = new Date(selectedDate).getTime();
        const selectedEmployeeID = purchasedByControl.value;

        this.employees$
          .pipe(
            map((employees: Employee[]) =>
              employees.find(
                (employee) => employee.employeeID === selectedEmployeeID
              )
            )
          )
          .subscribe((employee) => {
            if (employee) {
              const hireDate = new Date(employee.hireDate).getTime();
              if (selectedDateTime < hireDate) {
                purchasedDateControl.setErrors({ dateInvalid: true });
              } else {
                purchasedDateControl.setErrors(null);
              }
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.ingredientIDSubscription.unsubscribe();
    this.purchasedDateSubscription.unsubscribe();
    this.purchasedBySubscription.unsubscribe();
  }

  dateValidator(minDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      let controlDate = new Date(control.value);
      return controlDate < minDate
        ? { dateInvalid: { value: control.value } }
        : null;
    };
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submittingChanges = true;
      const date = new Date(this.form.value.purchasedDate);
      const payload = {
        ...this.form.value,
        ingredientID: parseInt(this.form.value.ingredientID, 10),
        purchasedBy: parseInt(this.form.value.purchasedBy, 10),
        purchasedDate: date.toISOString(),
        measurement: parseFloat(this.form.value.measurement),
      };
      this.http
        .post(
          `${this.BACKEND_URL}/ingredientStocks`,
          payload
        )
        .subscribe({
          next: () => {
            console.log('Ingredient Stock: Add Success')
            this.submittingChanges = false;
            //dispatch ingredientStocks update action to refresh the state
            this.store.dispatch(
              IngredientStockActions.loadIngredientStocks()
            );

            this.dialogRef.close(this.form.value);
          },
          error: (error) => {
            this.submittingChanges = false;
            this.dialogRef.close(error)
          },
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
