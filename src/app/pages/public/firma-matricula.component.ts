import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-firma-matricula',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="public-container">
      <div class="card shadow-lg mx-auto" style="max-width: 600px; margin-top: 5vh; padding: 2rem;">
        <div class="text-center mb-4">
          <h2>Firma de Contrato y Pagaré</h2>
          <p class="text-muted">Por favor ingrese el código PIN de 6 dígitos enviado a su correo para legalizar la matrícula.</p>
        </div>

        @if (successMessage()) {
          <div class="alert alert-success text-center">
            <strong>✅ ¡Matrícula Legalizada!</strong><br>
            {{ successMessage() }}
          </div>
        } @else {
          <!-- Preview Box del Contrato -->
          <div class="pdf-preview-box mb-4 p-3 border rounded bg-light" style="max-height: 200px; overflow-y: auto;">
            <p class="text-center text-muted"><small>📄 Previsualización del Contrato y Pagaré inyectado...</small></p>
            <p><strong>Cláusula 1:</strong> El colegio se compromete a prestar el servicio educativo...</p>
            <p><strong>Cláusula 2:</strong> El acudiente se compromete a realizar el pago puntual...</p>
          </div>

          <div class="form-group mb-3">
            <label>Código de Seguridad (PIN)</label>
            <input type="text" [(ngModel)]="pin" class="form-control text-center" placeholder="Ej: 123456" maxlength="6" style="font-size: 2rem; letter-spacing: 10px;">
          </div>
          
          @if (errorMessage()) {
            <div class="alert alert-danger">{{ errorMessage() }}</div>
          }

          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" id="checkTerms" [(ngModel)]="aceptaTerminos">
            <label class="form-check-label" for="checkTerms">
              Declaro haber leído y aceptado los términos del contrato de prestación de servicios educativos y el pagaré.
            </label>
          </div>

          <button class="btn btn-primary w-100 mt-2" [disabled]="loading() || pin.length !== 6 || !aceptaTerminos" (click)="validarFirma()">
            {{ loading() ? 'Validando y Sellando...' : 'Firmar y Finalizar Matrícula' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .public-container { min-height: 100vh; background: #f3f4f6; padding: 20px; font-family: 'Inter', sans-serif; }
    .card { background: white; border-radius: 12px; }
  `]
})
export class FirmaMatriculaComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  pin = '';
  aceptaTerminos = false;
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  matriculaId = this.route.snapshot.queryParamMap.get('matriculaId') || '';

  validarFirma() {
    if (!this.matriculaId) {
      this.errorMessage.set('Enlace inválido. Falta el identificador de la matrícula.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.api.post<any>('matriculas/public/firmar-contrato', {
      matriculaId: this.matriculaId,
      pin: this.pin
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.mensaje);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Código PIN inválido o expirado.');
      }
    });
  }
}
