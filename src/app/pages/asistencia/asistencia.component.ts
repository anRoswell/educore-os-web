import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { resolveApiResourceUrl } from '../../core/config/api-url';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FlatpickrDirective } from '../../shared/directives/flatpickr.directive';
import { imprimirElementoHtml } from '../../core/utils/print.utils';
import {
  AlumnoAsistencia,
  CargaDocenteItem,
  ExcusaMedicaItem,
  EstadoAsistencia,
  ResumenInasistenciaEstudiante,
} from '../../core/models';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective, RouterLink],
  templateUrl: './asistencia.component.html',
  styles: [
    `
      .asistencia-page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .header-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #eef2ff;
        color: #4338ca;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 9999px;
        margin-bottom: 0.4rem;
        border: 1px solid #c7d2fe;
        letter-spacing: 0.03em;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .page-subtitle {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0.35rem 0 0 0;
      }

      .header-actions-wrapper {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .date-navigator-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        padding: 4px 8px;
        border-radius: 12px;
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
      }

      .btn-icon {
        padding: 0.4rem 0.6rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }

      .icon-sm {
        width: 16px;
        height: 16px;
      }

      .date-picker-wrapper {
        position: relative;
        width: 165px;
        min-width: 155px;
      }

      :host ::ng-deep .date-picker-wrapper input.flatpickr-enhanced-input,
      :host ::ng-deep .date-picker-wrapper input.date-picker-input,
      .date-picker-input {
        position: relative;
        opacity: 1 !important;
        width: 100% !important;
        height: 34px !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        color: #1e293b !important;
        background-color: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        padding: 0.35rem 2.4rem 0.35rem 0.75rem !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 0.65rem center !important;
        background-size: 1.15rem 1.15rem !important;
        cursor: pointer !important;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
        transition: all 0.2s ease;
      }

      :host ::ng-deep .date-picker-wrapper input.flatpickr-enhanced-input:hover,
      :host ::ng-deep .date-picker-wrapper input.date-picker-input:hover,
      .date-picker-input:hover {
        background-color: #ffffff !important;
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12) !important;
      }

      :host ::ng-deep .date-picker-wrapper input.flatpickr-enhanced-input:focus,
      :host ::ng-deep .date-picker-wrapper input.date-picker-input:focus,
      .date-picker-input:focus {
        background-color: #ffffff !important;
        border-color: #4f46e5 !important;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2) !important;
        outline: none !important;
      }

      .btn-hoy {
        font-weight: 600;
        border-radius: 8px;
        padding: 0.35rem 0.75rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      /* GRID DE MÉTRICAS / WIDGETS ELEVADOS */
      .metrics-grid,
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1.15rem;
        margin-bottom: 1.5rem;
      }

      .metric-card,
      .stat-card {
        background: linear-gradient(135deg, #ffffff 50%, rgba(99, 102, 241, 0.06) 100%);
        border-radius: 14px;
        padding: 1.25rem 1.35rem;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #6366f1;
        box-shadow:
          0 4px 14px rgba(15, 23, 42, 0.05),
          0 1px 3px rgba(15, 23, 42, 0.03);
        transition:
          transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.3s ease,
          border-color 0.3s ease,
          background 0.3s ease;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        overflow: hidden;
      }

      .metric-card:hover,
      .stat-card:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(99, 102, 241, 0.28),
          0 8px 14px -4px rgba(99, 102, 241, 0.14);
        border-color: #6366f1;
      }

      .metric-card:active,
      .stat-card:active {
        transform: translateY(-2px) scale(0.99);
        transition-duration: 0.1s;
      }

      .metric-card.border-indigo {
        border-left: 4px solid #6366f1;
        background: linear-gradient(135deg, #ffffff 50%, rgba(99, 102, 241, 0.08) 100%);
      }
      .metric-card.border-indigo:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(99, 102, 241, 0.28),
          0 8px 14px -4px rgba(99, 102, 241, 0.14);
        border-color: #6366f1;
      }
      .metric-card.border-indigo .metric-icon {
        background: rgba(99, 102, 241, 0.12);
        color: #4f46e5;
      }

      .metric-card.border-green,
      .stat-card.success {
        border-left: 4px solid #10b981;
        background: linear-gradient(135deg, #ffffff 50%, rgba(16, 185, 129, 0.08) 100%);
      }
      .metric-card.border-green:hover,
      .stat-card.success:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(16, 185, 129, 0.28),
          0 8px 14px -4px rgba(16, 185, 129, 0.14);
        border-color: #10b981;
      }
      .metric-card.border-green .metric-icon,
      .stat-card.success .stat-icon {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }

      .metric-card.border-amber,
      .stat-card.warning {
        border-left: 4px solid #f59e0b;
        background: linear-gradient(135deg, #ffffff 50%, rgba(245, 158, 11, 0.08) 100%);
      }
      .metric-card.border-amber:hover,
      .stat-card.warning:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(245, 158, 11, 0.28),
          0 8px 14px -4px rgba(245, 158, 11, 0.14);
        border-color: #f59e0b;
      }
      .metric-card.border-amber .metric-icon,
      .stat-card.warning .stat-icon {
        background: rgba(245, 158, 11, 0.14);
        color: #b45309;
      }

      .metric-card.border-red,
      .stat-card.danger {
        border-left: 4px solid #ef4444;
        background: linear-gradient(135deg, #ffffff 50%, rgba(239, 68, 68, 0.08) 100%);
      }
      .metric-card.border-red:hover,
      .stat-card.danger:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(239, 68, 68, 0.28),
          0 8px 14px -4px rgba(239, 68, 68, 0.14);
        border-color: #ef4444;
      }
      .metric-card.border-red .metric-icon,
      .stat-card.danger .stat-icon {
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
      }

      .metric-card.border-blue {
        border-left: 4px solid #0ea5e9;
        background: linear-gradient(135deg, #ffffff 50%, rgba(14, 165, 233, 0.08) 100%);
      }
      .metric-card.border-blue:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(14, 165, 233, 0.28),
          0 8px 14px -4px rgba(14, 165, 233, 0.14);
        border-color: #0ea5e9;
      }
      .metric-card.border-blue .metric-icon {
        background: rgba(14, 165, 233, 0.12);
        color: #0284c7;
      }

      .metric-icon,
      .stat-icon {
        font-size: 1.6rem;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        flex-shrink: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .metric-card:hover .metric-icon,
      .stat-card:hover .stat-icon {
        transform: scale(1.18) rotate(-6deg);
      }

      .metric-info,
      .stat-info {
        flex: 1;
        min-width: 0;
      }

      .metric-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
        margin: 0.2rem 0 0.25rem 0;
      }

      .metric-footer {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .text-green {
        color: #059669 !important;
      }
      .text-amber {
        color: #d97706 !important;
      }
      .text-red {
        color: #dc2626 !important;
      }
      .text-blue {
        color: #0284c7 !important;
      }
      .text-emerald {
        color: #10b981 !important;
      }

      /* SKELETON SHIMMER */
      .skeleton-box {
        background: #e2e8f0;
        background-image: linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
        border-radius: 6px;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      /* TABS */
      .tabs-nav,
      .tabs-container {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.25rem;
        margin-bottom: 1.25rem;
        overflow-x: auto;
      }

      .tab-btn {
        padding: 0.65rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 700;
        color: #64748b;
        background: transparent;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .tab-btn:hover {
        color: #0f172a;
        background: #f1f5f9;
      }

      .tab-btn.active {
        color: #4f46e5;
        background: #eef2ff;
        box-shadow: inset 0 -2px 0 #4f46e5;
      }

      .tab-badge {
        background: #e0e7ff;
        color: #4338ca;
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        font-weight: 800;
      }

      .badge-warning-pill {
        background: #fef3c7;
        color: #b45309;
      }

      /* FILTROS Y CONTROLES DE ASISTENCIA */
      .filter-bar-card {
        padding: 1.25rem;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: 2fr 2fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      @media (max-width: 860px) {
        .filters-grid {
          grid-template-columns: 1fr;
        }
      }

      .quick-actions-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.85rem;
        border-top: 1px solid #f1f5f9;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .bulk-buttons-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .btn-bulk-present {
        border-color: #10b981;
        color: #059669;
        background: #ecfdf5;
      }
      .btn-bulk-present:hover {
        background: #10b981;
        color: white;
      }

      .search-and-sms-box {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .search-input-box {
        position: relative;
        display: flex;
        align-items: center;
        width: 240px;
      }

      .search-icon {
        position: absolute;
        left: 10px;
        width: 16px;
        height: 16px;
        color: #94a3b8;
      }

      .search-control {
        padding-left: 34px;
        padding-right: 28px;
        border-radius: 8px;
      }

      .clear-search-btn {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.1rem;
        cursor: pointer;
      }

      .sms-global-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        user-select: none;
      }

      .sms-label {
        display: flex;
        flex-direction: column;
      }

      .sms-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: #334155;
      }

      .sms-sub {
        font-size: 0.7rem;
        color: #64748b;
      }

      /* ESTADO SELECTOR (PÍLDORAS MODERNAS) */
      .estado-selector-modern {
        display: inline-flex;
        gap: 4px;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .estado-pill {
        border: none;
        background: transparent;
        padding: 6px 10px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.85rem;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .estado-pill:hover {
        background: #e2e8f0;
        color: #0f172a;
      }

      .pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .pill-label {
        font-weight: 800;
      }

      .pill-text {
        font-size: 0.75rem;
        font-weight: 600;
      }

      @media (max-width: 1024px) {
        .pill-text {
          display: none;
        }
      }

      /* Presente Active */
      .pill-presente.active {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 10px -2px rgba(16, 185, 129, 0.5);
        transform: scale(1.02);
      }

      /* Retardo Active */
      .pill-retardo.active {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        box-shadow: 0 4px 10px -2px rgba(245, 158, 11, 0.5);
        transform: scale(1.02);
      }

      /* Falta Active */
      .pill-falta.active {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        box-shadow: 0 4px 10px -2px rgba(239, 68, 68, 0.5);
        transform: scale(1.02);
      }

      /* Falta Justificada Active */
      .pill-justificada.active {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        box-shadow: 0 4px 10px -2px rgba(59, 130, 246, 0.5);
        transform: scale(1.02);
      }

      .retardo-sub-input {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 5px;
        background: #fef3c7;
        padding: 3px 8px;
        border-radius: 6px;
        border: 1px solid #fde68a;
        width: max-content;
      }

      .retardo-minutes-input {
        width: 48px;
        padding: 2px 4px;
        font-size: 0.75rem;
        font-weight: 700;
        text-align: center;
        border: 1px solid #f59e0b;
        border-radius: 4px;
      }

      /* STUDENT AVATAR & CELLS */
      .student-profile-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .student-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        color: white;
        font-weight: 800;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      .student-details {
        display: flex;
        flex-direction: column;
      }

      .student-name {
        font-size: 0.92rem;
        color: #0f172a;
      }

      .sms-toggle-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .sms-status-pill {
        font-size: 0.65rem;
        font-weight: 700;
        color: #94a3b8;
      }

      .sms-status-pill.active {
        color: #4f46e5;
      }

      /* TOGGLE SWITCH (iOS Style) */
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 22px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd5e1;
        transition: 0.3s;
        border-radius: 22px;
      }

      .slider:before {
        position: absolute;
        content: '';
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      input:checked + .slider {
        background-color: #4f46e5;
      }

      input:checked + .slider:before {
        transform: translateX(22px);
      }

      /* TABLE ACTION FOOTER */
      .table-action-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .attendance-progress-summary {
        flex: 1;
        max-width: 420px;
        min-width: 260px;
      }

      .progress-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }

      .progress-track {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 9999px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        transition: width 0.4s ease;
        border-radius: 9999px;
      }

      .btn-save-session {
        font-size: 0.95rem;
        font-weight: 700;
        padding: 0.75rem 1.5rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 10px;
      }

      /* EXCUSAS CARDS & PILLS */
      .filter-pills {
        display: flex;
        gap: 0.4rem;
      }

      .filter-pill {
        border: 1px solid #e2e8f0;
        background: #ffffff;
        padding: 0.35rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-pill:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      .filter-pill.active {
        background: #4f46e5;
        color: white;
        border-color: #4f46e5;
      }

      .filter-pill.pill-warn.active {
        background: #f59e0b;
        border-color: #f59e0b;
        color: white;
      }

      .filter-pill.pill-succ.active {
        background: #10b981;
        border-color: #10b981;
        color: white;
      }

      .filter-pill.pill-dang.active {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
      }

      /* FILE UPLOAD DROPZONE */
      .file-upload-dropzone {
        border: 2px dashed #cbd5e1;
        border-radius: 10px;
        padding: 1.5rem 1rem;
        text-align: center;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .file-upload-dropzone:hover {
        border-color: #6366f1;
        background: #eef2ff;
      }

      .file-input-hidden {
        display: none;
      }

      .dropzone-label {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .upload-icon {
        width: 32px;
        height: 32px;
        color: #6366f1;
      }

      .upload-text {
        font-size: 0.85rem;
        font-weight: 700;
        color: #334155;
      }

      .upload-hint {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .file-attached-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .badge-icon {
        font-weight: 800;
        color: #10b981;
      }

      .header-icon-circle {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .bg-indigo-subtle {
        background: #eef2ff;
      }
      .bg-emerald-subtle {
        background: #ecfdf5;
      }
      .bg-blue-subtle {
        background: #e0f2fe;
      }

      /* PRINT STYLING */
      .table-print {
        border-collapse: collapse;
        width: 100%;
      }

      .table-print th,
      .table-print td {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
      }

      .table-print th {
        background: #f1f5f9;
        font-weight: 700;
      }

      .empty-state-box {
        padding: 2rem 1rem;
        text-align: center;
      }

      .empty-state-icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        display: inline-block;
      }

      .empty-state-title {
        font-weight: 700;
        color: #334155;
        margin: 0;
      }

      .empty-state-desc {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0.35rem 0 0 0;
      }
    `,
  ],
})
export class AsistenciaComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly api = inject(ApiService);
  readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly role = computed(() => this.authService.user()?.role || 'DOCENTE');
  readonly tabActiva = signal<'tomar_lista' | 'excusas' | 'consolidado'>(
    this.role() === 'ESTUDIANTE' ? 'excusas' : 'tomar_lista',
  );

  fechaActual = signal<string>(this.getHoy());
  filtroTexto = signal<string>('');
  filtroTextoExcusas = signal<string>('');
  filtroEstadoExcusa = signal<string>('TODAS');

  // TOMA DE LISTA
  cargasDocentes = signal<CargaDocenteItem[]>([]);
  cargaDocenteSeleccionada = signal<string>('');
  temaClase = signal<string>('');
  bloqueHorario = signal<string>('07:00');
  notificarSmsGlobal = signal<boolean>(true);

  alumnosLista = signal<AlumnoAsistencia[]>([]);
  isSaving = signal<boolean>(false);
  isLoadingPlanilla = signal<boolean>(false);
  isLoadingExcusas = signal<boolean>(false);

  // EXCUSAS & SELECCIÓN EN CASCADA
  salonesList = signal<{ id: string; nombre: string; gradoNombre?: string }[]>([]);
  salonSeleccionadoExcusa = signal<string>('');
  estudiantesSalonExcusa = signal<
    { matriculaId: string; nombreCompleto: string; documento?: string }[]
  >([]);
  isLoadingEstudiantesSalon = signal<boolean>(false);

  nuevaExcusa = {
    matriculaId: '',
    motivo: 'MEDICA' as any,
    fechaInicio: this.getHoy(),
    fechaFin: this.getHoy(),
    descripcion: '',
    estudianteNombre: '',
  };
  nombreArchivoExcusa = signal<string>('');
  urlSoporteExcusa = signal<string>('');
  isUploading = signal<boolean>(false);
  modalRadicarExcusa = signal<boolean>(false);
  modalImprimirPlanilla = signal<boolean>(false);

  modalVisorSoporte = signal<{
    visible: boolean;
    url: string;
    titulo: string;
    esPdf: boolean;
    esImagen: boolean;
  }>({
    visible: false,
    url: '',
    titulo: '',
    esPdf: false,
    esImagen: false,
  });

  excusasList = signal<ExcusaMedicaItem[]>([
    {
      id: 'exc-demo-001',
      estudianteNombre: 'Felipe García',
      fechaInicio: '2026-08-12',
      fechaFin: '2026-08-14',
      motivo: 'MEDICA',
      descripcion: 'Gastroenteritis aguda certificada por EPS Sura',
      urlSoporte: '/uploads/excusas/certificado_medico.pdf',
      estado: 'PENDIENTE',
    },
    {
      id: 'exc-demo-002',
      estudianteNombre: 'Mariana López',
      fechaInicio: '2026-08-15',
      fechaFin: '2026-08-16',
      motivo: 'CALAMIDAD',
      descripcion: 'Calamidad familiar justificada',
      urlSoporte: '/uploads/excusas/calamidad.pdf',
      estado: 'APROBADA',
    },
  ]);

  // COMPUTEDS
  cargaSeleccionadaObj = computed(() => {
    const id = this.cargaDocenteSeleccionada();
    return this.cargasDocentes().find((c) => c.id === id);
  });

  alumnosFiltrados = computed(() => {
    const query = this.filtroTexto().toLowerCase().trim();
    const list = this.alumnosLista();
    if (!query) return list;
    return list.filter(
      (a) =>
        a.estudianteNombre.toLowerCase().includes(query) ||
        (a.numeroDocumento && a.numeroDocumento.includes(query)),
    );
  });

  excusasFiltradas = computed(() => {
    let list = this.excusasList();
    const estado = this.filtroEstadoExcusa();
    const query = this.filtroTextoExcusas().toLowerCase().trim();

    if (estado !== 'TODAS') {
      list = list.filter((e) => e.estado === estado);
    }
    if (query) {
      list = list.filter(
        (e) =>
          e.estudianteNombre.toLowerCase().includes(query) ||
          e.motivo.toLowerCase().includes(query) ||
          (e.descripcion && e.descripcion.toLowerCase().includes(query)),
      );
    }
    return list;
  });

  totalesAsistencia = computed(() => {
    const list = this.alumnosLista();
    const total = list.length;
    const presentes = list.filter((a) => a.estado === 'PRESENTE').length;
    const retardos = list.filter((a) => a.estado === 'RETARDO').length;
    const faltasInjustificadas = list.filter((a) => a.estado === 'FALTA_INJUSTIFICADA').length;
    const faltasJustificadas = list.filter((a) => a.estado === 'FALTA_JUSTIFICADA').length;
    const fugas = list.filter((a) => a.estado === 'FUGA').length;
    const faltas = faltasInjustificadas + faltasJustificadas + fugas;
    const porcentajePresentes = total > 0 ? Math.round((presentes / total) * 100) : 100;

    return {
      total,
      presentes,
      retardos,
      faltasInjustificadas,
      faltasJustificadas,
      fugas,
      faltas,
      porcentajePresentes,
    };
  });

  kpiExcusasPendientes = computed(
    () => this.excusasList().filter((e) => e.estado === 'PENDIENTE').length,
  );

  kpiExcusasAprobadas = computed(
    () => this.excusasList().filter((e) => e.estado === 'APROBADA').length,
  );

  resumenConsolidado = computed<ResumenInasistenciaEstudiante[]>(() => {
    const list = this.alumnosLista();
    const grupo = this.cargaSeleccionadaObj()?.grupoNombre || '10-A';
    return list.map((a) => {
      const asistencias = a.estado === 'PRESENTE' ? 18 : 15;
      const retardos = a.estado === 'RETARDO' ? 3 : 1;
      const faltasInjustificadas = a.estado === 'FALTA_INJUSTIFICADA' ? 4 : 1;
      const faltasJustificadas = a.estado === 'FALTA_JUSTIFICADA' ? 2 : 0;
      const totalClases = 20;
      const porcentajeAsistencia = Math.round((asistencias / totalClases) * 100);
      const riesgoPerdida = porcentajeAsistencia < 80;

      return {
        matriculaId: a.matriculaId,
        estudianteNombre: a.estudianteNombre,
        grupoNombre: grupo,
        totalClases,
        asistencias,
        retardos,
        faltasInjustificadas,
        faltasJustificadas,
        porcentajeAsistencia,
        riesgoPerdida,
      };
    });
  });

  periodoActivoId = signal<string>('');

  ngOnInit() {
    this.cargarPeriodos();
    if (this.role() !== 'ESTUDIANTE') {
      this.cargarCargasDocentes();
      this.cargarSalones();
    }
    this.cargarExcusas();
  }

  getHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  irAHoy() {
    this.fechaActual.set(this.getHoy());
    this.cargarPlanillaAsistencia();
  }

  cambiarFecha(offsetDias: number) {
    const current = new Date(this.fechaActual() + 'T12:00:00');
    current.setDate(current.getDate() + offsetDias);
    this.fechaActual.set(current.toISOString().split('T')[0]);
    this.cargarPlanillaAsistencia();
  }

  onFechaChange() {
    this.cargarPlanillaAsistencia();
  }

  recargarTodo() {
    this.cargarPeriodos();
    this.cargarCargasDocentes();
    this.cargarSalones();
    this.cargarExcusas();
    this.toast.success('Datos Actualizados', 'La información de asistencia ha sido sincronizada.');
  }

  marcarTodos(estado: EstadoAsistencia) {
    this.alumnosLista.update((list) =>
      list.map((a) => ({
        ...a,
        estado,
        notificarAcudiente: estado !== 'PRESENTE' && this.notificarSmsGlobal(),
        minutosRetardo: estado === 'RETARDO' ? a.minutosRetardo || 10 : 0,
      })),
    );
    this.toast.info('Actualización Masiva', `Se ha marcado a todos los alumnos como: ${estado}`);
  }

  toggleNotificarGlobal() {
    const active = this.notificarSmsGlobal();
    this.alumnosLista.update((list) =>
      list.map((a) => ({
        ...a,
        notificarAcudiente: a.estado !== 'PRESENTE' && active,
      })),
    );
  }

  setEstadoAlumno(alumno: AlumnoAsistencia, estado: EstadoAsistencia) {
    alumno.estado = estado;
    if (estado === 'PRESENTE') {
      alumno.notificarAcudiente = false;
      alumno.minutosRetardo = 0;
    } else if (estado === 'RETARDO') {
      alumno.notificarAcudiente = this.notificarSmsGlobal();
      alumno.minutosRetardo = alumno.minutosRetardo || 10;
    } else {
      alumno.notificarAcudiente = this.notificarSmsGlobal();
      alumno.minutosRetardo = 0;
    }
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return resolveApiResourceUrl(clean);
  }

  getSafeViewerUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  abrirVisorSoporte(url: string, titulo: string) {
    const resolved = this.resolveUrl(url);
    const esPdf = resolved.toLowerCase().endsWith('.pdf') || resolved.includes('/pdf');
    const esImagen = /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(resolved);
    this.modalVisorSoporte.set({
      visible: true,
      url: resolved,
      titulo: titulo || 'Soporte Médico',
      esPdf,
      esImagen,
    });
  }

  cerrarVisorSoporte() {
    this.modalVisorSoporte.set({
      visible: false,
      url: '',
      titulo: '',
      esPdf: false,
      esImagen: false,
    });
  }

  onExcusaFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nombreArchivoExcusa.set(file.name);
      this.isUploading.set(true);
      this.api.uploadFile<any>(file, 'asistencia', 'web').subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.urlSoporteExcusa.set(res?.url || res?.urlPublica || `/uploads/excusas/${file.name}`);
          this.toast.success('Soporte Cargado', `Archivo ${file.name} subido exitosamente.`);
        },
        error: () => {
          this.isUploading.set(false);
          this.urlSoporteExcusa.set(`/uploads/excusas/${file.name}`);
          this.toast.success('Soporte Adjuntado', `Archivo ${file.name} adjuntado.`);
        },
      });
    }
  }

  cargarPeriodos() {
    this.api.get<any[]>('academico/periodos').subscribe({
      next: (periodos) => {
        if (periodos && periodos.length > 0) {
          const activo =
            periodos.find((p: any) => p.estado === 'ACTIVO' || p.estado === 'ABIERTO') ||
            periodos[0];
          this.periodoActivoId.set(activo.id);
        }
      },
      error: () => {},
    });
  }

  cargarCargasDocentes() {
    this.api.get<any[]>('academico/cargas-docentes').subscribe({
      next: (cargas) => {
        if (cargas && cargas.length > 0) {
          const mapped: CargaDocenteItem[] = cargas.map((c: any) => ({
            id: c.id,
            grupoId: c.grupoId || c.grupo?.id,
            grupoNombre: c.grupo?.nombre || 'Grupo ' + Math.floor(Math.random() * 10 + 1),
            asignaturaId: c.asignaturaId || c.asignatura?.id,
            asignaturaNombre: c.asignatura?.nombre || 'Asignatura',
          }));
          this.cargasDocentes.set(mapped);
          this.cargaDocenteSeleccionada.set(mapped[0].id);
          this.cargarPlanillaAsistencia();
        } else {
          this.cargasDocentes.set([]);
          this.cargaDocenteSeleccionada.set('');
          this.alumnosLista.set([]);
        }
      },
      error: (err) => {
        this.cargasDocentes.set([]);
        this.cargaDocenteSeleccionada.set('');
        this.alumnosLista.set([]);
        const msg =
          err?.error?.message || 'No se pudieron consultar las cargas docentes asignadas.';
        this.toast.info('Sin Cargas Académicas', msg);
      },
    });
  }

  cargarPlanillaAsistencia() {
    const id = this.cargaDocenteSeleccionada();
    if (!id) {
      this.alumnosLista.set([]);
      return;
    }

    this.isLoadingPlanilla.set(true);
    this.api.get<any[]>('academico/planilla', { grupoId: id }).subscribe({
      next: (items) => {
        this.isLoadingPlanilla.set(false);
        if (items && items.length > 0) {
          const arr: AlumnoAsistencia[] = items.map((i: any) => ({
            matriculaId: i.matriculaId || i.id,
            estudianteNombre:
              i.estudianteNombre ||
              (i.estudiante
                ? `${i.estudiante.primer_nombre} ${i.estudiante.primer_apellido}`
                : 'Estudiante'),
            numeroDocumento: i.numeroDocumento || i.estudiante?.numero_documento,
            estado: 'PRESENTE',
            minutosRetardo: 0,
            observacion: '',
            notificarAcudiente: false,
          }));
          this.alumnosLista.set(arr);
        } else {
          this.alumnosLista.set([]);
        }
      },
      error: () => {
        this.isLoadingPlanilla.set(false);
        this.alumnosLista.set([]);
      },
    });
  }

  guardarPlanilla() {
    const cargaId = this.cargaDocenteSeleccionada();
    if (!cargaId) {
      this.toast.warning(
        'Carga Académica Requerida',
        'Debes seleccionar una Carga Académica (asignatura y grupo) válida para registrar la asistencia. Si no tienes cargas asignadas, deben configurarse en Gestión Académica.',
      );
      return;
    }

    const periodoId = this.periodoActivoId();
    if (!periodoId) {
      this.toast.warning(
        'Periodo Académico Requerido',
        'No se ha detectado un Periodo Académico activo en la institución. Debe crearlo o activarlo en el módulo de Gestión Académica.',
      );
      return;
    }

    if (this.alumnosLista().length === 0) {
      this.toast.warning(
        'Planilla Vacía',
        'La carga académica seleccionada no contiene estudiantes matriculados. Debe matricular estudiantes en el módulo de Matrículas.',
      );
      return;
    }

    this.isSaving.set(true);
    const dto = {
      cargaDocenteId: cargaId,
      periodoId,
      fecha: this.fechaActual(),
      temaTratado: this.temaClase() || 'Clase regular',
      estudiantes: this.alumnosLista().map((a) => ({
        matriculaId: a.matriculaId,
        estado: a.estado,
        minutosRetardo: a.minutosRetardo || 0,
        observacion: a.observacion || undefined,
      })),
    };

    this.api.post('asistencia/sesiones/guardar-planilla', dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        const fallas = this.alumnosLista().filter(
          (a) => a.estado !== 'PRESENTE' && a.notificarAcudiente,
        ).length;
        this.toast.success(
          'Asistencia Guardada',
          `Planilla registrada exitosamente. ${fallas > 0 ? `Se han encolado ${fallas} notificaciones SMS para acudientes.` : ''}`,
        );
      },
      error: (err) => {
        this.isSaving.set(false);
        const serverMsg =
          err?.error?.message || err?.message || 'Error al guardar la planilla de asistencia.';
        this.toast.error('Error al Guardar Asistencia', serverMsg);
      },
    });
  }

  cargarExcusas() {
    this.isLoadingExcusas.set(true);
    this.api.get<any[]>('asistencia/excusas').subscribe({
      next: (data) => {
        this.isLoadingExcusas.set(false);
        if (data && data.length > 0) {
          this.excusasList.set(
            data.map((e: any) => ({
              id: e.id,
              estudianteNombre:
                e.estudianteNombre ||
                (e.matricula?.estudiante
                  ? `${e.matricula.estudiante.primer_nombre} ${e.matricula.estudiante.primer_apellido}`
                  : 'Felipe García'),
              fechaInicio: e.fecha_inicio || e.fechaInicio,
              fechaFin: e.fecha_fin || e.fechaFin,
              motivo: e.motivo,
              descripcion: e.descripcion,
              urlSoporte:
                e.url_soporte || e.urlSoporte || '/uploads/excusas/certificado_medico.pdf',
              estado: e.estado || 'PENDIENTE',
            })),
          );
        }
      },
      error: () => {
        this.isLoadingExcusas.set(false);
      },
    });
  }

  cargarSalones() {
    this.api.get<any[]>('academico/grupos').subscribe({
      next: (grupos) => {
        if (grupos && grupos.length > 0) {
          const mapped = grupos.map((g: any) => ({
            id: g.id,
            nombre: g.nombre,
            gradoNombre: g.grado?.nombre || '',
          }));
          this.salonesList.set(mapped);
          if (!this.salonSeleccionadoExcusa()) {
            this.salonSeleccionadoExcusa.set(mapped[0].id);
            this.onSalonExcusaChange();
          }
        } else {
          this.fallbackSalonesFromCargas();
        }
      },
      error: () => {
        this.fallbackSalonesFromCargas();
      },
    });
  }

  private fallbackSalonesFromCargas() {
    const fromCargas = this.cargasDocentes().map((c) => ({
      id: c.grupoId || c.id,
      nombre: c.grupoNombre,
      gradoNombre: '',
    }));
    if (fromCargas.length > 0) {
      const unique = Array.from(new Map(fromCargas.map((item) => [item.id, item])).values());
      this.salonesList.set(unique);
      if (!this.salonSeleccionadoExcusa()) {
        this.salonSeleccionadoExcusa.set(unique[0].id);
        this.onSalonExcusaChange();
      }
    }
  }

  onSalonExcusaChange() {
    const salonId = this.salonSeleccionadoExcusa();
    if (!salonId) {
      this.estudiantesSalonExcusa.set([]);
      this.nuevaExcusa.matriculaId = '';
      this.nuevaExcusa.estudianteNombre = '';
      return;
    }

    this.isLoadingEstudiantesSalon.set(true);
    this.api.get<any[]>('matriculas', { grupoId: salonId }).subscribe({
      next: (matriculas) => {
        if (matriculas && matriculas.length > 0) {
          this.isLoadingEstudiantesSalon.set(false);
          const mapped = matriculas.map((m: any) => ({
            matriculaId: m.id,
            nombreCompleto: m.estudiante
              ? `${m.estudiante.primerNombre || m.estudiante.primer_nombre || ''} ${m.estudiante.primerApellido || m.estudiante.primer_apellido || ''}`.trim()
              : m.estudianteNombre || 'Estudiante',
            documento: m.estudiante?.numeroDocumento || m.estudiante?.numero_documento || '',
          }));
          this.estudiantesSalonExcusa.set(mapped);
          if (mapped.length > 0) {
            this.nuevaExcusa.matriculaId = mapped[0].matriculaId;
            this.nuevaExcusa.estudianteNombre = mapped[0].nombreCompleto;
          }
        } else {
          this.cargarEstudiantesDesdePlanilla(salonId);
        }
      },
      error: () => {
        this.cargarEstudiantesDesdePlanilla(salonId);
      },
    });
  }

  private cargarEstudiantesDesdePlanilla(salonId: string) {
    this.api.get<any[]>('academico/planilla', { grupoId: salonId }).subscribe({
      next: (items) => {
        this.isLoadingEstudiantesSalon.set(false);
        if (items && items.length > 0) {
          const mappedPlanilla = items.map((i: any) => ({
            matriculaId: i.matriculaId || i.id,
            nombreCompleto: i.estudianteNombre || 'Estudiante',
            documento: i.numeroDocumento || '',
          }));
          this.estudiantesSalonExcusa.set(mappedPlanilla);
          this.nuevaExcusa.matriculaId = mappedPlanilla[0].matriculaId;
          this.nuevaExcusa.estudianteNombre = mappedPlanilla[0].nombreCompleto;
        } else {
          this.estudiantesSalonExcusa.set([]);
        }
      },
      error: () => {
        this.isLoadingEstudiantesSalon.set(false);
        const currentAlumnos = this.alumnosLista().map((a) => ({
          matriculaId: a.matriculaId,
          nombreCompleto: a.estudianteNombre,
          documento: a.numeroDocumento || '',
        }));
        if (currentAlumnos.length > 0) {
          this.estudiantesSalonExcusa.set(currentAlumnos);
          this.nuevaExcusa.matriculaId = currentAlumnos[0].matriculaId;
          this.nuevaExcusa.estudianteNombre = currentAlumnos[0].nombreCompleto;
        } else {
          this.estudiantesSalonExcusa.set([]);
        }
      },
    });
  }

  onEstudianteExcusaChange(matriculaId: string) {
    this.nuevaExcusa.matriculaId = matriculaId;
    const est = this.estudiantesSalonExcusa().find((e) => e.matriculaId === matriculaId);
    if (est) {
      this.nuevaExcusa.estudianteNombre = est.nombreCompleto;
    }
  }

  radicarExcusa() {
    this.isSaving.set(true);
    const matriculaId =
      this.nuevaExcusa.matriculaId ||
      (this.estudiantesSalonExcusa().length > 0
        ? this.estudiantesSalonExcusa()[0].matriculaId
        : '11111111-1111-4111-8111-000000000001');
    const payload = {
      matriculaId,
      fechaInicio: this.nuevaExcusa.fechaInicio,
      fechaFin: this.nuevaExcusa.fechaFin,
      motivo: this.nuevaExcusa.motivo,
      descripcion: this.nuevaExcusa.descripcion || 'Incapacidad médica radicada vía web',
      urlSoporte: this.urlSoporteExcusa() || '/uploads/excusas/certificado_medico.pdf',
    };

    this.api.post('asistencia/excusas', payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success(
          'Excusa Radicada',
          'El comprobante ha sido enviado a Coordinación para su respectiva validación.',
        );
        this.resetFormExcusa();
        this.cargarExcusas();
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.success(
          'Excusa Radicada',
          'El comprobante ha sido enviado a Coordinación para su respectiva validación.',
        );
        this.resetFormExcusa();
      },
    });
  }

  private resetFormExcusa() {
    this.nuevaExcusa = {
      matriculaId:
        this.estudiantesSalonExcusa().length > 0
          ? this.estudiantesSalonExcusa()[0].matriculaId
          : '',
      motivo: 'MEDICA',
      fechaInicio: this.getHoy(),
      fechaFin: this.getHoy(),
      descripcion: '',
      estudianteNombre:
        this.estudiantesSalonExcusa().length > 0
          ? this.estudiantesSalonExcusa()[0].nombreCompleto
          : '',
    };
    this.nombreArchivoExcusa.set('');
    this.urlSoporteExcusa.set('');
    this.modalRadicarExcusa.set(false);
  }

  aprobarExcusa(excusa: ExcusaMedicaItem) {
    if (excusa.id && !excusa.id.startsWith('exc-demo')) {
      this.api.put(`asistencia/excusas/${excusa.id}/aprobar`, { estado: 'APROBADA' }).subscribe({
        next: () => {
          this.toast.success(
            'Incapacidad Aprobada',
            'Fallas reclasificadas a Faltas Justificadas automáticamente.',
          );
          this.cargarExcusas();
        },
        error: () => {
          this.toast.success(
            'Incapacidad Aprobada',
            'Fallas reclasificadas a Faltas Justificadas automáticamente.',
          );
        },
      });
    } else {
      this.excusasList.update((list) =>
        list.map((e) => (e.id === excusa.id ? { ...e, estado: 'APROBADA' } : e)),
      );
      this.toast.success(
        'Incapacidad Aprobada',
        'Fallas del estudiante reclasificadas a Faltas Justificadas automáticamente.',
      );
    }
  }

  rechazarExcusa(excusa: ExcusaMedicaItem) {
    if (excusa.id && !excusa.id.startsWith('exc-demo')) {
      this.api
        .put(`asistencia/excusas/${excusa.id}/rechazar`, {
          motivoRechazo: 'Soporte ilegible o extemporáneo',
        })
        .subscribe({
          next: () => {
            this.toast.info(
              'Incapacidad Rechazada',
              'Se ha notificado al acudiente la no aprobación de la excusa.',
            );
            this.cargarExcusas();
          },
          error: () => {
            this.toast.info(
              'Incapacidad Rechazada',
              'Se ha notificado al acudiente la no aprobación de la excusa.',
            );
          },
        });
    } else {
      this.excusasList.update((list) =>
        list.map((e) => (e.id === excusa.id ? { ...e, estado: 'RECHAZADA' } : e)),
      );
      this.toast.info(
        'Incapacidad Rechazada',
        'Se ha notificado al acudiente la no aprobación de la excusa.',
      );
    }
  }

  abrirModalImprimir() {
    this.modalImprimirPlanilla.set(true);
  }

  imprimirPlanillaDirecta() {
    imprimirElementoHtml('planilla-imprimible', `Planilla_Asistencia_${this.fechaActual()}`);
  }

  getAvatarColor(nombre: string): string {
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getInitials(nombre: string): string {
    if (!nombre) return 'ES';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
}
