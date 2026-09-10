import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermisosService } from '../../core/services/permisos.service';
import { Colegio } from '../../core/models';
import { ModuloInfo } from '../../core/models/permisos.models';
import { ModalNuevoColegioComponent } from '../../shared/components/modal-nuevo-colegio.component';

@Component({
  selector: 'app-super-admin-modulos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalNuevoColegioComponent],
  template: `
    <app-modal-nuevo-colegio
      [visible]="modalNuevoColegio"
      (visibleChange)="modalNuevoColegio.set($event)"
      (colegioCreado)="onColegioCreado($event)"
    ></app-modal-nuevo-colegio>

    <!-- Verificación de Seguridad Super Admin -->
    @if (!isSuperAdmin()) {
      <div class="access-denied-container">
        <div class="access-card">
          <span class="denied-icon">🚫</span>
          <h2>Acceso Restringido — Solo Super Administrador</h2>
          <p>
            Este módulo de aprovisionamiento y asignación SaaS de módulos es de uso exclusivo para la administración global de la plataforma EduCoreOS.
          </p>
          <button (click)="goToDashboard()" class="btn btn-primary">
            Volver al Panel Principal
          </button>
        </div>
      </div>
    } @else {
      <div class="super-admin-container">
        <!-- Encabezado de Página -->
        <div class="page-header">
          <div class="header-titles">
            <div class="header-badge-row">
              <span class="badge-tag-gold">👑 Super Admin Global</span>
              <span class="badge-tag-saas">Aprovisionamiento Multi-Tenant</span>
            </div>
            <h1 class="page-title">⚙️ Habilitación de Módulos por Colegio</h1>
            <p class="page-subtitle">
              Active o desactive los 16 módulos del ecosistema EduCoreOS para cada institución educativa según su plan de suscripción comercial.
            </p>
          </div>
          <div class="header-actions">
            <button (click)="modalNuevoColegio.set(true)" class="btn btn-primary">
              <span class="btn-icon">🏫</span> + Registrar Nuevo Colegio
            </button>
          </div>
        </div>

        <!-- Alerta / Notificación -->
        @if (toastMessage()) {
          <div class="alert-banner" [class.success]="toastType() === 'success'" [class.info]="toastType() === 'info'">
            <span class="alert-icon">{{ toastType() === 'success' ? '✅' : 'ℹ️' }}</span>
            <span class="alert-text">{{ toastMessage() }}</span>
            <button (click)="toastMessage.set('')" class="alert-close">&times;</button>
          </div>
        }

        <!-- Selector de Institución a Configurar -->
        <div class="institution-selector-card">
          <div class="selector-header">
            <div class="selector-title-box">
              <span class="selector-tag">PASO 1: SELECCIONE EL COLEGIO A APROVISIONAR</span>
              <h3 class="selector-title">Instituciones Educativas Registradas ({{ todosLosColegios().length }})</h3>
            </div>
            <div class="select-wrapper">
              <select 
                class="form-select institution-dropdown" 
                [ngModel]="selectedColegioId()" 
                (ngModelChange)="onColegioSelect($event)">
                @for (col of todosLosColegios(); track col.id) {
                  <option [value]="col.id">{{ col.nombre }} — {{ col.ciudad }} (NIT: {{ col.nit }})</option>
                }
              </select>
            </div>
          </div>

          <!-- Tarjeta de Resumen del Colegio Seleccionado -->
          @if (selectedColegio()) {
            <div class="institution-hero-banner">
              <div class="hero-left">
                <div class="hero-avatar" [style.background-color]="selectedColegio()?.colorPrimario || '#4f46e5'">
                  @if (selectedColegio()?.logoUrl) {
                    <img [src]="selectedColegio()?.logoUrl" alt="Escudo" class="hero-logo-img" />
                  } @else {
                    {{ selectedColegio()?.nombre?.substring(0, 2)?.toUpperCase() }}
                  }
                </div>
                <div class="hero-details">
                  <div class="hero-name-row">
                    <h2>{{ selectedColegio()?.nombre }}</h2>
                    <span class="plan-badge" [attr.data-plan]="selectedColegio()?.plan">{{ selectedColegio()?.plan }}</span>
                  </div>
                  <div class="hero-meta-row">
                    <span>🏢 <strong>DANE:</strong> {{ selectedColegio()?.codigoDane }}</span>
                    <span>📄 <strong>NIT:</strong> {{ selectedColegio()?.nit }}</span>
                    <span>📍 <strong>Ciudad:</strong> {{ selectedColegio()?.ciudad }}</span>
                    <span>✉️ <strong>Contacto:</strong> {{ selectedColegio()?.emailContacto }}</span>
                  </div>
                </div>
              </div>

              <!-- Contador de Módulos Activos -->
              <div class="hero-stats-box">
                <div class="stat-number">
                  <span class="count-active">{{ totalModulosActivos() }}</span>
                  <span class="count-total">/ {{ modulos().length }}</span>
                </div>
                <span class="stat-label">Módulos Activos</span>
                <div class="progress-bar-mini">
                  <div class="progress-fill" [style.width.%]="(totalModulosActivos() / modulos().length) * 100"></div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Presets Rápidos de Plan -->
        <div class="presets-card">
          <div class="presets-header">
            <span class="presets-tag">APLICAR PLANTILLA RÁPIDA DE PLAN:</span>
            <p>Ajuste en un clic los módulos recomendados según el nivel de suscripción contratado por la institución.</p>
          </div>
          <div class="presets-buttons-grid">
            <button (click)="applyPlanPreset('BASIC')" class="btn-preset plan-basic">
              <span class="preset-icon">🌱</span>
              <div class="preset-text">
                <strong>Plan Básico (7 Módulos)</strong>
                <span>Académico, LMS, Asistencia, Matrículas, Convivencia, Gobierno y Comunicados</span>
              </div>
            </button>

            <button (click)="applyPlanPreset('STANDARD')" class="btn-preset plan-standard">
              <span class="preset-icon">⭐</span>
              <div class="preset-text">
                <strong>Plan Estándar (13 Módulos)</strong>
                <span>Básico + Tesorería DIAN, Inclusión PIAR, Habeas Data, BPM, Portería y Rutas</span>
              </div>
            </button>

            <button (click)="applyPlanPreset('ENTERPRISE')" class="btn-preset plan-enterprise">
              <span class="preset-icon">🚀</span>
              <div class="preset-text">
                <strong>Plan Enterprise (16 Módulos — All Inclusive)</strong>
                <span>Todos los módulos activos incluyendo Contabilidad NIIF, Nómina y SIMAT</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Grid de los 16 Módulos para Conmutación Individual -->
        <div class="modules-grid-section">
          <div class="section-title-row">
            <h3 class="section-title">📦 Catálogo de Módulos EduCoreOS</h3>
            <span class="section-subtitle">Conmute individualmente cualquier módulo para habilitarlo o suspenderlo en esta sede.</span>
          </div>

          <div class="modules-cards-grid">
            @for (m of modulos(); track m.codigo) {
              <div class="module-provision-card" [class.active-module]="isModuloActivo(m.codigo)">
                <div class="card-top-row">
                  <div class="mod-icon-badge">{{ m.icono }}</div>
                  <div class="mod-meta">
                    <span class="mod-code">{{ m.codigo }}</span>
                    <span class="cat-pill" [attr.data-cat]="m.categoria">{{ m.categoria }}</span>
                  </div>
                  <!-- Switch Toggle -->
                  <label class="switch-toggle" title="Activar o desactivar este módulo para el colegio">
                    <input 
                      type="checkbox" 
                      [checked]="isModuloActivo(m.codigo)"
                      (change)="toggleModulo(m.codigo, $event)" />
                    <span class="slider round"></span>
                  </label>
                </div>

                <div class="card-body-content">
                  <h4 class="module-title">{{ m.nombre }}</h4>
                  @if (m.normativa) {
                    <span class="law-badge">{{ m.normativa }}</span>
                  }
                  <p class="module-desc">{{ m.descripcion }}</p>
                </div>

                <div class="card-footer-status">
                  <div class="status-indicator" [class.active]="isModuloActivo(m.codigo)">
                    <span class="dot"></span>
                    <span class="text">{{ isModuloActivo(m.codigo) ? 'Habilitado en Menú' : 'Deshabilitado / Oculto' }}</span>
                  </div>
                  <span class="perm-count-tag">{{ m.permisos.length }} Permisos</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .super-admin-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      border-radius: 12px;
      padding: 1.5rem 1.75rem;
      border: 1px solid #3730a3;
      color: white;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .badge-tag-gold {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-size: 0.725rem;
      font-weight: 800;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .badge-tag-saas {
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      border: 1px solid rgba(129, 140, 248, 0.4);
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 0.35rem 0;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #cbd5e1;
      margin: 0;
      max-width: 750px;
      line-height: 1.4;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.6rem 1.15rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: white;
      border-color: #6366f1;
      &:hover {
        background: linear-gradient(135deg, #4338ca, #3730a3);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      }
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      animation: fadeIn 0.3s ease;
      &.success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
      &.info {
        background: #eff6ff;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      }
    }

    .alert-close {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: inherit;
    }

    /* Institution Selector Card */
    .institution-selector-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .selector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .selector-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #6366f1;
      letter-spacing: 0.05em;
    }

    .selector-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.15rem 0 0 0;
    }

    .select-wrapper {
      min-width: 320px;
    }

    .institution-dropdown {
      width: 100%;
      padding: 0.65rem 1rem;
      border: 2px solid #6366f1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      background-color: #f8fafc;
      cursor: pointer;
      outline: none;
      &:focus {
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }
    }

    /* Institution Hero Banner */
    .institution-hero-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
      min-width: 300px;
    }

    .hero-avatar {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .hero-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .hero-name-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
      h2 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }
    }

    .plan-badge {
      font-size: 0.725rem;
      font-weight: 800;
      padding: 0.15rem 0.55rem;
      border-radius: 6px;
      text-transform: uppercase;
      background: #e0e7ff;
      color: #4338ca;
      &[data-plan="ENTERPRISE"] {
        background: #fdf4ff;
        color: #a855f7;
        border: 1px solid #f0abfc;
      }
      &[data-plan="STANDARD"] {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }
    }

    .hero-meta-row {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #64748b;
      flex-wrap: wrap;
    }

    .hero-stats-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 140px;
    }

    .stat-number {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .count-active {
      font-size: 1.75rem;
      font-weight: 800;
      color: #10b981;
    }

    .count-total {
      font-size: 1rem;
      font-weight: 700;
      color: #94a3b8;
    }

    .stat-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .progress-bar-mini {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      margin-top: 0.35rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Presets Card */
    .presets-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .presets-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.05em;
    }

    .presets-header p {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0.15rem 0 0.75rem 0;
    }

    .presets-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .btn-preset {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      &.plan-basic:hover {
        border-color: #10b981;
        background: #f0fdf4;
      }
      &.plan-standard:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      &.plan-enterprise:hover {
        border-color: #8b5cf6;
        background: #faf5ff;
      }
    }

    .preset-icon {
      font-size: 1.5rem;
    }

    .preset-text {
      display: flex;
      flex-direction: column;
      strong {
        font-size: 0.875rem;
        color: #1e293b;
      }
      span {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.15rem;
      }
    }

    /* Modules Grid Section */
    .modules-grid-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-title-row {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }

    .modules-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .module-provision-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.85rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
      }

      &.active-module {
        border-color: #10b981;
        background: linear-gradient(180deg, #ffffff, rgba(240, 253, 244, 0.3));
      }
    }

    .card-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .mod-icon-badge {
      font-size: 1.5rem;
      width: 44px;
      height: 44px;
      background: #f1f5f9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
    }

    .mod-meta {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }

    .mod-code {
      font-size: 0.75rem;
      font-weight: 800;
      color: #4f46e5;
    }

    .cat-pill {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .card-body-content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .module-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }

    .law-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.68rem;
      font-weight: 700;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }

    .module-desc {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    .card-footer-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.75rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      color: #94a3b8;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #cbd5e1;
      }

      &.active {
        color: #059669;
        .dot {
          background-color: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
      }
    }

    .perm-count-tag {
      color: #64748b;
      font-weight: 600;
      background: #f1f5f9;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    /* Switch Toggle */
    .switch-toggle {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 24px;
      flex-shrink: 0;

      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e1;
      transition: 0.25s;
      border-radius: 24px;

      &:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.25s;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    input:checked + .slider {
      background-color: #10b981;
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    /* Access Denied */
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 1.5rem;
    }

    .access-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #fecaca;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.1);
      padding: 2.5rem;
      max-width: 500px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      h2 {
        font-size: 1.35rem;
        font-weight: 800;
        color: #991b1b;
        margin: 0;
      }
      p {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }
    }

    .denied-icon {
      font-size: 3.5rem;
    }
  `]
})
export class SuperAdminModulosComponent {
  private readonly authService = inject(AuthService);
  private readonly permisosService = inject(PermisosService);
  private readonly router = inject(Router);

  readonly isSuperAdmin = computed(() => this.authService.user()?.role === 'SUPER_ADMIN');
  readonly todosLosColegios = this.authService.todosLosColegios;
  readonly modulos = this.permisosService.modulos;

  selectedColegioId = signal<string>('');
  modalNuevoColegio = signal<boolean>(false);

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'info'>('success');

  constructor() {
    const cols = this.todosLosColegios();
    if (cols.length > 0) {
      this.selectedColegioId.set(cols[0].id);
    }
  }

  readonly selectedColegio = computed<Colegio | undefined>(() => {
    const id = this.selectedColegioId();
    return this.todosLosColegios().find((c) => c.id === id) || this.todosLosColegios()[0];
  });

  readonly totalModulosActivos = computed<number>(() => {
    const col = this.selectedColegio();
    if (!col) return 0;
    return col.modulosActivos?.length || 0;
  });

  onColegioSelect(id: string) {
    this.selectedColegioId.set(id);
  }

  isModuloActivo(moduloCodigo: string): boolean {
    const col = this.selectedColegio();
    if (!col) return false;
    return col.modulosActivos?.includes(moduloCodigo) ?? false;
  }

  toggleModulo(moduloCodigo: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const colId = this.selectedColegioId();
    if (!colId) return;

    this.permisosService.toggleModuloColegio(colId, moduloCodigo, checked);
    const mod = this.modulos().find((m) => m.codigo === moduloCodigo);
    this.toastType.set('success');
    this.toastMessage.set(
      `Módulo '${mod?.nombre || moduloCodigo}' ${checked ? 'habilitado' : 'deshabilitado'} exitosamente para ${this.selectedColegio()?.nombre}.`
    );
  }

  applyPlanPreset(plan: 'BASIC' | 'STANDARD' | 'ENTERPRISE') {
    const colId = this.selectedColegioId();
    if (!colId) return;

    this.permisosService.setPlanModulosPreset(colId, plan);
    this.toastType.set('success');
    this.toastMessage.set(
      `Plantilla de Plan ${plan} aplicada exitosamente a ${this.selectedColegio()?.nombre}. Módulos actualizados.`
    );
  }

  onColegioCreado(nuevoColegio: Colegio) {
    this.selectedColegioId.set(nuevoColegio.id);
    this.toastType.set('success');
    this.toastMessage.set(`Institución '${nuevoColegio.nombre}' registrada y lista para aprovisionar módulos.`);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
