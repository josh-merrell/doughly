import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Inject } from '@angular/core';
import { selectIngredientStockByID } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { IngredientStock } from '../../state/ingredient-stock-state';
import { IngredientStockActions } from '../../state/ingredient-stock-actions';
import { Ingredient } from 'src/app/ingredients/state/ingredient-state';
import { selectIngredientByID } from 'src/app/ingredients/state/ingredient-selectors';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { selectEmployees } from 'src/app/employees/state/employee-selectors';
import { environment } from 'src/environments/environment';
import { Employee } from 'src/app/employees/state/employee-state';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'dl-edit-ingredient-stock-modal',
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
  templateUrl: './edit-ingredient-stock-modal.component.html',
})
export class EditIngredientStockModalComponent {
  ingredientStock$!: Observable<IngredientStock>;
  form: FormGroup;
  employees$!: Observable<Employee[]>;
  submittingChanges: boolean = false;
  private BACKEND_URL = `${environment.BACKEND}`;
  ingredient$!: Observable<Ingredient>;

  constructor(
    public dialogRef: MatDialogRef<EditIngredientStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      purchasedBy: ['', Validators.required],
      purchasedDate: ['', Validators.required],
      measurement: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.employees$ = this.store.pipe(select(selectEmployees));

    this.ingredientStock$ = this.store.pipe(
      select(selectIngredientStockByID(this.data.itemID))
    );
    const purchasedByControl = this.form.get('purchasedBy')!;
    const purchasedDateControl = this.form.get('purchasedDate')!;

    this.ingredientStock$
      .pipe(
        switchMap((ingredientStock) => {
          this.ingredient$ = this.store.pipe(
            select(selectIngredientByID(ingredientStock.ingredientID))
          );
          return combineLatest([of(ingredientStock), this.ingredient$]);
        })
      )
      .subscribe(([ingredientStock, ingredient]) => {
        const newMeasurement = (
          ingredientStock.grams / ingredient.gramRatio
        ).toFixed(2);

        this.form.patchValue({
          purchasedBy: ingredientStock.purchasedBy,
          purchasedDate: ingredientStock.purchasedDate,
          measurement: newMeasurement,
        });
      });

    this.form
      .get('purchasedBy')!
      .valueChanges.subscribe((selectedEmployeeId) => {
        this.employees$
          .pipe(
            map((employees) =>
              employees.find(
                (employee) => employee.employeeID === selectedEmployeeId
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

    this.form
      .get('purchasedDate')!
      .valueChanges.subscribe((selectedDate) => {
        const selectedDateTime = new Date(selectedDate).getTime();
        const selectedEmployeeId = purchasedByControl.value;

        this.employees$.pipe(
          map((employees) =>
            employees.find((employee) => employee.employeeID === selectedEmployeeId)
          )
        ).subscribe((employee) => {
          if (employee) {
            const hireDate = new Date(employee.hireDate).getTime();
            if (selectedDateTime < hireDate) {
              purchasedDateControl.setErrors({ dateInvalid: true });
            } else {
              purchasedDateControl.setErrors(null);
            }
          }
        });
      })

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
        purchasedBy: parseInt(this.form.value.purchasedBy, 10),
        purchasedDate: date.toISOString(),
        measurement: parseFloat(this.form.value.measurement),
      };
      this.http
        .patch(
          `${this.BACKEND_URL}/ingredientStocks/${this.data.itemID}`,
          payload
        )
        .subscribe({
          next: () => {
            this.submittingChanges = false;
            // dispatch ingredientStock update action to refresh its state
            this.store.dispatch(
              IngredientStockActions.loadIngredientStock({
                ingredientStockID: this.data.itemID,
              })
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
