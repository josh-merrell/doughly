import { AbstractControl, ValidatorFn } from "@angular/forms";

export function positiveIntegerValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const value = Number(control.value);
    return value > 0 && Number.isInteger(value)
      ? null
      : { notPositiveInteger: { value: control.value } };
  };
}

export function enumValidator(enumValues: any): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return enumValues[control.value]
      ? null
      : { notInEnum: { value: control.value } };
  };
}

export function nonDuplicateString(stringArray: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return stringArray.includes(control.value)
      ? { duplicateString: { value: control.value } }
      : null;
  };
}

export function twoByteInteger(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null; // New line

    const value = Number(control.value);
    return value >= 0 && value < 32767 && Number.isInteger(value)
      ? null
      : { notTwoByteInteger: { value: control.value } };
  }
}
