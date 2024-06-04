import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  WritableSignal,
  forwardRef,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { ExtraStuffService } from '../../utils/extraStuffService';

@Component({
  selector: 'dl-select-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
})
export class SelectInputComponent implements ControlValueAccessor, Validator {
  @Input() label: string = '';
  @Input() formControlName: string = '';
  @Input() options: string[] = [];
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';
  public sortedOptions: string[] = [];

  constructor(
    public extraStuffService: ExtraStuffService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.sortedOptions = this.options.sort();
  }

  private clickListener!: () => void;

  ngAfterViewInit(): void {
    this.clickListener = this.renderer.listen(
      'document',
      'click',
      (event: Event) => {
        if (!this.elementRef.nativeElement.contains(event.target)) {
          this.isOpen.set(false);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      this.clickListener();
    }
  }

  value: string = '';
  onTouched: () => void = () => {};
  onChange: (value: string) => void = () => {};

  isOpen: WritableSignal<boolean> = signal(false);

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

  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }

  selectOption(option: string): void {
    this.value = option;
    this.onChange(this.value);
    this.onTouched();
    this.isOpen.set(false);
  }
}
