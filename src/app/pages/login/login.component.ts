import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModalNuevoColegioComponent } from '../../shared/components/modal-nuevo-colegio.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalNuevoColegioComponent],
  template: `
    <app-modal-nuevo-colegio
      [visible]="modalNuevoColegio"
      (visibleChange)="modalNuevoColegio.set($event)"
      (colegioCreado)="onColegioCreado($event)"
    ></app-modal-nuevo-colegio>

    <div class="login-page">
      <!-- Columna Izquierda: Showcase de la Plataforma (Visible en pantallas grandes) -->
      <div class="showcase-side">
        <!-- Fondo Visual Decorativo Semi-Opaco -->
        <div class="showcase-bg-backdrop">
          <div class="showcase-mesh-grid"></div>
          <img src="assets/educore_os_dashboard.png" alt="EduCoreOS Dashboard Preview" class="showcase-dashboard-bg" />
          <div class="glow-orb orb-purple"></div>
          <div class="glow-orb orb-cyan"></div>
        </div>

        <div class="brand-badge-box">
          <div class="logo-circle">
            <img src="assets/educoreos_logo_transparent.png" alt="EduCoreOS" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />
          </div>
          <h1>EduCore<span>OS</span></h1>
        </div>

        <div class="showcase-content">
          <span class="hero-tag">Ecosistema Educativo Multi-Tenant</span>
          <h2>El Sistema Operativo Definitivo para Colegios e Instituciones</h2>
          <p>
            Plataforma SaaS integral adaptada a la normativa educativa colombiana
            (Ley 115, Decreto 1290, Ley 1620 y Decreto 1421).
          </p>

          <div class="feature-pills">
            <span class="pill">⚡ 16 Módulos Especializados</span>
            <span class="pill">🔒 Aislamiento Multi-Tenant</span>
            <span class="pill">🤖 Inteligencia Artificial RAG</span>
            <span class="pill">💳 Wompi / PSE / DIAN</span>
          </div>
        </div>

        <div class="showcase-footer">
          <span>EduCoreOS v1.0.0 — Desarrollado por <strong>Sectic SAS</strong> | secticsolar.site</span>
        </div>
      </div>

      <!-- Columna Derecha: Tarjeta de Acceso Optimizada y 100% Responsive -->
      <div class="form-side">
        <div class="login-card card card-glass">
          
          <!-- Encabezado Compacto Horizontal -->
          <div class="card-header-compact">
            <div class="header-logo-icon">
              <img src="assets/educoreos_logo_transparent.png" alt="EduCoreOS Logo" />
            </div>
            <div class="header-text-box">
              <h3>Iniciar Sesión en EduCoreOS</h3>
              <p>Selecciona tu institución y perfil para ingresar o usa tus credenciales</p>
            </div>
          </div>

          <!-- Disposición Adaptativa: 2 Columnas en Desktop, 1 Columna en Tablet/Móvil -->
          <div class="card-columns-grid">
            
            <!-- Columna 1: Selección de Tenant y Roles Demo -->
            <div class="col-tenant-roles">
              <!-- Selector de Colegio con Escudo/Logo -->
              <div class="form-group mb-2">
                <div class="flex-between mb-1">
                  <label class="form-label mb-0" style="font-size: 0.78rem; font-weight: 700; color: #334155;">Institución Educativa (Tenant)</label>
                  <button (click)="modalNuevoColegio.set(true)" class="btn-link-action" title="Crear nuevo colegio con logo" style="font-size: 0.72rem;">
                    + Registrar Colegio
                  </button>
                </div>
                
                <div class="colegio-selector-card">
                  <div class="colegio-logo-badge" [style.background-color]="colegios()[selectedColegioIndex]?.colorPrimario || '#4f46e5'">
                    @if (colegios()[selectedColegioIndex]?.logoUrl) {
                      <img [src]="colegios()[selectedColegioIndex]?.logoUrl" alt="Escudo" class="colegio-badge-img" />
                    } @else {
                      {{ colegios()[selectedColegioIndex]?.nombre?.substring(0, 2)?.toUpperCase() }}
                    }
                  </div>
                  <select class="form-select" [(ngModel)]="selectedColegioIndex" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;">
                    @for (col of colegios(); track col.id; let i = $index) {
                      <option [value]="i">{{ col.nombre }} — {{ col.ciudad }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Acceso Rápido por Roles Demo -->
              <div class="roles-picker-box">
                <span class="roles-label">⚡ ACCESO RÁPIDO DEMO POR ROL:</span>
                <div class="roles-grid">
                  <button (click)="login('RECTOR')" class="role-btn rector" type="button">
                    <span class="role-icon">🏛️</span>
                    <div class="role-text">
                      <strong>Rectoría</strong>
                      <span>Acceso total & KPIs</span>
                    </div>
                  </button>

                  <button (click)="login('DOCENTE')" class="role-btn docente" type="button">
                    <span class="role-icon">👩‍🏫</span>
                    <div class="role-text">
                      <strong>Docente Titular</strong>
                      <span>Notas & Asistencia</span>
                    </div>
                  </button>

                  <button (click)="login('TESORERO')" class="role-btn tesorero" type="button">
                    <span class="role-icon">💰</span>
                    <div class="role-text">
                      <strong>Tesorería</strong>
                      <span>Cartera & Pagos</span>
                    </div>
                  </button>

                  <button (click)="login('COORDINADOR')" class="role-btn coordinador" type="button">
                    <span class="role-icon">📋</span>
                    <div class="role-text">
                      <strong>Coordinación</strong>
                      <span>Convivencia & Horarios</span>
                    </div>
                  </button>

                  <button (click)="login('ESTUDIANTE')" class="role-btn estudiante" type="button">
                    <span class="role-icon">👨‍🎓</span>
                    <div class="role-text">
                      <strong>Estudiante / Acudiente</strong>
                      <span>Portal Académico, Pagos & Muro</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Botón Destacado para Registrar Nuevo Colegio -->
              <div class="mt-2 text-center">
                <button (click)="modalNuevoColegio.set(true)" class="btn btn-outline-primary w-full btn-xs" type="button">
                  🏫 ¿Colegio nuevo? Regístralo con su Escudo
                </button>
              </div>
            </div>

            <!-- Columna 2: Ingreso con Credenciales Formulario -->
            <div class="col-credentials">
              <div class="credentials-box">
                <span class="roles-label">🔐 INGRESO CON CREDENCIALES:</span>
                
                <form (submit)="login('RECTOR')">
                  <div class="form-group mb-2">
                    <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Correo Institucional</label>
                    <input type="email" class="form-control form-control-sm" value="rectoria@sanbartolome.edu.co" placeholder="usuario@colegio.edu.co" />
                  </div>

                  <div class="form-group mb-3">
                    <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Contraseña</label>
                    <input type="password" class="form-control form-control-sm" value="••••••••••••" placeholder="Tu contraseña" />
                  </div>

                  <button type="submit" class="btn btn-primary w-full btn-sm">
                    Ingresar a la Plataforma
                  </button>
                </form>

                <div class="security-badge-card">
                  <span class="badge-icon">🛡️</span>
                  <div class="badge-info">
                    <strong>Acceso Seguro Certificado</strong>
                    <span>Cifrado SSL/TLS 256-bit y aislamiento multi-tenant por institución.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Pie Institucional Corporativo Sectic SAS (Siempre visible en Desktop, Tablet y Móvil) -->
          <div class="brand-footer-bar">
            <span>Plataforma SaaS desarrollada por <strong>Sectic SAS</strong></span>
            <span class="footer-dot">•</span>
            <span>sectic&#64;gmail.com</span>
            <span class="footer-dot">•</span>
            <a href="https://secticsolar.site" target="_blank" rel="noopener" class="footer-link">secticsolar.site</a>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
      background-color: #0f172a;
    }

    /* En pantallas grandes mantenemos sin scroll vertical */
    @media (min-width: 1025px) {
      .login-page {
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
      }
      .showcase-side, .form-side {
        height: 100vh;
        overflow-y: auto;
      }
    }

    /* Ocultar la parte izquierda en pantallas medianas y pequeñas */
    @media (max-width: 1024px) {
      .showcase-side {
        display: none !important;
      }
      .form-side {
        flex: 1 !important;
        width: 100% !important;
        min-height: 100vh;
        padding: 1.5rem 1rem !important;
      }
      .login-card {
        max-width: 600px !important;
      }
    }

    .showcase-side {
      flex: 0.95;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 15% 15%, #1e1b4b 0%, #0d1326 50%, #080c18 100%);
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Fondo visual decorativo semi-opaco */
    .showcase-bg-backdrop {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
    }

    .showcase-mesh-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 36px 36px;
      opacity: 0.8;
    }

    .showcase-dashboard-bg {
      position: absolute;
      bottom: -40px;
      right: -60px;
      width: 120%;
      max-width: 820px;
      height: auto;
      opacity: 0.18;
      filter: saturate(1.3) contrast(1.1) drop-shadow(0 25px 50px rgba(0, 0, 0, 0.9));
      transform: perspective(1000px) rotateY(-10deg) rotateX(8deg) scale(0.95);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      mask-image: radial-gradient(circle at 60% 60%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 85%);
      -webkit-mask-image: radial-gradient(circle at 60% 60%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 85%);
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(60px);
    }

    .orb-purple {
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%);
      top: -100px;
      left: -80px;
    }

    .orb-cyan {
      width: 420px;
      height: 420px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(14, 165, 233, 0) 70%);
      bottom: -100px;
      right: -80px;
    }

    .brand-badge-box {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .brand-badge-box h1 {
      font-size: 1.8rem;
      color: white;
      margin: 0;
    }

    .brand-badge-box h1 span {
      color: #818cf8;
    }

    .showcase-content {
      position: relative;
      z-index: 2;
      max-width: 540px;
    }

    .hero-tag {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(165, 180, 252, 0.3);
    }

    .showcase-content h2 {
      font-size: 2.2rem;
      color: #ffffff;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .showcase-content p {
      font-size: 1rem;
      color: #94a3b8;
      line-height: 1.55;
      margin-bottom: 1.5rem;
    }

    .feature-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .pill {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .showcase-footer {
      position: relative;
      z-index: 2;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .showcase-footer strong {
      color: #fbbf24;
    }

    /* Columna Derecha con Formulario */
    .form-side {
      flex: 1.35;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 2rem;
      background-color: #f8fafc;
    }

    .login-card {
      width: 100%;
      max-width: 820px;
      padding: 1.75rem 2.25rem;
      background-color: #ffffff;
      border-radius: 1.25rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.8);
      display: flex;
      flex-direction: column;
    }

    .card-header-compact {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .header-logo-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(67, 56, 202, 0.3));
      border: 1px solid rgba(129, 140, 248, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 3px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .header-logo-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 9px;
    }

    .card-header-compact h3 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.15rem 0;
      letter-spacing: -0.3px;
    }

    .card-header-compact p {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    /* Grid de 2 Columnas Dentro de la Tarjeta */
    .card-columns-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      align-items: stretch;
    }

    .col-tenant-roles {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .roles-picker-box {
      margin: 0.5rem 0 0.75rem 0;
      padding: 0.75rem 0.85rem;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .roles-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.45rem;
    }

    .role-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.55rem;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 150ms ease;
    }

    .role-btn.estudiante {
      grid-column: span 2;
      justify-content: center;
      background-color: #f8fafc;
      border-color: #94a3b8;
    }

    .role-btn:hover {
      border-color: #6366f1;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
      transform: translateY(-1px);
    }

    .role-icon {
      font-size: 1.15rem;
    }

    .role-text strong {
      display: block;
      font-size: 0.75rem;
      color: #1e293b;
      line-height: 1.2;
    }

    .role-text span {
      font-size: 0.62rem;
      color: #64748b;
    }

    /* Columna de Credenciales */
    .col-credentials {
      display: flex;
      flex-direction: column;
    }

    .credentials-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    .security-badge-card {
      margin-top: 1rem;
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 8px;
      padding: 0.55rem 0.75rem;
      display: flex;
      gap: 0.6rem;
      align-items: center;
    }

    .security-badge-card .badge-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .security-badge-card strong {
      display: block;
      font-size: 0.72rem;
      color: #4338ca;
      font-weight: 700;
    }

    .security-badge-card span {
      font-size: 0.62rem;
      color: #64748b;
      line-height: 1.25;
      display: block;
    }

    .colegio-selector-card {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.4rem 0.5rem;
    }

    .colegio-logo-badge {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #4f46e5;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .colegio-badge-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Pie de Marca Corporativa Sectic SAS */
    .brand-footer-bar {
      margin-top: 1.25rem;
      padding-top: 0.85rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      font-size: 0.73rem;
      color: #64748b;
      text-align: center;
    }

    .brand-footer-bar strong {
      color: #4338ca;
      font-weight: 800;
      letter-spacing: -0.2px;
    }

    .footer-dot {
      color: #cbd5e1;
      font-size: 0.6rem;
    }

    .footer-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
      transition: all 150ms ease;
    }

    .footer-link:hover {
      text-decoration: underline;
      color: #3730a3;
    }

    .btn-xs {
      padding: 0.35rem 0.65rem;
      font-size: 0.72rem;
    }

    .w-full {
      width: 100%;
    }

    /* ==========================================================================
       RESPONSIVE ADAPTATIONS (TABLET & MÓVIL)
       ========================================================================== */

    /* Modo Tablet / Pantallas Medianas (< 860px) */
    @media (max-width: 860px) {
      .card-columns-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      .login-card {
        padding: 1.5rem;
        max-width: 520px !important;
      }

      .card-header-compact h3 {
        font-size: 1.25rem;
      }
    }

    /* Modo Móvil (< 560px) */
    @media (max-width: 560px) {
      .form-side {
        padding: 1rem 0.75rem !important;
        align-items: flex-start;
      }

      .login-card {
        padding: 1.2rem 1rem;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      }

      .card-header-compact {
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
      }

      .header-logo-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
      }

      .card-header-compact h3 {
        font-size: 1.15rem;
      }

      .card-header-compact p {
        font-size: 0.75rem;
      }

      .roles-grid {
        grid-template-columns: 1fr;
      }

      .role-btn.estudiante {
        grid-column: span 1;
      }

      .brand-footer-bar {
        font-size: 0.68rem;
        flex-direction: column;
        gap: 0.25rem;
      }

      .footer-dot {
        display: none;
      }
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly colegios = this.authService.colegiosDisponibles;
  selectedColegioIndex = 0;
  readonly modalNuevoColegio = signal<boolean>(false);

  login(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE') {
    this.authService.loginDemo(role, Number(this.selectedColegioIndex));
  }

  onColegioCreado(nuevoColegio: any) {
    this.selectedColegioIndex = 0;
    // Iniciar sesión inmediatamente como rector del nuevo colegio
    this.authService.loginDemo('RECTOR', 0);
  }
}
