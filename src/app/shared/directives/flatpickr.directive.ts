import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Directive({
  selector: 'input[appFlatpickr], input[flatpickr]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FlatpickrDirective),
      multi: true,
    },
  ],
})
export class FlatpickrDirective
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() enableTime: boolean = false;
  @Input() noCalendar: boolean = false;
  @Input() mode: 'single' | 'multiple' | 'range' = 'single';
  @Input() dateFormat: string = 'Y-m-d';
  @Input() altInput: boolean = true;
  @Input() altFormat?: string;
  @Input() minDate?: string | Date;
  @Input() maxDate?: string | Date;
  @Input() time24hr: boolean = false;
  @Input() fpOptions: Record<string, any> = {};

  private fpInstance: any = null;
  private currentValue: any = null;
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.initFlatpickr();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.fpInstance) {
      if (changes['minDate']) {
        this.fpInstance.set('minDate', this.minDate || undefined);
      }
      if (changes['maxDate']) {
        this.fpInstance.set('maxDate', this.maxDate || undefined);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.fpInstance) {
      this.fpInstance.destroy();
      this.fpInstance = null;
    }
  }

  private initFlatpickr(): void {
    const inputEl = this.el.nativeElement;

    // Calcular altFormat legible según modo
    let effectiveAltFormat = this.altFormat;
    if (!effectiveAltFormat) {
      if (this.noCalendar) {
        effectiveAltFormat = this.time24hr ? 'H:i' : 'h:i K';
      } else if (this.enableTime) {
        effectiveAltFormat = this.time24hr ? 'd/m/Y H:i' : 'd/m/Y h:i K';
      } else {
        effectiveAltFormat = 'd/m/Y';
      }
    }

    let effectiveDateFormat = this.dateFormat;
    if (this.enableTime && effectiveDateFormat === 'Y-m-d') {
      effectiveDateFormat = 'Y-m-d H:i:S';
    }

    const options: any = {
      locale: Spanish,
      mode: this.mode,
      enableTime: this.enableTime,
      noCalendar: this.noCalendar,
      dateFormat: effectiveDateFormat,
      altInput: this.altInput,
      altFormat: effectiveAltFormat,
      altInputClass: (inputEl.className || 'form-control') + ' flatpickr-enhanced-input',
      time_24hr: this.time24hr,
      minDate: this.minDate,
      maxDate: this.maxDate,
      allowInput: true,
      defaultDate: this.currentValue || undefined,
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.currentValue = dateStr;
        this.onChange(dateStr);
      },
      onClose: () => {
        this.onTouched();
      },
      ...this.fpOptions,
    };

    this.fpInstance = flatpickr(inputEl, options);

    if (this.fpInstance.altInput) {
      const testId = inputEl.getAttribute('data-testid');
      if (testId) {
        inputEl.removeAttribute('data-testid');
        this.fpInstance.altInput.setAttribute('data-testid', testId);
      }

      const syncAltInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value?.trim();
        if (!val) {
          this.fpInstance.clear();
          return;
        }
        let parsed: Date | null = null;
        let isCompleteDate = false;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const parts = val.split('-');
          parsed = new Date(+parts[0], +parts[1] - 1, +parts[2]);
          isCompleteDate = true;
        } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val)) {
          const parts = val.split(/[\/\-]/);
          parsed = new Date(+parts[2], +parts[1] - 1, +parts[0]);
          isCompleteDate = true;
        }
        if (parsed && !isNaN(parsed.getTime())) {
          this.fpInstance.setDate(parsed, true);
          if (e.type === 'change') {
            this.fpInstance.close();
          }
        } else {
          try {
            this.fpInstance.setDate(val, true);
          } catch {
            // fallback
          }
        }
      };

      this.fpInstance.altInput.addEventListener('change', syncAltInput);
      this.fpInstance.altInput.addEventListener('input', syncAltInput);
      this.fpInstance.altInput.addEventListener('blur', () => {
        // Notificar a Angular forms sin forzar el cierre del calendario,
        // permitiendo hacer clic en selector de mes, año y flechas.
        this.onTouched();
      });
    }

    if (this.currentValue) {
      this.fpInstance.setDate(this.currentValue, false);
    }
  }

  writeValue(value: any): void {
    this.currentValue = value;
    if (this.fpInstance) {
      if (value) {
        this.fpInstance.setDate(value, false);
      } else {
        this.fpInstance.clear();
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.fpInstance) {
      if (this.fpInstance.altInput) {
        this.fpInstance.altInput.disabled = isDisabled;
      }
      this.el.nativeElement.disabled = isDisabled;
    }
  }
}
