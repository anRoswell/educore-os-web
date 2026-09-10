import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from '../shared/components/toast-container.component';
import { GlossaryModalComponent } from '../shared/components/glossary-modal.component';
import { ModalNuevoColegioComponent } from '../shared/components/modal-nuevo-colegio.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastContainerComponent,
    GlossaryModalComponent,
    ModalNuevoColegioComponent,
  ],
  template: `
    <div class="admin-shell">
      <app-toast-container></app-toast-container>
      <app-glossary-modal></app-glossary-modal>
      <app-modal-nuevo-colegio [visible]="modalNuevoColegio" (visibleChange)="modalNuevoColegio.set($event)"></app-modal-nuevo-colegio>

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <!-- Logo y Marca -->
        <div class="brand-header">
          <div class="logo-icon">
            <img 
              src="assets/educoreos_logo_transparent.png" 
              alt="EduCoreOS" 
              class="brand-logo-img" 
            />
          </div>
          <div class="brand-text">
            <h2>EduCore<span>OS</span></h2>
            <span class="brand-badge">SaaS Multi-Tenant</span>
          </div>
        </div>

        <!-- Selector de Institución (Tenant Switcher) -->
        <div class="tenant-selector-box">
          <div class="flex-between mb-1">
            <label class="tenant-label" style="margin: 0;">INSTITUCIÓN EDUCATIVA (TENANT)</label>
            @if (authService.user()?.role === 'SUPER_ADMIN') {
              <button (click)="modalNuevoColegio.set(true)" class="btn-link-crear-colegio" title="Registrar Nueva Institución Educativa">
                + Nuevo
              </button>
            }
          </div>
          <div class="tenant-card">
            <div class="tenant-avatar" [style.background-color]="authService.colegio()?.colorPrimario || '#6366f1'">
              @if (authService.colegio()?.logoUrl) {
                <img [src]="authService.colegio()?.logoUrl" alt="Escudo" class="tenant-logo-img" />
              } @else {
                {{ authService.colegio()?.nombre?.substring(0, 2)?.toUpperCase() }}
              }
            </div>
            <div class="tenant-info">
              <span class="tenant-name" [title]="authService.colegio()?.nombre">{{ authService.colegio()?.nombre }}</span>
              <span class="tenant-sub">DANE: {{ authService.colegio()?.codigoDane }}</span>
            </div>
          </div>
          @if (authService.colegiosDisponibles().length > 1) {
            <div class="tenant-select-row">
              <select 
                class="tenant-select-dropdown" 
                [value]="authService.colegio()?.id" 
                (change)="onColegioChange($event)">
                @for (col of authService.colegiosDisponibles(); track col.id) {
                  <option [value]="col.id">{{ col.nombre }} ({{ col.ciudad }})</option>
                }
              </select>
            </div>
          } @else {
            <div class="tenant-badge-single">
              <span class="badge-single-dot"></span>
              <span>Sede Institucional Única</span>
            </div>
          }
        </div>

        <!-- Menú de Navegación por Categorías -->
        <nav class="nav-menu">
          <!-- 1. CORE DASHBOARD (Todos los roles) -->
          <div class="nav-section-title">PANEL PRINCIPAL & BI</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📊</span>
            <span class="nav-text">
              @if (authService.user()?.role === 'DOCENTE') {
                Dashboard Pedagógico
              } @else if (authService.user()?.role === 'TESORERO' || authService.user()?.role === 'CONTADOR') {
                Dashboard Financiero
              } @else if (authService.user()?.role === 'COORDINADOR') {
                Dashboard Coordinación
              } @else if (authService.user()?.role === 'ESTUDIANTE' || authService.user()?.role === 'ACUDIENTE') {
                Portal del Estudiante
              } @else {
                Dashboard Rectoría & BI
              }
            </span>
          </a>

          <!-- 2. GESTIÓN ACADÉMICA & LMS (Rector, Coordinador, Docente, Estudiante, Super Admin) -->
          @if (authService.user()?.role !== 'TESORERO' && authService.user()?.role !== 'CONTADOR' && authService.user()?.role !== 'REVISOR_FISCAL') {
            <div class="nav-section-title">GESTIÓN ACADÉMICA & LMS</div>
            @if (authService.isModuloActivo('M01') && authService.user()?.role !== 'ESTUDIANTE' && authService.user()?.role !== 'ACUDIENTE') {
              <a routerLink="/academico" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🎓</span>
                <span class="nav-text">Gestión Académica (Dec. 1290)</span>
              </a>
            }
            @if (authService.isModuloActivo('M02')) {
              <a routerLink="/lms" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📚</span>
                <span class="nav-text">
                  {{ authService.user()?.role === 'DOCENTE' || authService.user()?.role === 'ESTUDIANTE' ? 'Aula Virtual & Tareas' : 'Aula Virtual & Tareas LMS' }}
                </span>
                <span class="badge-mini" style="background: rgba(79, 70, 229, 0.2); color: #818cf8; border-color: rgba(79, 70, 229, 0.3);">LMS</span>
              </a>
            }
            @if (authService.isModuloActivo('M05')) {
              <a routerLink="/asistencia" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📅</span>
                <span class="nav-text">
                  {{ authService.user()?.role === 'ESTUDIANTE' ? 'Mis Faltas & Excusas' : 'Asistencia & Excusas' }}
                </span>
              </a>
            }
            @if (authService.isModuloActivo('M06') && (authService.user()?.role === 'RECTOR' || authService.user()?.role === 'COORDINADOR' || authService.user()?.role === 'SUPER_ADMIN' || authService.user()?.role === 'SECRETARIA')) {
              <a routerLink="/matriculas" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">👥</span>
                <span class="nav-text">Matrículas & Ficha 360°</span>
              </a>
            }
          }

          <!-- 3. ÁREA FINANCIERA & TALENTO HUMANO (Rectoría, Tesorería, Contador, Revisor Fiscal, Super Admin) -->
          @if (authService.user()?.role === 'RECTOR' || authService.user()?.role === 'TESORERO' || authService.user()?.role === 'CONTADOR' || authService.user()?.role === 'REVISOR_FISCAL' || authService.user()?.role === 'SUPER_ADMIN') {
            <div class="nav-section-title">FINANZAS & TALENTO HUMANO</div>
            @if (authService.isModuloActivo('M03')) {
              <a routerLink="/tesoreria" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">💰</span>
                <span class="nav-text">Tesorería & Facturación</span>
              </a>
            }
            @if (authService.isModuloActivo('M15') && (authService.user()?.role === 'RECTOR' || authService.user()?.role === 'SUPER_ADMIN' || authService.user()?.role === 'TESORERO')) {
              <a routerLink="/talento-humano" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">👔</span>
                <span class="nav-text">Talento Humano & Nómina</span>
                <span class="badge-mini" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">RRHH</span>
              </a>
            }
            @if (authService.isModuloActivo('M04')) {
              <a routerLink="/contabilidad" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🏛</span>
                <span class="nav-text">Contabilidad NIIF</span>
                <span class="badge-mini" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);">NIIF</span>
              </a>
            }
          }

          <!-- 4. INNOVACIÓN & COMUNIDAD (No visible para finanzas puras) -->
          @if (authService.user()?.role !== 'TESORERO' && authService.user()?.role !== 'CONTADOR' && authService.user()?.role !== 'REVISOR_FISCAL') {
            <div class="nav-section-title">INNOVACIÓN & AULA</div>
            @if (authService.user()?.role !== 'ESTUDIANTE' && authService.user()?.role !== 'ACUDIENTE') {
              <a routerLink="/educore-ai" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">✨</span>
                <span class="nav-text">
                  {{ authService.user()?.role === 'DOCENTE' ? 'EduCore AI Planeador' : 'EduCore AI & RAG PEI' }}
                </span>
                <span class="badge-mini">AI</span>
              </a>
            }
            @if (authService.isModuloActivo('M07')) {
              <a routerLink="/convivencia" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🛡️</span>
                <span class="nav-text">{{ authService.user()?.role === 'ESTUDIANTE' ? 'Mi Observador' : 'Convivencia & Observador' }}</span>
                <span class="badge-mini" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">1620</span>
              </a>
            }
            @if (authService.user()?.role !== 'ESTUDIANTE' && authService.user()?.role !== 'ACUDIENTE') {
              @if (authService.isModuloActivo('M08')) {
                <a routerLink="/inclusion" routerLinkActive="active" class="nav-link">
                  <span class="nav-icon">🧩</span>
                  <span class="nav-text">Inclusión & PIAR (DUA)</span>
                  <span class="badge-mini" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">1421</span>
                </a>
              }
              @if (authService.isModuloActivo('M09')) {
                <a routerLink="/habeas-data" routerLinkActive="active" class="nav-link">
                  <span class="nav-icon">⚖️</span>
                  <span class="nav-text">Protección de Datos & SIC</span>
                  <span class="badge-mini" style="background: rgba(2, 132, 199, 0.2); color: #38bdf8; border-color: rgba(2, 132, 199, 0.3);">1581</span>
                </a>
              }
            }
            @if (authService.isModuloActivo('M10')) {
              <a routerLink="/gobierno-escolar" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🗳️</span>
                <span class="nav-text">{{ authService.user()?.role === 'ESTUDIANTE' ? 'Votaciones Escolares' : 'Gobierno & Elecciones' }}</span>
              </a>
            }
          }

          <!-- 5. COMUNICACIONES (Visible para toda la comunidad si M11 está activo) -->
          @if (authService.isModuloActivo('M11')) {
            <div class="nav-section-title">COMUNICACIONES & MENSAJES</div>
            <a routerLink="/comunicaciones" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📢</span>
              <span class="nav-text">Comunicados Institucionales</span>
              <span class="badge-mini" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.3);">CIRCULAR</span>
            </a>
          }

          <!-- 6. HERRAMIENTAS & SISTEMA (Directivos y Administrativos) -->
          @if (authService.user()?.role === 'RECTOR' || authService.user()?.role === 'COORDINADOR' || authService.user()?.role === 'SUPER_ADMIN' || authService.user()?.role === 'SECRETARIA') {
            <div class="nav-section-title">HERRAMIENTAS & GESTIÓN</div>
            @if (authService.isModuloActivo('M12')) {
              <a routerLink="/documental" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📑</span>
                <span class="nav-text">Gestión Documental & Flujos</span>
                <span class="badge-mini" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);">BPM</span>
              </a>
            }
            @if (authService.isModuloActivo('M13')) {
              <a routerLink="/importador" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📥</span>
                <span class="nav-text">Importador Excel & SIMAT</span>
                <span class="badge-mini" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">XLS</span>
              </a>
            }
            @if (authService.isModuloActivo('M14')) {
              <a routerLink="/porteria" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🛡️</span>
                <span class="nav-text">Portería & Control Acceso</span>
                <span class="badge-mini" style="background: rgba(52, 211, 153, 0.2); color: #34d399; border-color: rgba(52, 211, 153, 0.3);">QR</span>
              </a>
            }
            @if (authService.isModuloActivo('M16')) {
              <a routerLink="/transporte-restaurante" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🚌</span>
                <span class="nav-text">Transporte & Restaurante</span>
                <span class="badge-mini" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">GPS</span>
              </a>
            }
          }
 
          <!-- 7. GESTIÓN SAAS (EXCLUSIVO SUPER ADMIN) -->
          @if (authService.user()?.role === 'SUPER_ADMIN') {
            <div class="nav-section-title" style="color: #fbbf24;">👑 ADMINISTRACIÓN SAAS</div>
            <a routerLink="/super-admin/modulos-colegios" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">Módulos por Colegio</span>
              <span class="badge-mini" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">GLOBAL</span>
            </a>
            <a routerLink="/permisos" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🛡️</span>
              <span class="nav-text">Matriz de Permisos RBAC</span>
              <span class="badge-mini" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.3);">RBAC</span>
            </a>
          }
        </nav>

        <!-- Footer Sidebar -->
        <div class="sidebar-footer">
          <div class="footer-top-row">
            <div class="api-status">
              <span class="status-dot"></span>
              <span>API Online (v1.0.0)</span>
            </div>
            <a href="http://localhost:3001/docs" target="_blank" class="swagger-link">
              <span>📚 Swagger</span>
            </a>
          </div>
          <button (click)="authService.logout()" class="sidebar-logout-btn" title="Cerrar sesión en EduCoreOS">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-logout-svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="main-wrapper">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <span class="year-badge">📅 Año Lectivo 2026</span>
            <span class="system-status">Modo Multitenant: <strong>{{ authService.colegio()?.slug }}</strong></span>
          </div>

          <div class="topbar-right">
            <!-- Perfil de Usuario Activo -->
            <div class="user-profile-widget">
              <div class="user-details">
                <span class="user-name">{{ authService.user()?.primerNombre }} {{ authService.user()?.primerApellido }}</span>
                <span class="badge badge-purple btn-sm">{{ authService.user()?.role }}</span>
              </div>
              <img [src]="authService.user()?.avatarUrl" alt="Avatar" class="user-avatar" />
              <button (click)="authService.logout()" class="btn-logout" title="Cerrar Sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="logout-svg">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span class="logout-label">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <!-- ROUTER OUTLET CONTAINER -->
        <main class="page-content animate-fade-in">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background-color: #f8fafc;
    }

    /* SIDEBAR */
    .sidebar {
      width: 280px;
      min-width: 280px;
      background-color: #0f172a;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #1e293b;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .brand-header {
      padding: 1.5rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo-icon {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(67, 56, 202, 0.35));
      border: 1px solid rgba(129, 140, 248, 0.3);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
      overflow: hidden;
      padding: 2px;
      flex-shrink: 0;
    }

    .brand-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 9px;
    }

    .brand-text h2 {
      font-size: 1.25rem;
      color: #ffffff;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-text h2 span {
      color: #818cf8;
    }

    .brand-badge {
      font-size: 0.65rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    /* Tenant Selector */
    .tenant-selector-box {
      padding: 1.125rem 1rem;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .tenant-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: block;
    }

    .btn-link-crear-colegio {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(129, 140, 248, 0.35);
      color: #a5b4fc;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      transition: all 0.2s ease;
      &:hover {
        background: rgba(99, 102, 241, 0.3);
        color: #ffffff;
        border-color: #818cf8;
      }
    }

    .tenant-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(15, 23, 42, 0.6);
      padding: 0.65rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .tenant-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      font-size: 0.95rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .tenant-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      gap: 0.1rem;
    }

    .tenant-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
    }

    .tenant-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .tenant-select-dropdown {
      width: 100%;
      height: 42px;
      background-color: #0f172a;
      color: #f1f5f9;
      border: 1.5px solid #334155;
      padding: 0.55rem 2.25rem 0.55rem 0.85rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.85rem center;
      background-size: 16px;

      &:hover {
        border-color: #6366f1;
        background-color: #1e293b;
      }

      &:focus {
        border-color: #818cf8;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        background-color: #1e293b;
      }

      option {
        background-color: #0f172a;
        color: #f8fafc;
        padding: 0.5rem;
      }
    }

    .tenant-badge-single {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.65rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.28);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #34d399;
      margin-top: 0.45rem;
    }

    .badge-single-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    /* Menu Links */
    .nav-menu {
      padding: 1rem 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: #475569;
      padding: 0.75rem 0.75rem 0.25rem;
      letter-spacing: 0.05em;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      transition: all 150ms ease;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.06);
      color: #f8fafc;
    }

    .nav-link.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15));
      color: #818cf8;
      border-left: 3px solid #6366f1;
    }

    .nav-icon {
      font-size: 1.1rem;
    }

    .badge-mini {
      margin-left: auto;
      font-size: 0.65rem;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      color: white;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 800;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .api-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .footer-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background-color: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .sidebar-logout-btn:hover {
      background-color: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    .sidebar-logout-svg {
      width: 16px;
      height: 16px;
      display: inline-block;
      vertical-align: middle;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .swagger-link {
      color: #38bdf8;
      font-size: 0.75rem;
      text-decoration: none;
      font-weight: 600;
    }

    /* MAIN WRAPPER */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* TOPBAR */
    .topbar {
      height: 64px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .year-badge {
      background-color: #e0e7ff;
      color: #3730a3;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      margin-right: 1rem;
    }

    .system-status {
      font-size: 0.8rem;
      color: #64748b;
    }

    .user-profile-widget {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }



    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      background-color: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .btn-logout:hover {
      background-color: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
    }

    .logout-svg {
      width: 16px;
      height: 16px;
      display: inline-block;
      vertical-align: middle;
    }

    .logout-label {
      font-size: 0.75rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #6366f1;
    }

    /* PAGE CONTENT */
    .page-content {
      padding: 2rem;
      flex: 1;
    }
  `]
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly modalNuevoColegio = signal<boolean>(false);

  constructor() {
    // Forzando SIEMPRE modo claro y limpiando caché de temas anteriores
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }

  onColegioChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selected = this.authService.colegiosDisponibles().find((c) => c.id === selectElement.value);
    
    if (selected) {
      this.authService.setColegio(selected);
    }
  }
}
