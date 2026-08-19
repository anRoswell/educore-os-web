import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchableOption {
  value: any;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeClass?: string;
  icon?: string;
  avatarText?: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="searchable-select-container" [class.is-open]="isOpen()" [class.is-disabled]="disabled">
      <!-- Selector Trigger Display -->
      <div
        class="select-trigger form-control"
        [class.has-value]="!!selectedOption()"
        (click)="toggleDropdown()"
        tabindex="0"
        (keydown.enter)="toggleDropdown()"
        (keydown.space)="toggleDropdown(); $event.preventDefault()"
        (keydown.escape)="closeDropdown()"
      >
        <div class="selected-content">
          @if (selectedOption()) {
            <div class="selected-item-preview">
              @if (selectedOption()?.avatarText) {
                <span class="avatar-pill">{{ selectedOption()?.avatarText }}</span>
              } @else if (selectedOption()?.icon) {
                <span class="icon-pill">{{ selectedOption()?.icon }}</span>
              }
              <div class="label-box">
                <span class="main-label">{{ selectedOption()?.label }}</span>
                @if (selectedOption()?.sublabel) {
                  <span class="sub-label">{{ selectedOption()?.sublabel }}</span>
                }
              </div>
              @if (selectedOption()?.badge) {
                <span class="badge" [ngClass]="selectedOption()?.badgeClass || 'badge-primary'">
                  {{ selectedOption()?.badge }}
                </span>
              }
            </div>
          } @else {
            <span class="placeholder-text">
              <span class="search-hint-icon">🔍</span> {{ cleanPlaceholder() }}
            </span>
          }
        </div>

        <div class="trigger-actions">
          @if (selectedOption() && clearable && !disabled) {
            <button
              type="button"
              class="btn-clear"
              (click)="clearSelection($event)"
              title="Limpiar selección"
            >
              &times;
            </button>
          }
          <span class="arrow-indicator" [class.rotated]="isOpen()">▼</span>
        </div>
      </div>

      <!-- Dropdown Filterable Menu -->
      @if (isOpen()) {
        <div class="select-dropdown animate-fade-in card-glass">
          <!-- Search Header Input -->
          <div class="search-box-header">
            <span class="search-prefix-icon">🔎</span>
            <input
              #searchInput
              type="text"
              class="search-input"
              [placeholder]="cleanSearchPlaceholder()"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              (click)="$event.stopPropagation()"
              (keydown.escape)="closeDropdown()"
              (keydown.arrowdown)="focusFirstOption($event)"
            />
            @if (searchQuery()) {
              <button type="button" class="btn-clear-search" (click)="clearSearch($event)">
                &times;
              </button>
            }
          </div>

          <!-- Options Counter Bar -->
          <div class="options-meta-bar">
            <span>{{ filteredOptions().length }} resultados encontrados</span>
            @if (searchQuery()) {
              <span class="filter-tag">Filtrando: "{{ searchQuery() }}"</span>
            }
          </div>

          <!-- Options List -->
          <div class="options-list" role="listbox">
            @for (opt of filteredOptions(); track opt.value) {
              <div
                class="option-item"
                [class.is-selected]="isSelected(opt)"
                (click)="selectOption(opt)"
                role="option"
                [attr.aria-selected]="isSelected(opt)"
              >
                <div class="option-left">
                  @if (opt.avatarText) {
                    <span class="avatar-pill">{{ opt.avatarText }}</span>
                  } @else if (opt.icon) {
                    <span class="icon-pill">{{ opt.icon }}</span>
                  }
                  <div class="option-texts">
                    <span class="option-title">{{ opt.label }}</span>
                    @if (opt.sublabel) {
                      <span class="option-subtitle">{{ opt.sublabel }}</span>
                    }
                  </div>
                </div>

                <div class="option-right">
                  @if (opt.badge) {
                    <span class="badge" [ngClass]="opt.badgeClass || 'badge-secondary'">
                      {{ opt.badge }}
                    </span>
                  }
                  @if (isSelected(opt)) {
                    <span class="check-icon">✓</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-results-state">
                <span class="empty-icon">📂</span>
                <p class="empty-title">No se encontraron coincidencias</p>
                <p class="empty-subtitle">Intente buscar con otro nombre, apellido o número de documento.</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .searchable-select-container {
      position: relative;
      width: 100%;
      user-select: none;
      font-family: inherit;
    }

    .select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 44px;
      padding: 0.4rem 0.75rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

      &:hover {
        border-color: #94a3b8;
        background: #f8fafc;
      }

      &:focus, &:focus-visible {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
      }
    }

    .searchable-select-container.is-open .select-trigger {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    .searchable-select-container.is-disabled {
      opacity: 0.6;
      pointer-events: none;
      background: #f1f5f9;
    }

    .selected-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .placeholder-text {
      color: #94a3b8;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .search-hint-icon {
      font-size: 0.85rem;
    }

    .selected-item-preview {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
    }

    .avatar-pill {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-pill {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .label-box {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      line-height: 1.2;
    }

    .main-label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sub-label {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trigger-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-left: 0.5rem;
      flex-shrink: 0;
    }

    .btn-clear {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      line-height: 1;
      padding: 0 0.2rem;
      cursor: pointer;
      border-radius: 4px;
      transition: color 0.15s;

      &:hover {
        color: #ef4444;
      }
    }

    .arrow-indicator {
      font-size: 0.65rem;
      color: #64748b;
      transition: transform 0.2s ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }

    /* Dropdown Styles */
    .select-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-box-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .search-prefix-icon {
      font-size: 0.9rem;
      color: #64748b;
    }

    .search-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.4rem 0.6rem;
      font-size: 0.85rem;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s;

      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
      }
    }

    .btn-clear-search {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0 0.25rem;

      &:hover {
        color: #475569;
      }
    }

    .options-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0.75rem;
      background: #f1f5f9;
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }

    .filter-tag {
      color: #4f46e5;
    }

    .options-list {
      max-height: 250px;
      overflow-y: auto;
      padding: 0.35rem 0;
    }

    .option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.75rem;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #f8fafc;
      }

      &.is-selected {
        background: #eef2ff;
        
        .option-title {
          color: #4338ca;
          font-weight: 700;
        }
      }
    }

    .option-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      overflow: hidden;
      flex: 1;
    }

    .option-texts {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      line-height: 1.25;
    }

    .option-title {
      font-size: 0.875rem;
      color: #0f172a;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: 0.5rem;
      flex-shrink: 0;
    }

    .check-icon {
      color: #4f46e5;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .empty-results-state {
      padding: 1.75rem 1rem;
      text-align: center;
      color: #64748b;

      .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.35rem;
        display: block;
      }

      .empty-title {
        font-weight: 700;
        font-size: 0.9rem;
        color: #334155;
        margin: 0 0 0.2rem 0;
      }

      .empty-subtitle {
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 0;
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 9999px;
    }

    .badge-primary {
      background: #eef2ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    }

    .badge-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
  `],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

  readonly _options = signal<SearchableOption[]>([]);
  @Input() set options(val: SearchableOption[]) {
    this._options.set(val || []);
  }
  get options(): SearchableOption[] {
    return this._options();
  }

  @Input() placeholder: string = 'Buscar y seleccionar...';
  @Input() searchPlaceholder: string = 'Escriba para filtrar en tiempo real...';
  @Input() clearable: boolean = true;
  @Input() disabled: boolean = false;

  @Output() selectionChange = new EventEmitter<any>();

  readonly cleanPlaceholder = computed(() => {
    return (this.placeholder || 'Buscar y seleccionar...').replace(/^[🔍🔎]\s*/, '').trim();
  });

  readonly cleanSearchPlaceholder = computed(() => {
    return (this.searchPlaceholder || 'Escriba para filtrar en tiempo real...').replace(/^[🔍🔎]\s*/, '').trim();
  });

  readonly isOpen = signal(false);
  readonly searchQuery = signal<string>('');
  readonly selectedValue = signal<any>(null);

  // ControlValueAccessor functions
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  readonly selectedOption = computed(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return null;
    return this._options().find((o) => o.value === val) || null;
  });

  private normalizeText(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita tildes: á->a, é->e, etc.
      .replace(/[.,\-_/]/g, ' ')       // Convierte puntuaciones en espacios para documentos
      .trim();
  }

  readonly filteredOptions = computed(() => {
    const rawQuery = this.searchQuery() || '';
    const normalizedQuery = this.normalizeText(rawQuery);
    const opts = this._options();
    if (!normalizedQuery) return opts;

    const tokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return opts;

    return opts.filter((opt) => {
      const labelNorm = this.normalizeText(opt.label);
      const sublabelNorm = this.normalizeText(opt.sublabel);
      const badgeNorm = this.normalizeText(opt.badge);
      const combined = `${labelNorm} ${sublabelNorm} ${badgeNorm}`;

      return tokens.every((token) => combined.includes(token));
    });
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value || '');
  }

  clearSearch(event?: Event): void {
    if (event) event.stopPropagation();
    this.searchQuery.set('');
    const input = this.elementRef.nativeElement.querySelector('.search-input');
    input?.focus();
  }

  toggleDropdown() {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen.set(true);
    this.searchQuery.set('');
    setTimeout(() => {
      const input = this.elementRef.nativeElement.querySelector('.search-input');
      input?.focus();
    }, 50);
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.onTouched();
  }

  selectOption(opt: SearchableOption) {
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.selectionChange.emit(opt.value);
    this.closeDropdown();
  }

  clearSelection(event: MouseEvent) {
    event.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  isSelected(opt: SearchableOption): boolean {
    return this.selectedValue() === opt.value;
  }

  focusFirstOption(event: Event) {
    event.preventDefault();
    const firstItem = this.elementRef.nativeElement.querySelector('.option-item');
    firstItem?.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
