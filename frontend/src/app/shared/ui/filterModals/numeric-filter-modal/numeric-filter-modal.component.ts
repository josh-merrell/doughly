import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Filter, FilterOperatorEnum, FilterOption, FilterTypeEnum } from 'src/app/shared/state/shared-state';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'dl-numeric-filter-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './numeric-filter-modal.component.html',
})
export class NumericFilterModalComponent {
  FilterOperatorEnum = FilterOperatorEnum;
  form!: FormGroup;
  selectedOption: FilterOperatorEnum = FilterOperatorEnum.isEqualTo;
  options = [
    FilterOperatorEnum.isEqualTo,
    FilterOperatorEnum.isNotEqualTo,
    FilterOperatorEnum.isGreaterThan,
    FilterOperatorEnum.isLessThan,
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
    public dialogRef: MatDialogRef<NumericFilterModalComponent>
  ) {}

  onSubmit(): void {
    if (this.form.valid) {
      let operand1;
      let operand2;
      if (this.selectedOption === FilterOperatorEnum.hasAnyValue) {
        operand1 = null;
        operand2 = null;
      } else if (
        this.selectedOption === FilterOperatorEnum.isBetween ||
        this.selectedOption === FilterOperatorEnum.isNotBetween
      ) {
        operand1 = this.form.value.inputValue;
        operand2 = this.form.value.inputValue2;
      } else {
        operand1 = this.form.value.inputValue;
        operand2 = null;
      }
      const newFilter: Filter = {
        subject: this.data.filterOption.prop,
        operator: this.selectedOption,
        filterType: FilterTypeEnum.numRange,
        operand1: operand1,
        operand2: operand2,
      };
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
          inputValueControl?.clearValidators();
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.clearValidators();
          inputValue2Control?.updateValueAndValidity();
        } else if (
          selectedOption === FilterOperatorEnum.isBetween ||
          selectedOption === FilterOperatorEnum.isNotBetween
        ) {
          inputValueControl?.setValidators([Validators.required]);
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.setValidators([Validators.required]);
          inputValue2Control?.updateValueAndValidity();
        } else {
          inputValueControl?.setValidators([Validators.required]);
          inputValueControl?.updateValueAndValidity();
          inputValue2Control?.clearValidators();
          inputValue2Control?.updateValueAndValidity();
        }
      });

    this.inputValue2Subscription = this.form
      .get('inputValue2')!
      ?.valueChanges.subscribe((inputValue2) => {
        if (inputValue2) {
          const inputValue1 = this.form.get('inputValue')?.value;
          if (inputValue1 > inputValue2) {
            this.form.get('inputValue2')?.setErrors({ lessThan: true });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.inputValue2Subscription.unsubscribe();
  }
}
