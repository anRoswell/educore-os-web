import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-firma-disciplinaria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="public-container">
      <div class="card shadow-lg mx-auto" style="max-width: 500px; margin-top: 10vh; padding: 2rem;">
        <div class="text-center mb-4">
          <h2>Firma Electrónica de Notificación</h2>
          <p class="text-muted">Por favor ingrese el código PIN de 6 dígitos que enviamos a su correo electrónico para firmar y validar el acta disciplinaria.</p>
        </div>

        @if (successMessage()) {
          <div class="alert alert-success text-center">
            <strong>✅ ¡Firma Validada con Éxito!</strong><br>
            {{ successMessage() }}
          </div>
        } @else {
          <div class="form-group mb-3">
            <label>Código de Seguridad (PIN)</label>
            <input type="text" [(ngModel)]="pin" class="form-control text-center" placeholder="Ej: 123456" maxlength="6" style="font-size: 2rem; letter-spacing: 10px;">
          </div>
          
          @if (errorMessage()) {
            <div class="alert alert-danger">{{ errorMessage() }}</div>
          }

          <button class="btn btn-primary w-100 mt-3" [disabled]="loading() || pin.length !== 6" (click)="validarFirma()">
            {{ loading() ? 'Validando...' : 'Firmar Acta' }}
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
export class FirmaDisciplinariaComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  pin = '';
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  casoId = this.route.snapshot.queryParamMap.get('casoId') || '';

  validarFirma() {
    if (!this.casoId) {
      this.errorMessage.set('Enlace inválido. Falta el identificador del caso.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.api.post<any>(`convivencia/public/firmar-acta`, {
      casoId: this.casoId,
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
