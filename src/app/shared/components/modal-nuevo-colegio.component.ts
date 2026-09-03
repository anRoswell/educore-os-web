import { Component, EventEmitter, Input, Output, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { HelpBadgeComponent } from './help-badge.component';

export const LOGOS_PREDETERMINADOS = [
  {
    nombre: 'Escudo Tradicional',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=180&auto=format&fit=crop&q=80',
    icono: '🏛️',
  },
  {
    nombre: 'Campestre & Naturaleza',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=180&auto=format&fit=crop&q=80',
    icono: '🌿',
  },
  {
    nombre: 'Bilingüe & Global',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=180&auto=format&fit=crop&q=80',
    icono: '🌐',
  },
  {
    nombre: 'Ciencia & STEAM',
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=180&auto=format&fit=crop&q=80',
    icono: '🔬',
  },
];

@Component({
  selector: 'app-modal-nuevo-colegio',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpBadgeComponent],
  template: `
    @if (visible()) {
      <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('nuevoColegio')">
        <div class="modal-card card card-glass modal-card-colegio">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <div class="brand-icon-circle">🏫</div>
              <div>
                <h3>Registrar Nueva Institución Educativa</h3>
                <span class="modal-subtitle">Aprovisionamiento Multi-Tenant, Carga de Escudo/Logo y Rectoría</span>
              </div>
            </div>
            <button (click)="cerrar()" class="close-btn" title="Cerrar">&times;</button>
          </div>

          <!-- Body con Layout de 2 Columnas -->
          <div class="modal-body modal-colegio-grid">
            <!-- COLUMNA IZQUIERDA: CARGA DE LOGO INSTITUCIONAL & PREVISUALIZACIÓN -->
            <div class="logo-upload-column">
              <h4 class="column-title">
                <span>🛡️ Escudo / Logo de la Institución *</span>
              </h4>

              <!-- Input de Archivo Oculto Accesible -->
              <input
                #fileInput
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                (change)="onFileSelected($event)"
                style="display: none;"
              />

              <!-- Zona Drag & Drop / File Input -->
              <div
                class="dropzone-box"
                [class.has-image]="!!logoUrl()"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragging.set(false)"
                (drop)="onFileDrop($event)"
                (click)="fileInput.click()"
              >
                @if (logoUrl()) {
                  <div class="logo-preview-active">
                    <div class="preview-img-wrapper" [style.border-color]="form.colorPrimario">
                      <img [src]="logoUrl()" alt="Logo de la Institución" class="preview-img" />
                    </div>
                    <div class="logo-actions" (click)="$event.stopPropagation()">
                      <button type="button" (click)="fileInput.click()" class="btn btn-sm btn-outline-primary upload-btn-label">
                        📁 Cambiar Logo
                      </button>
                      <button type="button" (click)="removerLogo()" class="btn btn-sm btn-danger-soft">
                        🗑️ Quitar
                      </button>
                    </div>
                    <span class="logo-file-status">✓ Logo cargado correctamente</span>
                  </div>
                } @else {
                  <div class="dropzone-empty">
                    <div class="upload-icon-circle">📤</div>
                    <h5>Arrastra el escudo o logo aquí</h5>
                    <p>Formatos admitidos: PNG, JPG, SVG o WebP (Fondo transparente sugerido)</p>
                    <button type="button" class="btn btn-sm btn-primary upload-btn-label">
                      🔍 Seleccionar Archivo
                    </button>
                  </div>
                }
              </div>

              <!-- Escudos Predeterminados Rápidos -->
              <div class="presets-section">
                <span class="presets-label">O selecciona un escudo de plantilla:</span>
                <div class="presets-grid">
                  @for (pre of presets; track pre.nombre) {
                    <button
                      type="button"
                      (click)="seleccionarPreset(pre.url)"
                      class="preset-item"
                      [class.active]="logoUrl() === pre.url"
                      [title]="pre.nombre"
                    >
                      <img [src]="pre.url" [alt]="pre.nombre" class="preset-img" />
                      <span class="preset-name">{{ pre.icono }} {{ pre.nombre }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Vista Previa de la Marca Institucional -->
              <div class="branding-preview-card" [style.border-left-color]="form.colorPrimario">
                <div class="branding-preview-header">
                  <div class="brand-avatar" [style.background-color]="form.colorPrimario">
                    @if (logoUrl()) {
                      <img [src]="logoUrl()" alt="Logo" class="avatar-img" />
                    } @else {
                      {{ form.nombre ? form.nombre.substring(0, 2).toUpperCase() : 'CO' }}
                    }
                  </div>
                  <div class="brand-text-preview">
                    <strong>{{ form.nombre || 'Nombre de la Institución' }}</strong>
                    <span>DANE: {{ form.codigoDane || '111001XXXXXX' }} · {{ form.ciudad || 'Colombia' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMNA DERECHA: DATOS INSTITUCIONALES & RECTORÍA -->
            <div class="fields-column">
              <h4 class="column-title">
                <span>📋 Información Institucional & Legal</span>
              </h4>

              <div class="modal-form-grid">
                <!-- Nombre del Colegio -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Nombre Oficial del Colegio *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.nombre"
                    placeholder="Ej: Colegio Bilingüe San Mateo, Gimnasio Moderno"
                  />
                </div>

                <!-- Código DANE con Glosario -->
                <div class="form-group">
                  <div class="flex-between">
                    <label class="form-label">Código DANE (12 Dígitos) *</label>
                    <app-help-badge term="DANE"></app-help-badge>
                  </div>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.codigoDane"
                    placeholder="Ej: 111001045678"
                    maxlength="12"
                  />
                </div>

                <!-- NIT -->
                <div class="form-group">
                  <label class="form-label">NIT Institucional *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.nit"
                    placeholder="Ej: 900.543.210-1"
                  />
                </div>

                <!-- Ciudad Sede -->
                <div class="form-group">
                  <label class="form-label">Ciudad Sede *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.ciudad"
                    placeholder="Ej: Bogotá D.C., Medellín, Cali"
                  />
                </div>

                <!-- Dirección Sede -->
                <div class="form-group">
                  <label class="form-label">Dirección Sede Principal</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="form.direccion"
                    placeholder="Ej: Calle 127 # 45-20"
                  />
                </div>

                <!-- Colores de Marca -->
                <div class="form-group">
                  <label class="form-label">Color Primario Institucional</label>
                  <div class="color-picker-row">
                    <input type="color" [(ngModel)]="form.colorPrimario" class="color-input" />
                    <input type="text" [(ngModel)]="form.colorPrimario" class="form-control form-control-sm" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Plan EduCoreOS</label>
                  <select class="form-select" [(ngModel)]="form.plan">
                    <option value="ENTERPRISE">⭐ Enterprise (16 Módulos + AI RAG)</option>
                    <option value="STANDARD">✨ Standard (8 Módulos Básicos)</option>
                    <option value="BASIC">🌱 Basic (Académico + Matrículas)</option>
                  </select>
                </div>
              </div>

              <!-- Credenciales del Rector Inicial -->
              <div class="rector-credentials-box mt-3">
                <h5 class="rector-box-title">👤 Usuario Rector / Administrador Principal:</h5>
                <div class="modal-form-grid">
                  <div class="form-group">
                    <label class="form-label">Nombres y Apellidos *</label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      [(ngModel)]="adminForm.nombreCompleto"
                      placeholder="Ej: Dr. Fernando Gómez"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo Institucional (Login) *</label>
                    <input
                      type="email"
                      class="form-control form-control-sm"
                      [(ngModel)]="adminForm.email"
                      placeholder="rectoria@colegio.edu.co"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button (click)="guardarColegio()" class="btn btn-primary btn-lg" [disabled]="guardando()">
              @if (guardando()) {
                <span>⏳ Aprovisionando Tenant...</span>
              } @else {
                <span>💾 Crear Colegio & Activar Tenant</span>
              }
            </button>
            <button (click)="cerrar()" class="btn btn-secondary" [disabled]="guardando()">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-card-colegio {
      max-width: 1040px !important;
      width: 95% !important;
      padding: 1.5rem 1.75rem !important;
      max-height: 94vh !important;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }

    .header-left {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .brand-icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #818cf8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
    }

    .modal-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }

    .modal-colegio-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .column-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 0 0 0.75rem 0;
      padding-bottom: 0.35rem;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* ZONA DE CARGA DE LOGO */
    .dropzone-box {
      border: 2px dashed #cbd5e1;
      border-radius: 14px;
      background: #f8fafc;
      padding: 1.25rem 1rem;
      text-align: center;
      transition: all 0.2s ease;
      cursor: pointer;

      &.has-image {
        border-style: solid;
        border-color: #818cf8;
        background: #f5f3ff;
      }
    }

    .dropzone-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;

      .upload-icon-circle {
        font-size: 1.75rem;
        margin-bottom: 0.25rem;
      }

      h5 {
        font-size: 0.85rem;
        font-weight: 700;
        color: #334155;
        margin: 0;
      }

      p {
        font-size: 0.7rem;
        color: #64748b;
        margin: 0;
        line-height: 1.3;
      }
    }

    .upload-btn-label {
      cursor: pointer;
      margin-top: 0.4rem;
      font-size: 0.75rem;
      padding: 0.35rem 0.85rem;
    }

    .logo-preview-active {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
    }

    .preview-img-wrapper {
      width: 100px;
      height: 100px;
      border-radius: 16px;
      background: #ffffff;
      padding: 6px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      border: 3px solid #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 10px;
    }

    .logo-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-danger-soft {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #fecaca; }
    }

    .logo-file-status {
      font-size: 0.7rem;
      font-weight: 600;
      color: #059669;
    }

    /* PRESETS */
    .presets-section {
      margin-top: 0.75rem;
    }

    .presets-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      display: block;
      margin-bottom: 0.35rem;
    }

    .presets-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
    }

    .preset-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.7rem;
      color: #334155;
      transition: all 0.15s ease;
      text-align: left;

      &:hover, &.active {
        border-color: #6366f1;
        background: #eef2ff;
        color: #4338ca;
        font-weight: 600;
      }
    }

    .preset-img {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      object-fit: cover;
    }

    .preset-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* BRANDING PREVIEW */
    .branding-preview-card {
      margin-top: 0.75rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
      border-radius: 10px;
      padding: 0.65rem 0.85rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    }

    .branding-preview-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .brand-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .brand-text-preview {
      display: flex;
      flex-direction: column;
      min-width: 0;

      strong {
        font-size: 0.75rem;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      span {
        font-size: 0.65rem;
        color: #64748b;
      }
    }

    /* COLOR PICKER ROW */
    .color-picker-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .color-input {
        width: 36px;
        height: 36px;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        cursor: pointer;
      }
    }

    .rector-credentials-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
    }

    .rector-box-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #166534;
      margin: 0 0 0.5rem 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.85rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 1rem;
    }

    @media (max-width: 860px) {
      .modal-colegio-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ModalNuevoColegioComponent {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly modalManager = inject(ModalManagerService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = signal<boolean>(false);
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() colegioCreado = new EventEmitter<any>();

  readonly presets = LOGOS_PREDETERMINADOS;
  readonly isDragging = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly logoUrl = signal<string>('');

  form = {
    nombre: '',
    razonSocial: '',
    nit: '',
    codigoDane: '',
    ciudad: 'Bogotá D.C.',
    direccion: '',
    logoUrl: '',
    colorPrimario: '#4f46e5',
    colorSecundario: '#10b981',
    plan: 'ENTERPRISE' as 'BASIC' | 'STANDARD' | 'ENTERPRISE',
  };

  adminForm = {
    nombreCompleto: '',
    email: '',
  };

  cerrar() {
    this.visible.set(false);
    this.visibleChange.emit(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.procesarArchivo(input.files[0]);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivo(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast.error('El archivo debe ser una imagen válida (PNG, JPG, SVG o WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      this.toast.warning('El tamaño del logo no debe superar los 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Si es un archivo SVG vectorial, se aplica directamente
      if (file.type === 'image/svg+xml') {
        this.aplicarLogo(rawDataUrl);
        return;
      }

      // Para imágenes PNG, JPG, WEBP: redimensionar proporcionalmente a máx 300x300 en un canvas en memoria
      // Esto previene sobrecargar el localStorage y la memoria del navegador
      const img = new Image();
      img.onload = () => {
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.92);
          this.aplicarLogo(optimizedDataUrl);
        } else {
          this.aplicarLogo(rawDataUrl);
        }
      };
      img.onerror = () => {
        this.aplicarLogo(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      this.toast.error('Error al leer el archivo de imagen.');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  private aplicarLogo(url: string) {
    this.form.logoUrl = url;
    this.logoUrl.set(url);
    this.cdr.detectChanges();
    this.toast.success('Escudo institucional cargado exitosamente.');
  }

  seleccionarPreset(url: string) {
    this.form.logoUrl = url;
    this.logoUrl.set(url);
    this.cdr.detectChanges();
    this.toast.info('Plantilla de escudo aplicada.');
  }

  removerLogo() {
    this.form.logoUrl = '';
    this.logoUrl.set('');
    this.cdr.detectChanges();
    this.toast.info('Logo removido.');
  }

  guardarColegio() {
    if (!this.form.nombre.trim()) {
      this.toast.error('El nombre oficial del colegio es obligatorio.');
      return;
    }

    if (!this.form.codigoDane.trim()) {
      this.toast.error('El Código DANE del colegio es obligatorio (12 dígitos).');
      return;
    }

    this.form.logoUrl = this.logoUrl();

    if (!this.form.logoUrl) {
      this.toast.warning('Recuerda cargar el logo o seleccionar un escudo predeterminado.');
    }

    this.guardando.set(true);

    const [nombre, ...apellidos] = this.adminForm.nombreCompleto.split(' ');
    const adminData = {
      nombre: nombre || 'Rector',
      apellido: apellidos.join(' ') || 'General',
      email: this.adminForm.email || `rectoria@${this.form.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.co`,
    };

    const uniqueNit = this.form.nit?.trim() || 
      `90${Math.floor(10 + Math.random() * 90)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`;

    const payload = {
      nombre: this.form.nombre.trim(),
      razonSocial: this.form.razonSocial || this.form.nombre.trim(),
      nit: uniqueNit,
      codigoDane: this.form.codigoDane.trim(),
      ciudad: this.form.ciudad || 'Bogotá D.C.',
      direccion: this.form.direccion || 'Sede Principal',
      colorPrimario: this.form.colorPrimario || '#4f46e5',
      colorSecundario: this.form.colorSecundario || '#10b981',
      logoUrl: this.form.logoUrl,
      plan: this.form.plan || 'ENTERPRISE',
      adminNombre: adminData.nombre,
      adminApellido: adminData.apellido,
      adminEmail: adminData.email,
      adminPassword: 'Password2026*',
    };

    this.api.post<any>('tenants/register', payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        const colegioDb = res?.colegio || {};
        const colegioCreado = this.authService.registrarNuevoColegio(
          {
            ...this.form,
            id: colegioDb.id || ('col-' + Date.now()),
            slug: colegioDb.slug,
          },
          adminData
        );
        this.toast.success(`¡Institución "${colegioCreado.nombre}" aprovisionada exitosamente en PostgreSQL!`);
        this.colegioCreado.emit(colegioCreado);
        this.cerrar();
      },
      error: (err) => {
        console.warn('Registro en API falló o fuera de línea, fallback a almacenamiento local:', err);
        try {
          const creado = this.authService.registrarNuevoColegio(this.form, adminData);
          this.toast.success(`¡Institución "${creado.nombre}" aprovisionada exitosamente con su escudo!`);
          this.colegioCreado.emit(creado);
          this.cerrar();
        } catch (e: any) {
          this.toast.error(e.message || 'Error al aprovisionar el colegio');
        } finally {
          this.guardando.set(false);
        }
      },
    });
  }
}
