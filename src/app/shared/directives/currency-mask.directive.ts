import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appCurrencyMask], input[currencyMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  @Input() prefix: string = '$ ';

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = this.el.nativeElement;
    const rawVal = input.value;
    const numeric = this.parseNumber(rawVal);

    this.onChange(numeric);
    this.formatDisplay(numeric);
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
    const numeric = this.parseNumber(this.el.nativeElement.value);
    this.formatDisplay(numeric);
  }

  writeValue(value: any): void {
    const numeric =
      value !== null && value !== undefined && value !== ''
        ? Number(value)
        : null;
    this.formatDisplay(numeric !== null && !isNaN(numeric) ? numeric : null);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  private parseNumber(val: string): number | null {
    if (!val) return null;
    const cleanDigits = val.replace(/\D/g, '');
    if (!cleanDigits) return null;
    const parsed = parseInt(cleanDigits, 10);
    return isNaN(parsed) ? null : parsed;
  }

  private formatDisplay(val: number | null) {
    if (val === null || val === undefined || isNaN(val)) {
      this.renderer.setProperty(this.el.nativeElement, 'value', '');
      return;
    }

    const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.renderer.setProperty(
      this.el.nativeElement,
      'value',
      `${this.prefix}${formatted}`,
    );
  }
}
