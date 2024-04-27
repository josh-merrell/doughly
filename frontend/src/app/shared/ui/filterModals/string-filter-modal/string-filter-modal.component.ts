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
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-string-filter-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './string-filter-modal.component.html',
})
export class StringFilterModalComponent {
  form!: FormGroup;
  selectedOption: FilterOperatorEnum = FilterOperatorEnum.is;
  options = [
    FilterOperatorEnum.is,
    FilterOperatorEnum.isNot,
    FilterOperatorEnum.contains,
    FilterOperatorEnum.doesNotContain,
    FilterOperatorEnum.hasAnyValue,
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      filterOption: FilterOption;
    },
    public dialogRef: MatDialogRef<StringFilterModalComponent>
  ) {}

  onSubmit(): void {
    if (this.form.valid) {
      let operand1;
      if (this.selectedOption === FilterOperatorEnum.hasAnyValue) {
        operand1 = null;
      } else {
        operand1 = this.form.value.inputValue;
      }
      const newFilter: Filter = {
        subject: this.data.filterOption.prop,
        operator: this.selectedOption,
        filterType: FilterTypeEnum.search,
        operand1: operand1,
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
      selectedOption: new FormControl(this.selectedOption, [
        Validators.required,
      ]),
    });

    this.form
      .get('selectedOption')
      ?.valueChanges.subscribe((selectedOption) => {
        const inputValueControl = this.form.get('inputValue');
        this.selectedOption = selectedOption;

        if (selectedOption === FilterOperatorEnum.hasAnyValue) {
          // Clear all validators and update the form control
          inputValueControl?.clearValidators();
          inputValueControl?.updateValueAndValidity();
        } else {
          // Add Validators.required and update the form control
          inputValueControl?.setValidators([Validators.required]);
          inputValueControl?.updateValueAndValidity();
        }
      });
  }
}
