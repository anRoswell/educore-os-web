import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModalBarridoMateriasPerdidasComponent } from './modal-barrido-materias-perdidas.component';
import { AuthService } from '../../../core/services/auth.service';
import { ParametrosService } from '../../../core/services/parametros.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { ApiService } from '../../../core/services/api.service';
import { DiaSemanaNotificacion } from '../../../core/enums';

describe('ModalBarridoMateriasPerdidasComponent (Barrido & Alertas a Padres)', () => {
  let component: ModalBarridoMateriasPerdidasComponent;
  let fixture: ComponentFixture<ModalBarridoMateriasPerdidasComponent>;
  let parametrosService: ParametrosService;
  let toastService: ToastService;
  let modalManager: ModalManagerService;
  let apiService: ApiService;

  const mockColegio = { id: 'col-1', nombre: 'Colegio San Bartolomé', ciudad: 'Bogotá' };
  const mockAuthService = {
    colegio: () => mockColegio,
    colegiosDisponibles: () => [mockColegio],
  };

  const mockConfiguracion = {
    diasNotificacion: [DiaSemanaNotificacion.VIERNES],
    barridoActivo: true,
    horaEnvio: '18:00',
    notaCorteAprobacion: 3.0,
    minimoMateriasPerdidas: 1,
    canalesNotificacion: ['PLATAFORMA_WEB', 'EMAIL'],
    colegioId: 'col-1',
  };

  const mockPrevisualizacion = {
    colegioId: 'col-1',
    configuracion: mockConfiguracion,
    periodoId: 'per-1',
    totalEstudiantesEnRiesgo: 2,
    totalAcudientesContactables: 2,
    estudiantes: [
      {
        estudianteId: 'est-1',
        matriculaId: 'mat-1',
        estudianteNombre: 'Carlos Andrés Pérez',
        documento: '10102020',
        grupoId: 'grp-10a',
        grupoNombre: '10-A',
        periodoId: 'per-1',
        periodoNombre: 'Periodo 1',
        acudienteNombre: 'Rosa Pérez (Madre)',
        acudienteTelefono: '3101112233',
        acudienteEmail: 'rosa@gmail.com',
        materiasPerdidas: [
          {
            asignaturaId: 'asig-mat',
            asignaturaNombre: 'Matemáticas',
            notaPromedio: 2.4,
            desempeno: 'BAJO',
            docenteNombre: 'Profesor X',
          },
        ],
      },
      {
        estudianteId: 'est-2',
        matriculaId: 'mat-2',
        estudianteNombre: 'Lucía Morales',
        documento: '10203040',
        grupoId: 'grp-10a',
        grupoNombre: '10-A',
        periodoId: 'per-1',
        periodoNombre: 'Periodo 1',
        acudienteNombre: 'Pedro Morales (Padre)',
        acudienteTelefono: '3123334455',
        acudienteEmail: 'pedro@gmail.com',
        materiasPerdidas: [
          {
            asignaturaId: 'asig-fis',
            asignaturaNombre: 'Física',
            notaPromedio: 2.7,
            desempeno: 'BAJO',
            docenteNombre: 'Profesor Y',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalBarridoMateriasPerdidasComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ParametrosService,
        ApiService,
        ToastService,
        ModalManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalBarridoMateriasPerdidasComponent);
    component = fixture.componentInstance;
    parametrosService = TestBed.inject(ParametrosService);
    toastService = TestBed.inject(ToastService);
    modalManager = TestBed.inject(ModalManagerService);
    apiService = TestBed.inject(ApiService);

    vi.spyOn(parametrosService, 'obtenerConfiguracionAlertasAcademicas').mockReturnValue(
      of(mockConfiguracion)
    );
    vi.spyOn(apiService, 'get').mockReturnValue(
      of([{ id: 'per-1', nombre: 'Periodo 1' }])
    );
  });

  it('1. Debe inicializar el modal, abrir modalManager y cargar configuración institucional', () => {
    const openSpy = vi.spyOn(modalManager, 'open');
    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(openSpy).toHaveBeenCalledWith('barridoMateriasPerdidas');
    expect(component.formConfig.barridoActivo).toBe(true);
    expect(component.formConfig.diasNotificacion).toContain(DiaSemanaNotificacion.VIERNES);
    expect(component.formConfig.notaCorteAprobacion).toBe(3.0);
    expect(component.listaDias.length).toBe(7);
  });

  it('2. Debe seleccionar, desmarcar y alternar días de la semana correctamente', () => {
    component.ngOnInit();

    // Alternar martes (activar)
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.MARTES)).toBe(false);
    component.toggleDia(DiaSemanaNotificacion.MARTES);
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.MARTES)).toBe(true);

    // Alternar martes (desactivar)
    component.toggleDia(DiaSemanaNotificacion.MARTES);
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.MARTES)).toBe(false);

    // Días hábiles
    component.seleccionarDiasHabiles();
    expect(component.formConfig.diasNotificacion.length).toBe(5);
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.LUNES)).toBe(true);
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.VIERNES)).toBe(true);
    expect(component.isDiaSeleccionado(DiaSemanaNotificacion.DOMINGO)).toBe(false);

    // Todos los días
    component.seleccionarTodosDias();
    expect(component.formConfig.diasNotificacion.length).toBe(7);

    // Ningún día
    component.desmarcarTodosDias();
    expect(component.formConfig.diasNotificacion.length).toBe(0);
  });

  it('3. Debe guardar la parametrización del colegio con feedback de toast', () => {
    component.ngOnInit();
    const saveSpy = vi.spyOn(parametrosService, 'guardarConfiguracionAlertasAcademicas').mockReturnValue(
      of({ ...mockConfiguracion, horaEnvio: '19:00' })
    );
    const toastSpy = vi.spyOn(toastService, 'success');

    component.formConfig.horaEnvio = '19:00';
    component.guardarConfiguracion();

    expect(saveSpy).toHaveBeenCalledWith(component.formConfig, 'col-1');
    expect(toastSpy).toHaveBeenCalledWith('Parametrización de alertas guardada exitosamente');
    expect(component.isSaving()).toBe(false);
  });

  it('4. Debe cargar la previsualización de estudiantes en riesgo y calcular contactabilidad', () => {
    component.ngOnInit();
    vi.spyOn(parametrosService, 'previsualizarBarridoMateriasPerdidas').mockReturnValue(
      of(mockPrevisualizacion)
    );

    component.cambiarTabPrevisualizacion();

    expect(component.tabActivo()).toBe('previsualizacion');
    expect(component.previewData()).toBeTruthy();
    expect(component.previewData()!.totalEstudiantesEnRiesgo).toBe(2);
    expect(component.calcularTasaContactabilidad()).toBe(100);
  });

  it('5. Debe ejecutar el barrido manual y emitir sweepCompleted', () => {
    component.ngOnInit();
    component.previewData.set(mockPrevisualizacion);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const mockResultado = {
      success: true,
      fechaEjecucion: new Date().toISOString(),
      totalEstudiantesAnalizados: 2,
      totalNotificacionesDespachadas: 2,
      mensaje: 'Barrido completado exitosamente. Se procesaron 2 notificaciones.',
      detalles: [],
    };
    vi.spyOn(parametrosService, 'ejecutarBarridoMateriasPerdidas').mockReturnValue(of(mockResultado));
    const sweepSpy = vi.spyOn(component.sweepCompleted, 'emit');

    component.ejecutarBarridoManual();

    expect(component.ultimoResultadoEnvio()).toEqual(mockResultado);
    expect(component.tabActivo()).toBe('reporte');
    expect(sweepSpy).toHaveBeenCalledWith(mockResultado);
  });

  it('6. Debe cerrar el modal y registrar el cierre en ModalManagerService', () => {
    const closeSpy = vi.spyOn(modalManager, 'close');
    const emitSpy = vi.spyOn(component.close, 'emit');

    component.cerrarModal();

    expect(closeSpy).toHaveBeenCalledWith('barridoMateriasPerdidas');
    expect(emitSpy).toHaveBeenCalled();
  });
});
