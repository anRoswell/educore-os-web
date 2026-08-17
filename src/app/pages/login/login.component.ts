import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, COLEGIOS_DEMO } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Columna Izquierda: Showcase de la Plataforma -->
      <div class="showcase-side">
        <div class="brand-badge-box">
          <div class="logo-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-8 h-8">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
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
          <span>EduCoreOS v1.0.0 — Arquitectura Cloud Nativa</span>
        </div>
      </div>

      <!-- Columna Derecha: Tarjeta de Acceso y Demo Picker -->
      <div class="form-side">
        <div class="login-card card card-glass">
          <div class="card-header">
            <h3>Iniciar Sesión</h3>
            <p>Selecciona tu institución educativa y perfil para ingresar</p>
          </div>

          <!-- Selector de Colegio Demo -->
          <div class="form-group">
            <label class="form-label">Institución Educativa (Tenant)</label>
            <select class="form-select" [(ngModel)]="selectedColegioIndex">
              @for (col of colegios; track col.id; let i = $index) {
                <option [value]="i">{{ col.nombre }} — {{ col.ciudad }} ({{ col.plan }})</option>
              }
            </select>
          </div>

          <!-- Acceso Rápido por Roles Demo -->
          <div class="roles-picker-box">
            <span class="roles-label">ACCESO RÁPIDO DEMO POR ROL:</span>
            <div class="roles-grid">
              <button (click)="login('RECTOR')" class="role-btn rector">
                <span class="role-icon">🏛️</span>
                <div class="role-text">
                  <strong>Rectoría</strong>
                  <span>Acceso total & KPIs</span>
                </div>
              </button>

              <button (click)="login('DOCENTE')" class="role-btn docente">
                <span class="role-icon">👩‍🏫</span>
                <div class="role-text">
                  <strong>Docente Titular</strong>
                  <span>Notas & Asistencia</span>
                </div>
              </button>

              <button (click)="login('TESORERO')" class="role-btn tesorero">
                <span class="role-icon">💰</span>
                <div class="role-text">
                  <strong>Tesorería</strong>
                  <span>Cartera & Facturación</span>
                </div>
              </button>

              <button (click)="login('COORDINADOR')" class="role-btn coordinador">
                <span class="role-icon">📋</span>
                <div class="role-text">
                  <strong>Coordinación</strong>
                  <span>Convivencia & Horarios</span>
                </div>
              </button>
            </div>
          </div>

          <div class="divider">
            <span>o ingresa con credenciales</span>
          </div>

          <form (submit)="login('RECTOR')">
            <div class="form-group">
              <label class="form-label">Correo Electrónico Institucional</label>
              <input type="email" class="form-control" value="rectoria@sanbartolome.edu.co" placeholder="usuario@colegio.edu.co" />
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-control" value="••••••••••••" placeholder="Tu contraseña" />
            </div>

            <button type="submit" class="btn btn-primary w-full mt-4">
              Ingresar a la Plataforma
            </button>
          </form>
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

    .showcase-side {
      flex: 1.2;
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      padding: 4rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .brand-badge-box {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-circle {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .brand-badge-box h1 {
      font-size: 2rem;
      color: white;
    }

    .brand-badge-box h1 span {
      color: #818cf8;
    }

    .showcase-content {
      max-width: 580px;
    }

    .hero-tag {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(165, 180, 252, 0.3);
    }

    .showcase-content h2 {
      font-size: 2.5rem;
      color: #ffffff;
      margin-bottom: 1.25rem;
      line-height: 1.2;
    }

    .showcase-content p {
      font-size: 1.1rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .feature-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .pill {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .showcase-footer {
      font-size: 0.8rem;
      color: #64748b;
    }

    .form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-color: #f8fafc;
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      padding: 2.5rem;
      background-color: #ffffff;
      border-radius: 1.25rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      margin-bottom: 1.75rem;
    }

    .card-header h3 {
      font-size: 1.5rem;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .card-header p {
      font-size: 0.875rem;
      color: #64748b;
    }

    .roles-picker-box {
      margin: 1.5rem 0;
      padding: 1rem;
      background-color: #f1f5f9;
      border-radius: 10px;
    }

    .roles-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.75rem;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .role-btn {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 150ms ease;
    }

    .role-btn:hover {
      border-color: #6366f1;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
      transform: translateY(-1px);
    }

    .role-icon {
      font-size: 1.25rem;
    }

    .role-text strong {
      display: block;
      font-size: 0.8rem;
      color: #1e293b;
    }

    .role-text span {
      font-size: 0.65rem;
      color: #64748b;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0;
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }

    .divider span {
      padding: 0 0.75rem;
    }

    .w-full {
      width: 100%;
    }

    .mt-4 {
      margin-top: 1rem;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  readonly colegios = COLEGIOS_DEMO;
  selectedColegioIndex = 0;

  login(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR') {
    this.authService.loginDemo(role, Number(this.selectedColegioIndex));
  }
}
