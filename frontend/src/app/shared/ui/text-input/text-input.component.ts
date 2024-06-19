import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from 
'@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dl-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor, Validator {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() formControlName: string = '';
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';
  @Input() isTextArea: boolean = false;
  @Input() noLabel: boolean = false;
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  value: string = '';
  onTouched: () => void = () => {};
  onChange: (value: string) => void = () => {};

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handle the disabled state if needed
  }

  validate(control: FormControl): ValidationErrors | null {
    return this.hasError ? { error: this.errorMessage } : null;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }
}
