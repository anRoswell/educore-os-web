import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AcademicoComponent } from './academico.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';
import { CalificacionLoteItem } from '../../core/models';

describe('AcademicoComponent (SIEE, Periodos & Promoción)', () => {
  let component: AcademicoComponent;
  let fixture: ComponentFixture<AcademicoComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-1', nombre: 'Admin User', rol: 'RECTOR' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé', codigoDane: '111001' }),
    hasRole: (role: string) => true,
    hasPermission: (permission: string) => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicoComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
        ModalManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicoComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar el componente Académico y cargar catálogos iniciales', () => {
    const mockGrados = [{ id: 'gr-10', nombre: 'Grado 10', numero: 10 }];
    const mockGrupos = [{ id: 'gp-10a', nombre: '10-A', gradoId: 'gr-10' }];
    const mockAsigs = [{ id: 'asig-mat', nombre: 'Matemáticas' }];
    const mockPeriodos = [{ id: 'per-1', nombre: 'Periodo 1', estado: 'ABIERTO' }];

    vi.spyOn(apiService, 'get').mockImplementation((endpoint: string) => {
      if (endpoint === 'academico/grados') return of(mockGrados);
      if (endpoint === 'academico/grupos') return of(mockGrupos);
      if (endpoint === 'academico/asignaturas') return of(mockAsigs);
      if (endpoint === 'academico/periodos') return of(mockPeriodos);
      if (endpoint === 'academico/niveles') return of([{ id: 'niv-sec', nombre: 'Secundaria' }]);
      if (endpoint === 'academico/areas') return of([{ id: 'ar-mat', nombre: 'Matemáticas' }]);
      if (endpoint === 'academico/anios-lectivos') return of([{ id: 'anio-2026', nombre: '2026' }]);
      if (endpoint === 'academico/planilla') return of([]);
      return of([]);
    });

    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.gradosList().length).toBe(1);
    expect(component.todosGruposList().length).toBe(1);
    expect(component.selectedGradoId()).toBe('gr-10');
    expect(component.selectedGrupoId()).toBe('gp-10a');
  });

  it('2. Debe clasificar los desempeños nacionales Decreto 1290 en escala 1.0 a 5.0 (SUPERIOR, ALTO, BASICO, BAJO)', () => {
    const itemSuperior: CalificacionLoteItem = {
      matriculaId: 'm1',
      estudianteNombre: 'Estudiante 1',
      documento: '1001',
      nota: 4.8,
      desempeno: 'BASICO',
      observaciones: '',
    };
    component.recalcularDesempeno(itemSuperior);
    expect(itemSuperior.desempeno).toBe('SUPERIOR');
    expect(component.getBadgeDesempeno(itemSuperior.desempeno)).toContain('badge-success');

    const itemAlto: CalificacionLoteItem = { ...itemSuperior, nota: 4.2 };
    component.recalcularDesempeno(itemAlto);
    expect(itemAlto.desempeno).toBe('ALTO');
    expect(component.getBadgeDesempeno(itemAlto.desempeno)).toContain('badge-info');

    const itemBasico: CalificacionLoteItem = { ...itemSuperior, nota: 3.5 };
    component.recalcularDesempeno(itemBasico);
    expect(itemBasico.desempeno).toBe('BASICO');
    expect(component.getBadgeDesempeno(itemBasico.desempeno)).toContain('badge-warning');

    const itemBajo: CalificacionLoteItem = { ...itemSuperior, nota: 2.4 };
    component.recalcularDesempeno(itemBajo);
    expect(itemBajo.desempeno).toBe('BAJO');
    expect(component.getBadgeDesempeno(itemBajo.desempeno)).toContain('badge-danger');
  });

  it('3. Debe cargar la planilla de calificaciones y redondear las notas a un decimal', () => {
    const mockPlanillaRaw = [
      { matriculaId: 'mat-001', estudianteNombre: 'Ana Gómez', documento: '1001', nota: '4.35', desempeno: 'ALTO', observaciones: 'Excelente' },
      { matriculaId: 'mat-002', estudianteNombre: 'Bernardo Silva', documento: '1002', nota: '2.84', desempeno: 'BAJO', observaciones: 'Plan de mejoramiento' },
    ];

    vi.spyOn(apiService, 'get').mockReturnValue(of(mockPlanillaRaw));
    component.selectedGrupoId.set('gp-10a');
    component.selectedAsignaturaId.set('asig-mat');
    component.selectedPeriodoId.set('per-1');

    component.cargarPlanilla();

    expect(component.planilla().length).toBe(2);
    expect(component.planilla()[0].nota).toBe(4.4); // Redondeo 4.35 -> 4.4
    expect(component.planilla()[1].nota).toBe(2.8); // Redondeo 2.84 -> 2.8
  });

  it('4. Debe guardar planilla de calificaciones en lote por HTTP PUT', () => {
    component.planilla.set([
      { matriculaId: 'mat-001', estudianteNombre: 'Ana Gómez', documento: '1001', nota: 4.5, desempeno: 'ALTO', observaciones: 'Muy buen trabajo' },
    ]);
    component.selectedPeriodoId.set('per-1');

    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of({ mensaje: 'Planilla guardada correctamente en BD.' }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarCalificaciones();

    expect(putSpy).toHaveBeenCalledWith('academico/calificaciones/lote', {
      actividadId: 'fa111111-1111-4111-8111-000000000001',
      periodoId: 'per-1',
      calificaciones: [
        { matriculaId: 'mat-001', nota: 4.5, observaciones: 'Muy buen trabajo' }
      ]
    });
    expect(toastSpy).toHaveBeenCalledWith('¡Planilla Guardada!', expect.stringContaining('Planilla guardada'));
  });

  it('5. Debe abrir modal y crear un nuevo Periodo Académico', () => {
    component.aniosLectivosList.set([{ id: 'anio-2026', nombre: '2026' }]);
    component.periodosList.set([{ id: 'per-1', nombre: 'Periodo 1' }]);
    component.abrirModalNuevoPeriodo();

    expect(component.modalNuevoPeriodo()).toBe(true);
    expect(component.nuevoPeriodo.numero).toBe(2);
    expect(component.nuevoPeriodo.nombre).toBe('Periodo 2');

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ id: 'per-2', nombre: 'Periodo 2', pesoPorcentual: 25 }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarNuevoPeriodo();

    expect(postSpy).toHaveBeenCalledWith('academico/periodos', component.nuevoPeriodo);
    expect(toastSpy).toHaveBeenCalledWith('¡Periodo Creado!', expect.stringContaining('Periodo 2'));
    expect(component.modalNuevoPeriodo()).toBe(false);
  });

  it('6. Debe gestionar las reglas SIEE de promoción escolar', () => {
    component.aniosLectivosList.set([{ id: 'anio-2026', nombre: '2026' }]);
    vi.spyOn(apiService, 'get').mockReturnValue(of([{ materiasReprobadasLimite: 2, notaMinimaAprobacion: 3.5 }]));
    component.abrirModalReglasSiee();

    expect(component.modalReglasSiee()).toBe(true);
    expect(component.reglaSiee.materiasReprobadasLimite).toBe(2);
    expect(component.reglaSiee.notaMinimaAprobacion).toBe(3.5);

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarReglasSiee();

    expect(postSpy).toHaveBeenCalledWith('academico/siee/reglas', component.reglaSiee);
    expect(toastSpy).toHaveBeenCalledWith('Reglas Guardadas', expect.any(String));
    expect(component.modalReglasSiee()).toBe(false);
  });

  it('7. Debe ejecutar procesarCierreAno y descargar el PDF de Acta de Promoción', () => {
    component.aniosLectivosList.set([{ id: 'anio-2026', nombre: '2026' }]);
    const mockBlob = new Blob(['%PDF-1.4 Mock PDF content'], { type: 'application/pdf' });
    const postBlobSpy = vi.spyOn(apiService, 'postBlob').mockReturnValue(of(mockBlob));
    const toastSpy = vi.spyOn(toastService, 'success');

    const mockUrl = 'blob:http://localhost/mock-uuid';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    component.confirmarCierreAnoCheckbox = true;
    component.procesarCierreAno();

    expect(postBlobSpy).toHaveBeenCalledWith('academico/cierre-ano', {
      colegioId: 'auto',
      anioLectivoId: 'anio-2026',
    });
    expect(toastSpy).toHaveBeenCalledWith(
      '✅ Cierre de Año Exitoso',
      expect.stringContaining('Acta de Promoción generada')
    );
    expect(component.modalCierreAno()).toBe(false);
  });

  it('8. Debe filtrar grupos en cascada al cambiar el grado seleccionado', () => {
    component.todosGruposList.set([
      { id: 'gp-10a', nombre: '10-A', gradoId: 'gr-10' },
      { id: 'gp-10b', nombre: '10-B', gradoId: 'gr-10' },
      { id: 'gp-11a', nombre: '11-A', gradoId: 'gr-11' },
    ]);

    component.onGradoChange('gr-10');

    expect(component.selectedGradoId()).toBe('gr-10');
    expect(component.gruposFiltrados().length).toBe(2);
    expect(component.selectedGrupoId()).toBe('gp-10a');

    component.onGradoChange('gr-11');
    expect(component.gruposFiltrados().length).toBe(1);
    expect(component.selectedGrupoId()).toBe('gp-11a');
  });

  it('9. Debe descargar boletines masivos del grupo y validar selección obligatoria', () => {
    const windowSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const toastWarningSpy = vi.spyOn(toastService, 'warning');

    // Sin grupo seleccionado
    component.selectedGrupoId.set('');
    component.descargarBoletinesMasivos();
    expect(toastWarningSpy).toHaveBeenCalledWith('Selección requerida', expect.any(String));

    // Con grupo y periodo
    component.selectedGrupoId.set('gp-10a');
    component.selectedPeriodoId.set('per-1');
    component.descargarBoletinesMasivos();

    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining('academico/boletines/descargar-masivo/gp-10a/periodo/per-1'),
      '_blank'
    );
  });

  it('10. Debe validar dependencia de Nivel al intentar crear un Grado', () => {
    component.nivelesList.set([]);
    component.abrirModalNuevoGrado();

    expect(component.modalNuevoGrado()).toBe(false);
    expect(component.modalAlertaDependencia().visible).toBe(true);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 1: Nivel Educativo');

    // Al haber niveles, sí debe abrir el modal
    component.cerrarAlertaDependencia();
    component.nivelesList.set([{ id: 'niv-1', nombre: 'Básica Secundaria' }]);
    component.abrirModalNuevoGrado();
    expect(component.modalNuevoGrado()).toBe(true);
  });

  it('11. Debe validar dependencias de Año Lectivo y Grado al intentar crear un Grupo', () => {
    component.aniosLectivosList.set([]);
    component.gradosList.set([]);
    component.abrirModalNuevoGrupo();

    expect(component.modalNuevoGrupo()).toBe(false);
    expect(component.modalAlertaDependencia().visible).toBe(true);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 0: Año Lectivo');

    // Con año lectivo pero sin grados
    component.cerrarAlertaDependencia();
    component.aniosLectivosList.set([{ id: 'anio-1', nombre: '2026' }]);
    component.abrirModalNuevoGrupo();

    expect(component.modalNuevoGrupo()).toBe(false);
    expect(component.modalAlertaDependencia().visible).toBe(true);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 2: Grado Escolar');

    // Con año lectivo y grados
    component.cerrarAlertaDependencia();
    component.gradosList.set([{ id: 'gr-10', nombre: '10°' }]);
    component.abrirModalNuevoGrupo();
    expect(component.modalNuevoGrupo()).toBe(true);
  });

  it('12. Debe validar dependencia de Área al intentar crear una Asignatura', () => {
    component.areasList.set([]);
    component.abrirModalNuevaAsignatura();

    expect(component.modalNuevaAsignatura()).toBe(false);
    expect(component.modalAlertaDependencia().visible).toBe(true);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 4: Área');

    // Con área existente
    component.cerrarAlertaDependencia();
    component.areasList.set([{ id: 'ar-1', nombre: 'Ciencias Naturales' }]);
    component.abrirModalNuevaAsignatura();
    expect(component.modalNuevaAsignatura()).toBe(true);
  });

  it('13. Debe validar dependencias completas al intentar crear una Actividad Evaluativa', () => {
    component.periodosList.set([]);
    component.asignaturasList.set([]);
    component.todosGruposList.set([]);

    // Falta Periodo
    component.abrirModalNuevaActividad();
    expect(component.modalNuevaActividad()).toBe(false);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 6: Periodo');

    // Falta Asignatura
    component.cerrarAlertaDependencia();
    component.periodosList.set([{ id: 'per-1', nombre: 'Periodo 1' }]);
    component.abrirModalNuevaActividad();
    expect(component.modalNuevaActividad()).toBe(false);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 5: Asignatura');

    // Falta Grupo
    component.cerrarAlertaDependencia();
    component.asignaturasList.set([{ id: 'asig-1', nombre: 'Física' }]);
    component.abrirModalNuevaActividad();
    expect(component.modalNuevaActividad()).toBe(false);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 3: Grupo');

    // Con todas las dependencias
    component.cerrarAlertaDependencia();
    component.todosGruposList.set([{ id: 'gp-10a', nombre: '10-A' }]);
    component.abrirModalNuevaActividad();
    expect(component.modalNuevaActividad()).toBe(true);
  });

  it('14. Debe validar dependencias de Año Lectivo y Periodos antes de Cierre de Año', () => {
    component.aniosLectivosList.set([]);
    component.periodosList.set([]);

    component.abrirModalCierreAno();
    expect(component.modalCierreAno()).toBe(false);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 0: Año Lectivo');

    component.cerrarAlertaDependencia();
    component.aniosLectivosList.set([{ id: 'anio-1', nombre: '2026' }]);
    component.abrirModalCierreAno();
    expect(component.modalCierreAno()).toBe(false);
    expect(component.modalAlertaDependencia().pasoDependencia).toContain('Paso 6: Periodo');

    component.cerrarAlertaDependencia();
    component.periodosList.set([{ id: 'per-1', nombre: 'Periodo 1' }]);
    component.abrirModalCierreAno();
    expect(component.modalCierreAno()).toBe(true);
  });
});
