import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AsistenciaComponent } from './asistencia.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('AsistenciaComponent (Unit & Anti-Regression Tests)', () => {
  let component: AsistenciaComponent;
  let fixture: ComponentFixture<AsistenciaComponent>;
  let apiServiceMock: any;
  let authServiceMock: any;
  let toastServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({ success: true })),
      put: vi.fn().mockReturnValue(of({ success: true })),
      uploadFile: vi.fn().mockReturnValue(of({ url: '/uploads/excusas/test.pdf' })),
    };

    authServiceMock = {
      user: vi.fn().mockReturnValue({
        id: 'usr-1',
        primerNombre: 'Carlos',
        primerApellido: 'Docente',
        role: 'DOCENTE',
      }),
      colegio: vi.fn().mockReturnValue({
        id: 'col-1',
        nombre: 'Colegio Bilingüe de Cartagena',
        nit: '890.100.222-1',
        codigoDane: '113001000123',
        resolucionAprobacion: '1420 de 2024',
        ciudad: 'Cartagena',
      }),
    };

    toastServiceMock = {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AsistenciaComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Debe inicializar el componente con los KPIs y cargas académicas por defecto', () => {
    expect(component).toBeTruthy();
    expect(component.tabActiva()).toBe('tomar_lista');
    expect(component.totalesAsistencia()).toBeDefined();
    expect(component.totalesAsistencia().total).toBeGreaterThanOrEqual(0);
  });

  it('2. Debe calcular los totales de presentismo y porcentaje correctamente', () => {
    component.alumnosLista.set([
      { matriculaId: '1', estudianteNombre: 'Ana Gomez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
      { matriculaId: '2', estudianteNombre: 'Beto Perez', estado: 'RETARDO', minutosRetardo: 15, observacion: '', notificarAcudiente: true },
      { matriculaId: '3', estudianteNombre: 'Carlos Ruiz', estado: 'FALTA_INJUSTIFICADA', minutosRetardo: 0, observacion: '', notificarAcudiente: true },
      { matriculaId: '4', estudianteNombre: 'Diana Diaz', estado: 'FALTA_JUSTIFICADA', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
    ]);

    const totales = component.totalesAsistencia();
    expect(totales.total).toBe(4);
    expect(totales.presentes).toBe(1);
    expect(totales.retardos).toBe(1);
    expect(totales.faltasInjustificadas).toBe(1);
    expect(totales.faltasJustificadas).toBe(1);
    expect(totales.faltas).toBe(2);
    expect(totales.porcentajePresentes).toBe(25);
  });

  it('3. Debe marcar masivamente a todos los alumnos como PRESENTE', () => {
    component.alumnosLista.set([
      { matriculaId: '1', estudianteNombre: 'Ana Gomez', estado: 'FALTA_INJUSTIFICADA', minutosRetardo: 0, observacion: '', notificarAcudiente: true },
      { matriculaId: '2', estudianteNombre: 'Beto Perez', estado: 'RETARDO', minutosRetardo: 15, observacion: '', notificarAcudiente: true },
    ]);

    component.marcarTodos('PRESENTE');
    expect(component.alumnosLista().every(a => a.estado === 'PRESENTE')).toBe(true);
    expect(component.alumnosLista().every(a => !a.notificarAcudiente)).toBe(true);
    expect(toastServiceMock.info).toHaveBeenCalled();
  });

  it('4. Debe filtrar la lista de estudiantes por nombre en tiempo real', () => {
    component.alumnosLista.set([
      { matriculaId: '1', estudianteNombre: 'Felipe García', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
      { matriculaId: '2', estudianteNombre: 'Mariana López', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
    ]);

    component.filtroTexto.set('Felipe');
    expect(component.alumnosFiltrados().length).toBe(1);
    expect(component.alumnosFiltrados()[0].estudianteNombre).toBe('Felipe García');

    component.filtroTexto.set('');
    expect(component.alumnosFiltrados().length).toBe(2);
  });

  it('5. Debe permitir cambiar de fecha y volver a Hoy', () => {
    const hoy = component.getHoy();
    component.cambiarFecha(-1);
    expect(component.fechaActual()).not.toBe(hoy);

    component.irAHoy();
    expect(component.fechaActual()).toBe(hoy);
  });

  it('6. Debe abrir y cerrar el visor de soporte médico', () => {
    component.abrirVisorSoporte('/uploads/excusas/certificado.pdf', 'Soporte Felipe');
    expect(component.modalVisorSoporte().visible).toBe(true);
    expect(component.modalVisorSoporte().esPdf).toBe(true);

    component.cerrarVisorSoporte();
    expect(component.modalVisorSoporte().visible).toBe(false);
  });

  it('7. Debe permitir aprobar y rechazar una excusa médica', () => {
    const excusa = component.excusasList()[0];
    component.aprobarExcusa(excusa);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Incapacidad Aprobada', expect.any(String));

    component.rechazarExcusa(excusa);
    expect(toastServiceMock.info).toHaveBeenCalledWith('Incapacidad Rechazada', expect.any(String));
  });

  it('8. Debe guardar la planilla de asistencia enviando DTO al backend', () => {
    component.cargaDocenteSeleccionada.set('carga-1');
    component.periodoActivoId.set('periodo-1');
    component.alumnosLista.set([
      { matriculaId: 'mat-1', estudianteNombre: 'Ana Gomez', estado: 'PRESENTE', minutosRetardo: 0, observacion: '', notificarAcudiente: false },
    ]);
    component.guardarPlanilla();
    expect(apiServiceMock.post).toHaveBeenCalledWith('asistencia/sesiones/guardar-planilla', expect.any(Object));
  });

  it('9. Debe generar iniciales de estudiantes y colores de avatar consistentes', () => {
    expect(component.getInitials('Felipe García')).toBe('FG');
    expect(component.getInitials('Mariana')).toBe('MA');
    expect(component.getAvatarColor('Felipe García')).toBeDefined();
  });

  it('10. Debe gestionar la selección en cascada de Salón y Estudiante al radicar una incapacidad', () => {
    component.salonesList.set([
      { id: 'salon-1', nombre: '10-A', gradoNombre: 'Grado 10°' },
      { id: 'salon-2', nombre: '11-B', gradoNombre: 'Grado 11°' },
    ]);
    component.salonSeleccionadoExcusa.set('salon-1');

    component.estudiantesSalonExcusa.set([
      { matriculaId: 'mat-101', nombreCompleto: 'Felipe García', documento: '1042345678' },
      { matriculaId: 'mat-102', nombreCompleto: 'Mariana López', documento: '1042345679' },
    ]);

    component.onEstudianteExcusaChange('mat-102');
    expect(component.nuevaExcusa.matriculaId).toBe('mat-102');
    expect(component.nuevaExcusa.estudianteNombre).toBe('Mariana López');
  });
});
