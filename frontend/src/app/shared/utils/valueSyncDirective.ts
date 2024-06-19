import { Directive, HostListener, Input, OnInit } from '@angular/core';
import { FormGroupDirective, FormControlName } from '@angular/forms';

@Directive({
  selector: '[appValueSync]',
  standalone: true,
})
export class ValueSyncDirective implements OnInit {
  @Input() formControlName!: string;

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit() {
    // Initial sync if needed
    this.syncValueWithTimeout(this.formGroupDirective.form.get(this.formControlName)?.value);
  }

  @HostListener('valueChange', ['$event'])
  onValueChange(newValue: string) {
    this.syncValueWithTimeout(newValue);
  }

  private syncValueWithTimeout(newValue: string) {
    setTimeout(() => {
      const control = this.formGroupDirective.form.get(this.formControlName);
      if (control) {
        control.setValue(newValue, { emitEvent: false });
        control.updateValueAndValidity();
      }
    });
  }
}
