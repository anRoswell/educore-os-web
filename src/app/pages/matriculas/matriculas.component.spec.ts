import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatriculasComponent } from './matriculas.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Estudiante } from '../../core/models';

describe('MatriculasComponent (Lifecycle, Validations & OTP Signing)', () => {
  let component: MatriculasComponent;
  let fixture: ComponentFixture<MatriculasComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockEstudiante: Estudiante = {
    id: 'est-001',
    codigoEstudiante: 'EST-2026-001',
    primerNombre: 'Carlos',
    primerApellido: 'Pérez',
    tipoDocumento: 'TI',
    numeroDocumento: '1020304050',
    grado: '10°',
    grupo: '10-A',
    estado: 'MATRICULADO',
  };

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-1', nombre: 'Admin User', rol: 'RECTOR' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé', codigoDane: '111001' }),
    hasRole: () => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatriculasComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatriculasComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar el componente de Matrículas y cargar estudiantes y parámetros académicos', () => {
    const getSpy = vi.spyOn(apiService, 'get').mockImplementation((endpoint: string) => {
      if (endpoint === 'matriculas/estudiantes') return of([mockEstudiante]);
      if (endpoint === 'academico/grados') return of([{ id: 'gr-10', nombre: '10°' }]);
      if (endpoint === 'academico/grupos') return of([{ id: 'gp-10a', nombre: '10-A', gradoId: 'gr-10' }]);
      return of([]);
    });

    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.estudiantes().length).toBe(1);
    expect(component.estudiantes()[0].codigoEstudiante).toBe('EST-2026-001');
    expect(component.gradosList().length).toBe(1);
    expect(component.documentosIdentidadList().length).toBeGreaterThan(0);
    expect(getSpy).toHaveBeenCalled();
  });

  it('2. Debe buscar estudiantes por término de búsqueda en tiempo real', () => {
    const getSpy = vi.spyOn(apiService, 'get').mockReturnValue(of([mockEstudiante]));
    component.searchQuery = 'Pérez';
    component.buscarEstudiantes();

    expect(getSpy).toHaveBeenCalledWith('matriculas/estudiantes', { search: 'Pérez' });
    expect(component.estudiantes().length).toBe(1);
  });

  it('3. Debe validar campos obligatorios antes de formalizar matrícula', () => {
    const toastSpy = vi.spyOn(toastService, 'error');
    const postSpy = vi.spyOn(apiService, 'post');

    // Nombres incompletos
    component.nuevoEstudiante.primerNombre = '';
    component.guardarNuevaMatricula();
    expect(toastSpy).toHaveBeenCalledWith('Campos Requeridos', expect.any(String));
    expect(postSpy).not.toHaveBeenCalled();

    // Grado/Grupo no seleccionado
    component.nuevoEstudiante.primerNombre = 'Juan';
    component.nuevoEstudiante.primerApellido = 'Torres';
    component.nuevoEstudiante.numeroDocumento = '12345678';
    component.nuevoEstudiante.gradoId = '';
    component.nuevoEstudiante.grupoId = '';
    component.guardarNuevaMatricula();
    expect(toastSpy).toHaveBeenCalledWith('Grado y Grupo Requeridos', expect.any(String));
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('4. Debe formalizar nueva matrícula con payload completo y refrescar lista', () => {
    component.nuevoEstudiante = {
      primerNombre: 'Juan',
      segundoNombre: 'David',
      primerApellido: 'Torres',
      segundoApellido: 'Ruiz',
      tipoDocumento: 'TI',
      numeroDocumento: '12345678',
      gradoId: 'gr-10',
      grupoId: 'gp-10a',
      grupoSanguineoRh: 'O+',
      eps: 'Sura EPS',
      telefonoEmergencia: '3001234567',
      nombreAcudiente: 'María Ruiz',
      emailAcudiente: 'maria@correo.com',
      telefonoAcudiente: '3101234567',
    };

    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true, id: 'est-new' }));
    const getSpy = vi.spyOn(apiService, 'get').mockReturnValue(of([mockEstudiante]));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarNuevaMatricula();

    expect(postSpy).toHaveBeenCalledWith('matriculas/formalizar', expect.objectContaining({
      primerNombre: 'Juan',
      primerApellido: 'Torres',
      numeroDocumento: '12345678',
      gradoId: 'gr-10',
    }));
    expect(toastSpy).toHaveBeenCalledWith('¡Matrícula Formalizada!', expect.any(String));
    expect(component.modalNuevaMatricula()).toBe(false);
  });

  it('5. Debe permitir editar información del estudiante y actualizar vía PUT', () => {
    component.abrirModalEdicion(mockEstudiante);
    expect(component.estudianteEnEdicion()).toEqual(mockEstudiante);

    component.estudianteEnEdicion.set({
      ...mockEstudiante,
      primerNombre: 'Carlos Alberto',
    });

    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.guardarEdicion();

    expect(putSpy).toHaveBeenCalledWith('matriculas/estudiantes/est-001', expect.objectContaining({
      primerNombre: 'Carlos Alberto',
    }));
    expect(toastSpy).toHaveBeenCalledWith('¡Actualizado!', expect.any(String));
    expect(component.estudianteEnEdicion()).toBeNull();
  });

  it('6. Debe procesar retiro del estudiante con causal SIMAT y registrar auditoría', () => {
    component.abrirModalRetiro(mockEstudiante);
    expect(component.estudianteParaRetirar()).toEqual(mockEstudiante);

    component.causalRetiro = 'TRASLADO_INSTITUCION';
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'warning');

    component.confirmarRetiro();

    expect(postSpy).toHaveBeenCalledWith('matriculas/estudiantes/est-001/retiro', {
      causal: 'TRASLADO_INSTITUCION',
    });
    expect(toastSpy).toHaveBeenCalledWith('Retiro SIMAT Registrado', expect.stringContaining('Carlos Pérez'));
    expect(component.estudianteParaRetirar()).toBeNull();
  });

  it('7. Debe abrir modal de confirmación y ejecutar despacho de OTP digital', () => {
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ mensaje: 'OTP Enviado al acudiente' }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.enviarAFirma('mat-123');
    expect(component.showConfirmModal()).toBe(true);
    expect(component.confirmModalConfig().title).toContain('Despachar Código OTP');

    // Confirmar
    component.confirmModalConfig().onConfirm();

    expect(component.showConfirmModal()).toBe(false);
    expect(postSpy).toHaveBeenCalledWith('matriculas/mat-123/enviar-firma', {});
    expect(toastSpy).toHaveBeenCalledWith('Enviado', 'OTP Enviado al acudiente');
  });

  it('8. Debe cargar y guardar plantillas legales para contrato y pagaré', () => {
    const mockPlantillas = [
      { tipo: 'CONTRATO_PRESTACION_SERVICIOS', plantillaEjs: '<h1>Contrato</h1>' },
      { tipo: 'PAGARE', plantillaEjs: '<h1>Pagaré</h1>' },
    ];
    vi.spyOn(apiService, 'get').mockReturnValue(of(mockPlantillas));
    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.abrirModalPlantillas();
    expect(component.modalPlantillas()).toBe(true);
    expect(component.plantillaContrato).toBe('<h1>Contrato</h1>');
    expect(component.plantillaPagare).toBe('<h1>Pagaré</h1>');

    component.guardarPlantillas();
    expect(putSpy).toHaveBeenCalledTimes(2);
    expect(toastSpy).toHaveBeenCalledWith('Guardado', expect.any(String));
    expect(component.modalPlantillas()).toBe(false);
  });
});
