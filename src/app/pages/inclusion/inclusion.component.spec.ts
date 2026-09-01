import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InclusionComponent, PiarCaracterizacionItem, PiarAjusteItem } from './inclusion.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';

describe('InclusionComponent (PIAR, DUA & Decreto 1421)', () => {
  let component: InclusionComponent;
  let fixture: ComponentFixture<InclusionComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockCaracterizacion: PiarCaracterizacionItem = {
    id: 'piar-001',
    matricula_id: 'mat-001',
    primer_nombre: 'Santiago',
    primer_apellido: 'López',
    numero_documento: '1098765432',
    tipo_documento: 'TI',
    diagnostico_categoria: 'TDAH',
    diagnostico_clinico: 'Trastorno por Déficit de Atención con Hiperactividad',
    estilo_aprendizaje: 'VISUAL',
    barreras_entorno: 'Dificultad de concentración en exposiciones magistrales prolongadas',
    fortalezas_intereses: 'Habilidades destacadas en artes visuales y robótica',
    fecha_elaboracion: '2026-02-15',
    estado: 'ACTIVO',
    total_ajustes_materia: 2,
    tiene_acta_firmada: true,
  };

  const mockAjuste: PiarAjusteItem = {
    id: 'ajuste-001',
    caracterizacion_id: 'piar-001',
    asignatura_nombre: 'Matemáticas',
    periodo_academico: 'Periodo 1',
    objetivos_adaptados: 'Resolución de problemas fraccionarios con material concreto',
    barreras_materia: 'Comprensión de enunciados extensos',
    ajustes_metodologicos: 'Uso de bloques lógicos y esquemas visuales DUA',
    ajustes_evaluativos: 'Tiempo adicional y evaluaciones orales o prácticas',
    estado_avance: 'EN_PROCESO',
  };

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-psi-1', nombre: 'Psicorientadora Laura', rol: 'PSICORIENTADOR' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé' }),
    hasRole: () => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InclusionComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
        ModalManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InclusionComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar y cargar fichas PIAR, estadísticas y entidades médicas', () => {
    vi.spyOn(apiService, 'get').mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('inclusion/caracterizaciones')) return of([mockCaracterizacion]);
      if (endpoint === 'inclusion/estadisticas') return of({ totalPiar: 12, totalAjustes: 24, actasFirmadas: 10, cumplimientoAuditoria: 95 });
      if (endpoint === 'inclusion/entidades-medicas') return of([{ id: 'ent-1', nombre: 'EPS Sura', tipo: 'EPS', ciudad: 'Bogotá' }]);
      if (endpoint === 'convivencia/estudiantes-matriculados') return of([
        { matricula_id: 'mat-001', primer_nombre: 'Santiago', primer_apellido: 'López', numero_documento: '1098' }
      ]);
      return of([]);
    });

    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.caracterizacionesList().length).toBe(1);
    expect(component.estadisticas().totalPiar).toBe(12);
    expect(component.entidadesMedicasList().length).toBe(1);
  });

  it('2. Debe validar campos obligatorios antes de radicar ficha PIAR', () => {
    const toastSpy = vi.spyOn(toastService, 'warning');
    const postSpy = vi.spyOn(apiService, 'post');

    // Sin estudiante
    component.nuevaCaractForm.matriculaId = '';
    component.guardarNuevaCaracterizacion();
    expect(toastSpy).toHaveBeenCalledWith('Estudiante Requerido', expect.any(String));

    // Sin diagnóstico
    component.nuevaCaractForm.matriculaId = 'mat-001';
    component.nuevaCaractForm.diagnosticoClinico = '';
    component.guardarNuevaCaracterizacion();
    expect(toastSpy).toHaveBeenCalledWith('Diagnóstico Requerido', expect.any(String));

    // Sin barreras
    component.nuevaCaractForm.diagnosticoClinico = 'Dislexia';
    component.nuevaCaractForm.barrerasEntorno = '';
    component.guardarNuevaCaracterizacion();
    expect(toastSpy).toHaveBeenCalledWith('Barreras Requeridas', expect.any(String));

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('3. Debe radicar nueva ficha PIAR con datos completos (Anexo 1 Decreto 1421)', () => {
    component.nuevaCaractForm = {
      matriculaId: 'mat-001',
      diagnosticoCategoria: 'TDAH',
      diagnosticoClinico: 'TDAH Mixto diagnosticado',
      entidadMedica: 'EPS Sura',
      profesionalesApoyo: 'Neuropediatra, Terapeuta Ocupacional',
      medicacionTratamientos: 'Metilfenidato 10mg',
      estiloAprendizaje: 'KINESTESICO',
      barrerasEntorno: 'Espacios ruidosos',
      fortalezasIntereses: 'Lógica matemática',
      contextoFamiliar: 'Acompañamiento comprometido por padres',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ id: 'piar-new', ...component.nuevaCaractForm }));
    const toastSpy = vi.spyOn(toastService, 'success');
    vi.spyOn(apiService, 'get').mockReturnValue(of([mockCaracterizacion]));

    component.guardarNuevaCaracterizacion();

    expect(postSpy).toHaveBeenCalledWith('inclusion/caracterizaciones', component.nuevaCaractForm);
    expect(toastSpy).toHaveBeenCalledWith('¡Ficha PIAR Radicada!', expect.any(String));
    expect(component.modalNuevaCaracterizacion()).toBe(false);
  });

  it('4. Debe registrar un ajuste razonable DUA por asignatura', () => {
    component.caracterizacionSeleccionada.set(mockCaracterizacion);
    component.nuevoAjusteForm = {
      asignaturaNombre: 'Lengua Castellana',
      docenteNombre: 'Prof. Martha Ríos',
      periodoAcademico: 'Periodo 1',
      objetivosAdaptados: 'Comprensión lectora mediante audiolibros y mapas mentales',
      barrerasMateria: 'Lectura de textos densos sin apoyos visuales',
      ajustesMetodologicos: 'Segmentación de lecturas y uso de organizadores gráficos',
      ajustesEvaluativos: 'Evaluación formativa continua con rúbricas visuales',
      duaPrincipioRepresentacion: 'Multiples formas de presentación de la información',
      duaPrincipioExpresion: 'Permitir exposiciones orales o infografías',
      duaPrincipioImplicacion: 'Temas alineados con intereses del alumno',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');
    vi.spyOn(apiService, 'get').mockReturnValue(of([]));

    component.guardarNuevoAjuste();

    expect(postSpy).toHaveBeenCalledWith('inclusion/caracterizaciones/piar-001/ajustes', component.nuevoAjusteForm);
    expect(toastSpy).toHaveBeenCalledWith('¡Ajuste Curricular Registrado!', expect.any(String));
    expect(component.modalNuevoAjuste()).toBe(false);
  });

  it('5. Debe filtrar caracterizaciones por texto de búsqueda', () => {
    const listaCompleta = [
      mockCaracterizacion,
      {
        ...mockCaracterizacion,
        id: 'piar-002',
        primer_nombre: 'Valeria',
        primer_apellido: 'Mejía',
        numero_documento: '10203040',
        diagnostico_clinico: 'Hipoacusia bilateral moderada',
      },
    ];

    component.filtroTexto = 'Valeria';
    component.caracterizacionesList.set(listaCompleta);
    expect(component.caracterizacionesFiltradas().length).toBe(1);
    expect(component.caracterizacionesFiltradas()[0].primer_nombre).toBe('Valeria');

    component.filtroTexto = '1098765432';
    component.caracterizacionesList.set([...listaCompleta]);
    expect(component.caracterizacionesFiltradas().length).toBe(1);
    expect(component.caracterizacionesFiltradas()[0].primer_nombre).toBe('Santiago');
  });
});
