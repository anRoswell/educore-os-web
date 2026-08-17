import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast-card animate-slide-up" [class]="'toast-' + t.type">
          <div class="toast-icon-box">
            @if (t.type === 'success') {
              <span>✅</span>
            } @else if (t.type === 'info') {
              <span>ℹ️</span>
            } @else if (t.type === 'warning') {
              <span>⚠️</span>
            } @else {
              <span>❌</span>
            }
          </div>
          <div class="toast-body">
            <strong>{{ t.title }}</strong>
            <p>{{ t.message }}</p>
          </div>
          <button (click)="toastService.remove(t.id)" class="toast-close-btn">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 9999;
      max-width: 420px;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      background-color: #ffffff;
      border-left: 5px solid;
    }

    .toast-success {
      background: linear-gradient(135deg, #ffffff, #f0fdf4);
      border-left-color: #10b981;
      border-top: 1px solid #dcfce7;
      border-right: 1px solid #dcfce7;
      border-bottom: 1px solid #dcfce7;
    }

    .toast-info {
      background: linear-gradient(135deg, #ffffff, #eff6ff);
      border-left-color: #3b82f6;
      border-top: 1px solid #dbeafe;
      border-right: 1px solid #dbeafe;
      border-bottom: 1px solid #dbeafe;
    }

    .toast-warning {
      background: linear-gradient(135deg, #ffffff, #fffbeb);
      border-left-color: #f59e0b;
      border-top: 1px solid #fef3c7;
      border-right: 1px solid #fef3c7;
      border-bottom: 1px solid #fef3c7;
    }

    .toast-danger {
      background: linear-gradient(135deg, #ffffff, #fef2f2);
      border-left-color: #ef4444;
      border-top: 1px solid #fee2e2;
      border-right: 1px solid #fee2e2;
      border-bottom: 1px solid #fee2e2;
    }

    .toast-icon-box {
      font-size: 1.25rem;
      margin-top: 0.1rem;
    }

    .toast-body {
      flex: 1;
    }

    .toast-body strong {
      font-size: 0.9rem;
      color: #0f172a;
      display: block;
      margin-bottom: 0.2rem;
    }

    .toast-body p {
      font-size: 0.8rem;
      color: #475569;
      margin: 0;
      line-height: 1.35;
    }

    .toast-close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }

    .toast-close-btn:hover {
      color: #334155;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-up {
      animation: slideUp 200ms ease-out forwards;
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
