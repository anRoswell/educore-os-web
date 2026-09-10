import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PermisosService } from '../../core/services/permisos.service';
import { AuthService } from '../../core/services/auth.service';
import { RoleInfo, ModuloInfo, PermisoInfo } from '../../core/models/permisos.models';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="permisos-container">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div class="header-titles">
          <div class="header-badge-row">
            <span class="badge-tag">Seguridad & RBAC</span>
            <span class="badge-role-count">{{ roles().length }} Roles Configurados</span>
          </div>
          <h1 class="page-title">🛡️ Matriz de Permisos por Rol</h1>
          <p class="page-subtitle">
            Configure y personalice de manera granular los privilegios de acceso para cada uno de los perfiles del ecosistema escolar.
          </p>
        </div>
        <div class="header-actions">
          <button (click)="resetDefaults()" class="btn btn-outline-danger" title="Restablecer valores originales del sistema">
            <span class="btn-icon">↺</span> Restablecer Predeterminados
          </button>
          <button (click)="saveSuccess()" class="btn btn-primary">
            <span class="btn-icon">💾</span> Matriz Activa y Sincronizada
          </button>
        </div>
      </div>

      <!-- Banner Informativo / Toast -->
      @if (toastMessage()) {
        <div class="alert-banner" [class.success]="toastType() === 'success'" [class.info]="toastType() === 'info'">
          <span class="alert-icon">{{ toastType() === 'success' ? '✅' : 'ℹ️' }}</span>
          <span class="alert-text">{{ toastMessage() }}</span>
          <button (click)="toastMessage.set('')" class="alert-close">&times;</button>
        </div>
      }

      <!-- Selector de Rol (Tabs Horizontales) -->
      <div class="roles-tabs-card">
        <div class="tabs-label">SELECCIONE EL ROL PARA CONFIGURAR:</div>
        <div class="roles-tabs-scroll">
          @for (r of roles(); track r.codigo) {
            <button 
              (click)="selectRole(r.codigo)" 
              class="role-tab-btn" 
              [class.active]="selectedRoleCode() === r.codigo"
              [style.--role-color]="r.color">
              <span class="role-tab-icon">{{ r.icono }}</span>
              <div class="role-tab-info">
                <span class="role-tab-title">{{ r.nombre }}</span>
                <span class="role-tab-code">{{ r.codigo }}</span>
              </div>
              @if (r.esGlobal) {
                <span class="role-pill-global">GLOBAL</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Detalle del Rol Activo -->
      @if (currentRole()) {
        <div class="role-summary-banner">
          <div class="role-summary-avatar" [style.background-color]="currentRole()?.color || '#4f46e5'">
            {{ currentRole()?.icono }}
          </div>
          <div class="role-summary-text">
            <div class="role-summary-header">
              <h3>{{ currentRole()?.nombre }}</h3>
              <span class="role-code-badge">{{ currentRole()?.codigo }}</span>
              @if (currentRole()?.esGlobal) {
                <span class="badge-global-admin">⚡ Acceso Global SaaS</span>
              }
            </div>
            <p>{{ currentRole()?.descripcion }}</p>
          </div>
          @if (currentRole()?.codigo === 'SUPER_ADMIN') {
            <div class="super-admin-notice">
              🔒 <strong>Nota de Seguridad:</strong> El Super Administrador posee permisos universales irrestrictos sobre todas las funciones.
            </div>
          }
        </div>
      }

      <!-- Filtros y Búsqueda de Permisos -->
      <div class="filters-toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Buscar por nombre de permiso, módulo o código..." 
            class="search-input" />
          @if (searchQuery()) {
            <button (click)="searchQuery.set('')" class="clear-search-btn">&times;</button>
          }
        </div>

        <div class="category-chips">
          <button 
            (click)="selectedCategoria.set('TODOS')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'TODOS'">
            Todos los Módulos ({{ modulos().length }})
          </button>
          <button 
            (click)="selectedCategoria.set('ACADEMICO')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'ACADEMICO'">
            🎓 Académico
          </button>
          <button 
            (click)="selectedCategoria.set('FINANCIERO')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'FINANCIERO'">
            💰 Finanzas
          </button>
          <button 
            (click)="selectedCategoria.set('CONVIVENCIA')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'CONVIVENCIA'">
            🛡️ Convivencia
          </button>
          <button 
            (click)="selectedCategoria.set('COMUNICACIONES')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'COMUNICACIONES'">
            📢 Comunicaciones
          </button>
          <button 
            (click)="selectedCategoria.set('GESTION')" 
            class="cat-chip" 
            [class.active]="selectedCategoria() === 'GESTION'">
            📑 Gestión & BPM
          </button>
        </div>
      </div>

      <!-- Matriz de Permisos Agrupada por Módulo -->
      <div class="matrix-grid">
        @for (mod of modulosFiltrados(); track mod.codigo) {
          <div class="module-permission-card">
            <div class="module-card-header">
              <div class="mod-title-group">
                <span class="mod-icon">{{ mod.icono }}</span>
                <div>
                  <div class="mod-header-row">
                    <span class="mod-code-pill">{{ mod.codigo }}</span>
                    <h4 class="mod-name">{{ mod.nombre }}</h4>
                    @if (mod.normativa) {
                      <span class="mod-law-tag">{{ mod.normativa }}</span>
                    }
                  </div>
                  <p class="mod-desc">{{ mod.descripcion }}</p>
                </div>
              </div>
              <div class="mod-bulk-actions">
                <button 
                  (click)="toggleAllModule(mod.codigo, true)" 
                  class="btn-bulk-toggle enable" 
                  [disabled]="selectedRoleCode() === 'SUPER_ADMIN'"
                  title="Conceder todos los permisos de este módulo">
                  ✓ Permitir Todo
                </button>
                <button 
                  (click)="toggleAllModule(mod.codigo, false)" 
                  class="btn-bulk-toggle disable" 
                  [disabled]="selectedRoleCode() === 'SUPER_ADMIN'"
                  title="Revocar todos los permisos de este módulo">
                  ✕ Denegar Todo
                </button>
              </div>
            </div>

            <div class="permissions-list">
              @for (p of mod.permisos; track p.codigo) {
                <div class="permission-item" [class.granted]="isGranted(selectedRoleCode(), p.codigo)">
                  <div class="perm-info">
                    <div class="perm-title-row">
                      <span class="perm-name">{{ p.nombre }}</span>
                      <span class="perm-code">{{ p.codigo }}</span>
                      <span class="action-tag" [attr.data-action]="p.accion">{{ p.accion | uppercase }}</span>
                    </div>
                    <p class="perm-desc">{{ p.descripcion }}</p>
                  </div>

                  <div class="perm-switch-wrapper">
                    <label class="switch-toggle" [title]="selectedRoleCode() === 'SUPER_ADMIN' ? 'Super Admin siempre tiene acceso' : 'Habilitar o denegar permiso'">
                      <input 
                        type="checkbox" 
                        [checked]="isGranted(selectedRoleCode(), p.codigo)"
                        [disabled]="selectedRoleCode() === 'SUPER_ADMIN'"
                        (change)="togglePermission(p.codigo)" />
                      <span class="slider round"></span>
                    </label>
                    <span class="switch-status-text">
                      {{ isGranted(selectedRoleCode(), p.codigo) ? 'Concedido' : 'Denegado' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state-box">
            <span class="empty-icon">🔎</span>
            <h3>No se encontraron permisos coincidentes</h3>
            <p>Intente modificar los términos de búsqueda o cambiar el filtro de categoría.</p>
            <button (click)="searchQuery.set(''); selectedCategoria.set('TODOS')" class="btn btn-outline-primary btn-sm">
              Limpiar Filtros
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .permisos-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-radius: 12px;
      padding: 1.5rem 1.75rem;
      border: 1px solid #334155;
      color: white;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .badge-tag {
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      border: 1px solid rgba(129, 140, 248, 0.4);
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-role-count {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
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
      color: #94a3b8;
      margin: 0;
      max-width: 700px;
      line-height: 1.4;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
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

    .btn-outline-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.35);
      &:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: #f87171;
      }
    }

    .btn-outline-primary {
      background: rgba(99, 102, 241, 0.1);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.35);
      &:hover {
        background: rgba(99, 102, 241, 0.25);
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
      line-height: 1;
    }

    /* Roles Tabs Card */
    .roles-tabs-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .tabs-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .roles-tabs-scroll {
      display: flex;
      gap: 0.65rem;
      overflow-x: auto;
      padding-bottom: 0.35rem;
      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
    }

    .role-tab-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.95rem;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      text-align: left;
      flex-shrink: 0;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      &.active {
        background: #ffffff;
        border-color: var(--role-color, #4f46e5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        outline: 2px solid var(--role-color, #4f46e5);
      }
    }

    .role-tab-icon {
      font-size: 1.25rem;
    }

    .role-tab-info {
      display: flex;
      flex-direction: column;
    }

    .role-tab-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
    }

    .role-tab-code {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }

    .role-pill-global {
      font-size: 0.625rem;
      font-weight: 800;
      background: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    /* Role Summary Banner */
    .role-summary-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      flex-wrap: wrap;
    }

    .role-summary-avatar {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .role-summary-text {
      flex: 1;
      min-width: 260px;
      p {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0.25rem 0 0 0;
      }
    }

    .role-summary-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
      h3 {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }
    }

    .role-code-badge {
      font-size: 0.725rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .badge-global-admin {
      font-size: 0.725rem;
      font-weight: 800;
      background: #e0e7ff;
      color: #4338ca;
      padding: 0.15rem 0.55rem;
      border-radius: 6px;
    }

    .super-admin-notice {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
    }

    /* Filters Toolbar */
    .filters-toolbar {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
      color: #94a3b8;
    }

    .search-input {
      width: 100%;
      padding: 0.6rem 2.2rem 0.6rem 2.4rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #ffffff;
      outline: none;
      transition: all 0.2s ease;
      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
      }
    }

    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: #94a3b8;
    }

    .category-chips {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .cat-chip {
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
      &.active {
        background: #4f46e5;
        color: #ffffff;
        border-color: #4338ca;
        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
      }
    }

    /* Matrix Grid */
    .matrix-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .module-permission-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }

    .module-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .mod-title-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .mod-icon {
      font-size: 1.5rem;
    }

    .mod-header-row {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .mod-code-pill {
      font-size: 0.7rem;
      font-weight: 800;
      background: #4f46e5;
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .mod-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .mod-law-tag {
      font-size: 0.7rem;
      font-weight: 700;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
    }

    .mod-desc {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
    }

    .mod-bulk-actions {
      display: flex;
      gap: 0.4rem;
    }

    .btn-bulk-toggle {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      &.enable {
        background: #f0fdf4;
        color: #16a34a;
        border-color: #bbf7d0;
        &:hover:not(:disabled) {
          background: #dcfce7;
        }
      }
      &.disable {
        background: #fef2f2;
        color: #dc2626;
        border-color: #fecaca;
        &:hover:not(:disabled) {
          background: #fee2e2;
        }
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .permissions-list {
      display: flex;
      flex-direction: column;
      divide-y: 1px solid #f1f5f9;
    }

    .permission-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      gap: 1rem;
      transition: background-color 0.15s ease;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f8fafc;
      }

      &.granted {
        background-color: rgba(240, 253, 244, 0.4);
      }
    }

    .perm-info {
      flex: 1;
    }

    .perm-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .perm-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e293b;
    }

    .perm-code {
      font-size: 0.68rem;
      font-family: monospace;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .action-tag {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      &[data-action="read"] { background: #e0f2fe; color: #0369a1; }
      &[data-action="create"] { background: #dcfce7; color: #15803d; }
      &[data-action="update"] { background: #fef3c7; color: #b45309; }
      &[data-action="delete"] { background: #fee2e2; color: #b91c1c; }
      &[data-action="manage"] { background: #f3e8ff; color: #7e22ce; }
      &[data-action="export"] { background: #ffedd5; color: #c2410c; }
    }

    .perm-desc {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0.2rem 0 0 0;
    }

    .perm-switch-wrapper {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
    }

    .switch-status-text {
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 68px;
      color: #475569;
    }

    /* Switch Toggle */
    .switch-toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;

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
      transform: translateX(20px);
    }

    input:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .empty-state-box {
      text-align: center;
      padding: 3rem 1.5rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
      color: #64748b;
      h3 {
        font-size: 1.1rem;
        color: #1e293b;
        margin: 0.5rem 0 0.25rem 0;
      }
      p {
        font-size: 0.85rem;
        margin-bottom: 1rem;
      }
    }
    .empty-icon {
      font-size: 2.2rem;
    }
  `]
})
export class PermisosComponent {
  private readonly permisosService = inject(PermisosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    if (this.authService.user()?.role !== 'SUPER_ADMIN') {
      this.router.navigate(['/dashboard']);
    }
  }

  readonly roles = this.permisosService.roles;
  readonly modulos = this.permisosService.modulos;
  readonly matrix = this.permisosService.matrix;

  selectedRoleCode = signal<string>('RECTOR');
  selectedCategoria = signal<string>('TODOS');
  searchQuery = signal<string>('');

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'info'>('success');

  readonly currentRole = computed<RoleInfo | undefined>(() => {
    return this.roles().find((r) => r.codigo === this.selectedRoleCode());
  });

  readonly modulosFiltrados = computed<ModuloInfo[]>(() => {
    let list = this.modulos();
    const cat = this.selectedCategoria();
    const q = this.searchQuery().toLowerCase().trim();

    if (cat !== 'TODOS') {
      list = list.filter((m) => m.categoria === cat);
    }

    if (q) {
      list = list.filter((m) => {
        const matchMod = m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q);
        const matchPerm = m.permisos.some(
          (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
        );
        return matchMod || matchPerm;
      });
    }

    return list;
  });

  selectRole(roleCode: string) {
    this.selectedRoleCode.set(roleCode);
  }

  isGranted(roleCode: string, permissionCode: string): boolean {
    if (roleCode === 'SUPER_ADMIN') return true;
    const m = this.matrix();
    return !!(m[roleCode] && m[roleCode][permissionCode]);
  }

  togglePermission(permissionCode: string) {
    const roleCode = this.selectedRoleCode();
    const newState = this.permisosService.togglePermission(roleCode, permissionCode);
    this.toastType.set('success');
    this.toastMessage.set(`Permiso '${permissionCode}' ${newState ? 'concedido' : 'denegado'} para el rol ${roleCode}.`);
  }

  toggleAllModule(moduloCodigo: string, enable: boolean) {
    const roleCode = this.selectedRoleCode();
    this.permisosService.toggleModuleForRole(roleCode, moduloCodigo, enable);
    this.toastType.set('success');
    this.toastMessage.set(`Todos los permisos de '${moduloCodigo}' han sido ${enable ? 'concedidos' : 'denegados'} para ${roleCode}.`);
  }

  resetDefaults() {
    this.permisosService.resetToDefaults();
    this.toastType.set('info');
    this.toastMessage.set('La matriz de permisos ha sido restablecida a sus valores predeterminados de fábrica.');
  }

  saveSuccess() {
    this.toastType.set('success');
    this.toastMessage.set('Matriz de permisos almacenada y propagada en tiempo real.');
  }
}
