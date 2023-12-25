import { AbstractControl, ValidatorFn } from "@angular/forms";
import { States } from "./types";

export function positiveIntegerValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const value = Number(control.value);
    return value > 0 && Number.isInteger(value)
      ? null
      : { notPositiveInteger: { value: control.value } };
  };
}

export function lessThanValidator(max: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const value = Number(control.value);
    return value < max ? null : { notLessThan: { value: control.value } };
  };
}

export function positiveFloatValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const value = Number(control.value);
    return value > 0 && !Number.isNaN(value)
      ? null
      : { notPositiveFloat: { value: control.value } };
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

export function isState(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return Object.values(States).includes(control.value)
      ? null
      : { notState: true };
  };
}
