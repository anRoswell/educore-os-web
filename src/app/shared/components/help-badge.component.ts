import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlossaryService } from '../../core/services/glossary.service';

@Component({
  selector: 'app-help-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="help-badge-btn"
      (click)="abrirAyuda($event)"
      [title]="label || 'Haga clic para ver la explicación de este término oficial'"
      aria-label="Ayuda del término"
    >
      <span class="help-icon">?</span>
      @if (label) {
        <span class="help-label">{{ label }}</span>
      }
    </button>
  `,
  styles: [`
    .help-badge-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      background-color: #e0e7ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
      border-radius: 9999px;
      padding: 0.1rem 0.45rem;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
      margin-left: 0.35rem;
      vertical-align: middle;
      transition: all 150ms ease;
      box-shadow: 0 1px 2px rgba(99, 102, 241, 0.15);
    }

    .help-badge-btn:hover {
      background-color: #4f46e5;
      color: #ffffff;
      border-color: #4338ca;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
    }

    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.85);
      color: #4338ca;
      font-size: 0.65rem;
      font-weight: 900;
    }

    .help-badge-btn:hover .help-icon {
      background-color: #ffffff;
      color: #4f46e5;
    }

    .help-label {
      font-size: 0.7rem;
      font-weight: 600;
    }
  `]
})
export class HelpBadgeComponent {
  @Input({ required: true }) term!: string;
  @Input() label?: string;

  private readonly glossary = inject(GlossaryService);

  abrirAyuda(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.glossary.mostrar(this.term);
  }
}
