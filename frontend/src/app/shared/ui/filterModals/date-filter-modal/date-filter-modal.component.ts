import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FilterOperatorEnum,
  Filter,
  FilterOption,
  FilterTypeEnum,
} from 'src/app/shared/state/shared-state';
import {
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';

@Component({
  selector: 'dl-date-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
  ],
  templateUrl: './date-filter-modal.component.html',
})
export class DateFilterModalComponent {
  FilterOperatorEnum = FilterOperatorEnum;
  form!: FormGroup;
  selectedOption: FilterOperatorEnum = FilterOperatorEnum.is;
  options = [
    FilterOperatorEnum.is,
    FilterOperatorEnum.isNot,
    FilterOperatorEnum.isAfter,
    FilterOperatorEnum.isBefore,
    FilterOperatorEnum.isBetween,
    FilterOperatorEnum.isNotBetween,
    FilterOperatorEnum.hasAnyValue,
  ];
  private inputValue2Subscription!: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      filterOption: FilterOption;
    },
    public dialogRef: MatDialogRef<DateFilterModalComponent>
  ) {}

  onSubmit(): void {
    if (this.form.valid) {
      const newFilter: Filter = {
        subject: this.data.filterOption.prop,
        operator: this.selectedOption,
        filterType: FilterTypeEnum.dateRange,
        operand1: null,
      };
      if (this.selectedOption === FilterOperatorEnum.hasAnyValue) {
        this.dialogRef.close(newFilter);
      } else {
        const operand1 = this.form.value.inputValue.toDate();
        newFilter.operand1 = operand1;
      }
      if (
        this.selectedOption === FilterOperatorEnum.isBetween ||
        this.selectedOption === FilterOperatorEnum.isNotBetween
        ) {
        const operand2 = this.form.value.inputValue2.toDate();
        newFilter.operand2 = operand2;
      }
      this.dialogRef.close(newFilter);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      inputValue: new FormControl('', [Validators.required]),
      inputValue2: new FormControl(''),
      selectedOption: new FormControl(this.selectedOption, [
        Validators.required,
      ]),
    });

    this.form
      .get('selectedOption')
      ?.valueChanges.subscribe((selectedOption) => {
        const inputValueControl = this.form.get('inputValue');
        const inputValue2Control = this.form.get('inputValue2');
        this.selectedOption = selectedOption;

        if (selectedOption === FilterOperatorEnum.hasAnyValue) {
          // Clear all validators and update the form control
          inputValueControl?.clearValidators();
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.clearValidators();
          inputValue2Control?.updateValueAndValidity();
        } else if (
          selectedOption === FilterOperatorEnum.isBetween ||
          selectedOption === FilterOperatorEnum.isNotBetween
        ) {
          // Add Validators.required and update the form control
          inputValueControl?.setValidators([Validators.required]);
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.setValidators([Validators.required]);
          inputValue2Control?.updateValueAndValidity();
        } else {
          // Add Validators.required and update the form control
          inputValueControl?.setValidators([Validators.required]);
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.clearValidators();
          inputValue2Control?.updateValueAndValidity();
        }
      });

      this.inputValue2Subscription = this.form
        .get('inputValue2')!
        .valueChanges.subscribe((value) => {
          if (value) {
            const date1 = new Date(this.form.controls['inputValue'].value);
            const date2 = new Date(value);
            if (date1 > date2) {
              this.form.controls['inputValue2'].setErrors({ dateRange: true });
            }
          }
        });

  }

  ngOnDestroy(): void {
    this.inputValue2Subscription.unsubscribe();
  }
}
