import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GobiernoEscolarComponent } from './gobierno-escolar.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

describe('GobiernoEscolarComponent (Democracia Digital, Tarjetón & Urna Secreta)', () => {
  let component: GobiernoEscolarComponent;
  let fixture: ComponentFixture<GobiernoEscolarComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockJornadaBackend = {
    id: 'jornada-001',
    nombre: 'Elecciones de Personero Estudiantil 2026',
    cargoEleccion: 'PERSONERO',
    fechaApertura: '2026-03-01T08:00',
    fechaCierre: '2026-03-01T16:00',
    estado: 'ABIERTA',
    candidatos: [
      { id: 'c1', numeroTarjeton: 1, nombreCompleto: 'Laura Restrepo', lemaCampana: 'Unión y Liderazgo', totalVotos: 120 },
      { id: 'c2', numeroTarjeton: 2, nombreCompleto: 'Mateo Osorio', lemaCampana: 'Innovación Escolar', totalVotos: 80 },
      { id: 'c3', numeroTarjeton: 3, nombreCompleto: 'Voto en Blanco', esVotoEnBlanco: true, totalVotos: 10 },
    ],
  };

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-1', nombre: 'Carlos Mendoza', rol: 'ESTUDIANTE' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé' }),
    hasRole: () => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GobiernoEscolarComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GobiernoEscolarComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar y cargar la jornada electoral y candidatos desde la API', () => {
    vi.spyOn(apiService, 'get').mockImplementation((endpoint: string) => {
      if (endpoint === 'gobierno-escolar/jornadas') return of([mockJornadaBackend]);
      if (endpoint.startsWith('gobierno-escolar/escrutinio/')) return of({
        resultados: [
          { candidatoId: 'c1', numeroTarjeton: 1, nombreCompleto: 'Laura Restrepo', totalVotos: 120 },
          { candidatoId: 'c2', numeroTarjeton: 2, nombreCompleto: 'Mateo Osorio', totalVotos: 80 },
          { candidatoId: 'c3', numeroTarjeton: 3, nombreCompleto: 'Voto en Blanco', totalVotos: 10, esVotoEnBlanco: true },
        ],
        resumen: { votosValidos: 210 }
      });
      return of([]);
    });

    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.jornadaActual().id).toBe('jornada-001');
    expect(component.jornadaActual().cargo).toBe('PERSONERO');
    expect(component.candidatos().length).toBe(3);
    expect(component.candidatos()[0].nombre).toBe('Laura Restrepo');
  });

  it('2. Debe calcular el virtual ganador y segundo lugar del escrutinio en tiempo real', () => {
    component.candidatos.set([
      { id: 'c1', numeroTarjeton: 1, nombre: 'Laura Restrepo', lema: 'Lema 1', fotoUrl: '', votos: 150, porcentaje: 60 },
      { id: 'c2', numeroTarjeton: 2, nombre: 'Mateo Osorio', lema: 'Lema 2', fotoUrl: '', votos: 80, porcentaje: 32 },
      { id: 'c3', numeroTarjeton: 3, nombre: 'Voto en Blanco', lema: 'Lema 3', fotoUrl: '', votos: 20, porcentaje: 8, esBlanco: true },
    ]);

    expect(component.virtualGanador()?.nombre).toBe('Laura Restrepo');
    expect(component.segundoLugar()?.nombre).toBe('Mateo Osorio');
  });

  it('3. Debe inscribir un nuevo candidato en el tarjetón', () => {
    component.candidatos.set([
      { id: 'c-blanco', numeroTarjeton: 1, nombre: 'Voto en Blanco', lema: 'Blanco', fotoUrl: '', votos: 0, porcentaje: 0, esBlanco: true },
    ]);

    component.nuevoCandidato = {
      nombre: 'Valentina Morales',
      lema: 'Por una educación transformadora',
    };

    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarNuevoCandidato();

    expect(component.candidatos().length).toBe(2);
    const nuevo = component.candidatos().find(c => c.nombre === 'Valentina Morales');
    expect(nuevo).toBeTruthy();
    expect(nuevo?.numeroTarjeton).toBe(2);
    expect(toastSpy).toHaveBeenCalledWith('¡Candidato Inscrito!', expect.any(String));
    expect(component.modalNuevoCandidato()).toBe(false);
  });

  it('4. Debe emitir voto anónimo, registrar constancia hash SHA-256 y actualizar conteo', () => {
    component.jornadaActual.set({
      id: 'jornada-001',
      nombre: 'Elecciones 2026',
      cargo: 'PERSONERO',
      fechaApertura: '2026-03-01',
      fechaCierre: '2026-03-01',
      estado: 'ABIERTA',
    });

    component.candidatos.set([
      { id: 'c1', numeroTarjeton: 1, nombre: 'Laura Restrepo', lema: '', fotoUrl: '', votos: 10, porcentaje: 100 },
    ]);
    component.totalVotos.set(10);
    component.selectedCandidatoId.set('c1');

    const mockHash = 'sha256-mock-receipt-hash-xyz';
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({
      success: true,
      constanciaVoto: { hashComprobante: mockHash },
    }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.emitirVoto();

    expect(postSpy).toHaveBeenCalledWith('gobierno-escolar/votar', {
      jornadaId: 'jornada-001',
      candidatoId: 'c1',
    });
    expect(component.votoComprobante()).toBe(mockHash);
    expect(component.totalVotos()).toBe(11);
    expect(component.candidatos()[0].votos).toBe(11);
    expect(toastSpy).toHaveBeenCalledWith('¡Sufragio Exitoso!', expect.stringContaining('SHA-256'));
  });

  it('5. Debe cerrar y sellar las urnas impidiendo emitir nuevos votos', () => {
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'warning');

    component.abrirModalCerrarJornada();
    expect(component.modalCerrarJornada()).toBe(true);

    component.confirmarCierreJornada();
    expect(component.jornadaActual().estado).toBe('CERRADA');
    expect(postSpy).toHaveBeenCalledWith('gobierno-escolar/jornadas/jornadaActualId/cerrar'.replace('jornadaActualId', component.jornadaActual().id), {});
    expect(toastSpy).toHaveBeenCalledWith('¡Votaciones Finalizadas!', expect.any(String));

    // Intentar emitir voto con urnas cerradas
    const toastErrorSpy = vi.spyOn(toastService, 'error');
    component.selectedCandidatoId.set('c1');
    component.emitirVoto();
    expect(toastErrorSpy).toHaveBeenCalledWith('Urnas Cerradas', expect.any(String));
  });

  it('6. Debe permitir reabrir jornada electoral', () => {
    component.jornadaActual.set({
      id: 'jornada-001',
      nombre: 'Elecciones 2026',
      cargo: 'PERSONERO',
      fechaApertura: '2026-03-01',
      fechaCierre: '2026-03-01',
      estado: 'CERRADA',
    });

    const toastSpy = vi.spyOn(toastService, 'info');
    component.reabrirJornada();

    expect(component.jornadaActual().estado).toBe('ABIERTA');
    expect(toastSpy).toHaveBeenCalledWith('Urnas Reabiertas', expect.any(String));
  });
});
