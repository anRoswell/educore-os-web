import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConvivenciaComponent, CasoConvivenciaItem, ActaComiteItem } from './convivencia.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';

describe('ConvivenciaComponent (Ley 1620, Descargos & Comité)', () => {
  let component: ConvivenciaComponent;
  let fixture: ComponentFixture<ConvivenciaComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockCaso: CasoConvivenciaItem = {
    id: 'caso-001',
    matricula_id: 'mat-001',
    primer_nombre: 'Felipe',
    primer_apellido: 'García',
    numero_documento: '1098765432',
    tipo_falta: 'TIPO_II',
    descripcion_hechos: 'Situación reiterada de acoso escolar en recreo',
    lugar_hechos: 'Patio escolar',
    fecha_hechos: '2026-08-25',
    estado: 'EN_DESCARGOS',
  };

  const mockActa: ActaComiteItem = {
    id: 'acta-001',
    numero_acta: 'ACTA-CCE-2026-01',
    fecha_reunion: '2026-08-28',
    decisiones_adoptadas: 'Activación de ruta de mediación y seguimiento semanal',
    compromisos_adquiridos: 'Acompañamiento por psicorientación',
  };

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-coord-1', nombre: 'Coordinador Juan', rol: 'COORDINADOR' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé' }),
    hasRole: () => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvivenciaComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
        ModalManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConvivenciaComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar y cargar casos, actas, métricas SIUCE y estudiantes', () => {
    vi.spyOn(apiService, 'get').mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('convivencia/casos')) return of({ casos: [mockCaso] });
      if (endpoint.startsWith('convivencia/actas-comite')) return of({ actas: [mockActa] });
      if (endpoint === 'convivencia/metricas-siuce') return of({ total_anotaciones: 5, casos_cerrados: 3, casos_abiertos: 2 });
      if (endpoint === 'convivencia/estudiantes-matriculados') return of([
        { matricula_id: 'mat-001', primer_nombre: 'Felipe', primer_apellido: 'García', numero_documento: '1098' }
      ]);
      return of([]);
    });

    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.casosList().length).toBe(1);
    expect(component.actasList().length).toBe(1);
    expect(component.metricas().total_anotaciones).toBe(5);
    expect(component.estudiantesList().length).toBe(1);
  });

  it('2. Debe radicar nuevo caso de convivencia (Tipo I, II, III) según Ley 1620', () => {
    component.nuevoCasoForm = {
      matriculaId: 'mat-001',
      tipoFalta: 'TIPO_II',
      articuloManualConvivencia: 'Art. 45 Inciso B',
      descripcionHechos: 'Presunto matoneo digital',
      lugarHechos: 'Entorno digital',
      fechaHechos: '2026-08-30',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true, id: 'caso-002' }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarNuevoCaso();

    expect(postSpy).toHaveBeenCalledWith('convivencia/casos', component.nuevoCasoForm);
    expect(toastSpy).toHaveBeenCalledWith('¡Anotación Radicada!', expect.stringContaining('Ley 1620'));
    expect(component.modalNuevoCaso()).toBe(false);
  });

  it('3. Debe radicar versión de descargos del estudiante dentro del término de debido proceso', () => {
    component.casoSeleccionado.set(mockCaso);
    component.nuevoDescargoForm = {
      versionHechos: 'El estudiante manifiesta que no participó en la agresión física.',
      urlPruebasAdjuntas: 'https://storage/evidencia.pdf',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ mensaje: 'Descargos radicados exitosamente.' }));
    const toastSpy = vi.spyOn(toastService, 'success');
    vi.spyOn(apiService, 'get').mockReturnValue(of(mockCaso));

    component.guardarDescargo();

    expect(postSpy).toHaveBeenCalledWith('convivencia/casos/caso-001/descargos', expect.objectContaining({
      urlPruebasAdjuntas: 'https://storage/evidencia.pdf',
    }));
    expect(toastSpy).toHaveBeenCalledWith('¡Descargos Radicados!', expect.any(String));
    expect(component.nuevoDescargoForm.versionHechos).toBe('');
  });

  it('4. Debe actualizar el estado del caso y asignar medida formativa pedagógica', () => {
    component.casoSeleccionado.set(mockCaso);
    component.estadoActualizarInput = 'CONCILIACION';
    component.medidaFormativaInput = 'Actividad pedagógica reflexiva y disculpas públicas';

    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.actualizarEstadoCaso();

    expect(putSpy).toHaveBeenCalledWith('convivencia/casos/caso-001', {
      estado: 'CONCILIACION',
      medidaFormativa: 'Actividad pedagógica reflexiva y disculpas públicas',
    });
    expect(toastSpy).toHaveBeenCalledWith('¡Caso Actualizado!', expect.stringContaining('CONCILIACION'));
    expect(component.casoSeleccionado()).toBeNull();
  });

  it('5. Debe registrar acta oficial de reunión del Comité de Convivencia Escolar', () => {
    component.nuevaActaForm = {
      numeroActa: 'ACTA-CCE-2026-02',
      fechaReunion: '2026-08-30',
      decisionesAdoptadas: 'Cierre de caso por conciliación voluntaria',
      compromisosAdquiridos: 'Seguimiento por psicología durante 30 días',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarNuevaActa();

    expect(postSpy).toHaveBeenCalledWith('convivencia/actas-comite', component.nuevaActaForm);
    expect(toastSpy).toHaveBeenCalledWith('¡Acta Registrada!', expect.stringContaining('ACTA-CCE-2026-02'));
    expect(component.modalNuevaActa()).toBe(false);
  });

  it('6. Debe reenviar notificación disciplinaria oficial al acudiente con trazabilidad', () => {
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.reenviarNotificacion('caso-001');
    expect(component.showConfirmModal()).toBe(true);

    // Confirmar envío
    component.confirmModalConfig().onConfirm();

    expect(component.showConfirmModal()).toBe(false);
    expect(postSpy).toHaveBeenCalledWith('convivencia/faltas/caso-001/notificar-acudiente', {
      ejecutadoPor: 'usr-coord-1',
    });
    expect(toastSpy).toHaveBeenCalledWith('Enviado', 'La notificación fue enviada exitosamente.');
  });

  it('7. Debe calcular la tasa de resolución de casos disciplinarios', () => {
    component.casosList.set([
      { ...mockCaso, id: 'c1', estado: 'CERRADO' },
      { ...mockCaso, id: 'c2', estado: 'CONCILIACION' },
      { ...mockCaso, id: 'c3', estado: 'ABIERTO' },
      { ...mockCaso, id: 'c4', estado: 'EN_DESCARGOS' },
    ]);

    // 2 de 4 cerrados/conciliados = 50%
    expect(component.calcularTasaResolucion()).toBe(50);
  });
});
