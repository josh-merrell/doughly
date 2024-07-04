import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  forwardRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  signal,
  WritableSignal,
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
export class SelectInputComponent
  implements ControlValueAccessor, Validator, OnChanges
{
  @Input() label: string = '';
  @Input() formControlName: string = '';
  @Input() options: any[] = []; // Allow any type to handle objects
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = '';
  @Input() optionDisplayProperty: string = '';
  @Input() optionValueProperty: string = '';
  @Input() additionalOptionName: string = '';
  @Input() noLabel: boolean = false;
  @Output() newOptionSelected: EventEmitter<void> = new EventEmitter<void>();
  public sortedOptions: any[] = [];
  public filterString: string = '';

  constructor(
    public extraStuffService: ExtraStuffService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.updateSortedOptions();
    }
  }

  ngOnInit(): void {
    this.updateSortedOptions();
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

  value: any = '';
  onTouched: () => void = () => {};
  onChange: (value: any) => void = () => {};

  isOpen: WritableSignal<boolean> = signal(false);

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
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
    if (this.isOpen()) {
      console.log('scrolling');
      document
        .getElementById('expanded')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  selectOption(option: any): void {
    if (option.value === 'new') {
      this.newOptionSelected.emit();
    } else {
      this.value = option.value;
      this.onChange(this.value);
      this.onTouched();
    }
    this.isOpen.set(false);
  }

  getDisplayText(): string {
    const selectedOption = this.sortedOptions.find(
      (option) => option.value === this.value
    );
    return selectedOption ? selectedOption.display : '';
  }

  private updateSortedOptions(): void {
    if (this.optionDisplayProperty) {
      this.sortedOptions = this.options
        .map((option) => ({
          display: option[this.optionDisplayProperty],
          value: option[this.optionValueProperty],
        }))
        .filter((option) => option.value !== this.value) // Filter out the current value
        .filter((option) =>
          option.display.toLowerCase().includes(this.filterString.toLowerCase())
        ) // Filter based on filterString
        .sort((a, b) => a.display.localeCompare(b.display));
    } else {
      this.sortedOptions = this.options
        .map((option) => ({
          display: option,
          value: option,
        }))
        .filter((option) => option.value !== this.value) // Filter out the current value
        .filter((option) =>
          option.display.toLowerCase().includes(this.filterString.toLowerCase())
        ) // Filter based on filterString
        .sort();
    }
  }

  onFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterString = input.value;
    this.updateSortedOptions();
  }
}
