import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlossaryService } from '../../core/services/glossary.service';

@Component({
  selector: 'app-glossary-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (glossary.activeTermino()) {
      <div class="glossary-backdrop animate-fade-in" (click)="cerrar()">
        <div class="glossary-card card card-glass" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="glossary-header">
            <div class="header-left">
              <div class="term-icon-circle">{{ glossary.activeTermino()?.icono }}</div>
              <div>
                <div class="badges-row">
                  <span class="category-badge">{{ glossary.activeTermino()?.categoria }}</span>
                  <span class="acronym-badge">{{ glossary.activeTermino()?.sigla }}</span>
                </div>
                <h3>{{ glossary.activeTermino()?.nombreCompleto }}</h3>
              </div>
            </div>
            <button (click)="cerrar()" class="close-btn" title="Cerrar ventana de ayuda">&times;</button>
          </div>

          <!-- Body -->
          <div class="glossary-body">
            <div class="grid-cols-2" style="gap: 1rem;">
              <!-- 1. Explicación Sencilla -->
              <div class="section-card main-explanation">
                <div class="section-title">
                  <span>💡</span>
                  <h4>¿En qué consiste?</h4>
                </div>
                <p>{{ glossary.activeTermino()?.explicacionSencilla }}</p>
              </div>

              <!-- 2. ¿Para qué se usa en EduCoreOS? -->
              <div class="section-card utility-box">
                <div class="section-title">
                  <span>⚙️</span>
                  <h4>¿Por qué te lo pide el sistema?</h4>
                </div>
                <p>{{ glossary.activeTermino()?.utilidadEnSistema }}</p>
              </div>
            </div>

            <!-- 3. Ejemplo si aplica -->
            @if (glossary.activeTermino()?.ejemplo) {
              <div class="section-card example-box mt-3">
                <div class="section-title">
                  <span>📌</span>
                  <h4>Ejemplo práctico</h4>
                </div>
                <p><code>{{ glossary.activeTermino()?.ejemplo }}</code></p>
              </div>
            }

            <!-- 4. Marco Legal -->
            @if (glossary.activeTermino()?.marcoLegal) {
              <div class="legal-footnote mt-3">
                <span>⚖️ <strong>Marco Legal / Normativa:</strong> {{ glossary.activeTermino()?.marcoLegal }}</span>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="glossary-footer">
            <button (click)="cerrar()" class="btn btn-primary">
              ✓ Entendido
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .glossary-backdrop {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000000 !important;
      padding: 1.5rem;
      margin: 0;
    }

    .glossary-card {
      width: 95%;
      max-width: 800px;
      max-height: 92vh;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 20px;
      padding: 1.75rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .glossary-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1.25rem;
    }

    .header-left {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .term-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .badges-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
      align-items: center;
    }

    .category-badge {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .acronym-badge {
      background-color: #e0e7ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .glossary-header h3 {
      font-size: 1.15rem;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.75rem;
      cursor: pointer;
      color: #94a3b8;
      line-height: 1;
      transition: color 150ms ease;
    }

    .close-btn:hover {
      color: #0f172a;
    }

    .glossary-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-card {
      padding: 1rem 1.15rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.4rem;
    }

    .section-title h4 {
      font-size: 0.88rem;
      font-weight: 700;
      margin: 0;
    }

    .section-card p {
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 0;
      color: #334155;
    }

    .main-explanation {
      background-color: #f8fafc;
      border-color: #cbd5e1;
    }

    .main-explanation .section-title h4 {
      color: #1e293b;
    }

    .utility-box {
      background-color: #eef2ff;
      border-color: #c7d2fe;
    }

    .utility-box .section-title h4 {
      color: #3730a3;
    }

    .utility-box p {
      color: #312e81;
    }

    .example-box {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }

    .example-box .section-title h4 {
      color: #166534;
    }

    .example-box code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #dcfce7;
      color: #14532d;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.82rem;
    }

    .legal-footnote {
      font-size: 0.78rem;
      color: #64748b;
      background-color: #f8fafc;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }

    .glossary-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-primary {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 0.65rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background-color 150ms ease;
    }

    .btn-primary:hover {
      background-color: #4338ca;
    }
  `]
})
export class GlossaryModalComponent {
  readonly glossary = inject(GlossaryService);

  cerrar() {
    this.glossary.cerrar();
  }
}
