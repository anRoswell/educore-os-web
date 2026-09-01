import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { DocumentalComponent, VistaDocumental, TipoFirmaTab } from './documental.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('DocumentalComponent (Flujos BPM & Vault de Firmas Frontend)', () => {
  let component: DocumentalComponent;
  let fixture: ComponentFixture<DocumentalComponent>;

  const mockFlujos = [
    {
      id: 'flujo-1',
      codigo: 'FLUJO_SALIDA_PEDAGOGICA',
      nombre: 'Aprobación de Salida Pedagógica',
      descripcion: 'Circuito de autorización de salidas escolares',
      categoria: 'ACADEMICO',
      icono: '🚌',
      colorHex: '#3b82f6',
      formularioSchema: [
        { campo: 'destino', etiqueta: 'Lugar o Destino', tipo: 'TEXTO', requerido: true },
      ],
      etapas: [
        {
          id: 'etapa-1',
          orden: 1,
          nombre: 'Revisión Coordinación',
          descripcion: 'Verificación de objetivos',
          rolResponsable: 'COORDINADOR_ACADEMICO',
          tipoAccion: 'APROBACION_SIMPLE',
          slaHoras: 24,
          requiereFirma: false,
          requiereAdjunto: false,
          descripcionAdjunto: undefined,
        },
      ],
    },
  ];

  const mockInstancias = [
    {
      id: 'inst-1',
      consecutivoRadicado: 'RAD-2026-0001',
      estado: 'EN_TRAMITE' as const,
      flujo: mockFlujos[0],
      etapaActual: mockFlujos[0].etapas[0],
      solicitante: { nombres: 'Diana', apellidos: 'Gómez', email: 'diana@educore.io' },
      datosFormulario: { destino: 'Parque Jaime Duque' },
      trazabilidad: [],
      createdAt: '2026-08-15T12:00:00Z',
    },
  ];

  const mockApiService = {
    get: vi.fn((url: string) => {
      if (url.includes('flujos')) return of(mockFlujos);
      if (url.includes('instancias')) return of(mockInstancias);
      if (url.includes('firmas-usuario')) return of([]);
      return of([]);
    }),
    post: vi.fn().mockReturnValue(of({ success: true, mensaje: 'OK' })),
  };

  const mockAuthService = {
    user: () => ({ id: 'user-1', nombres: 'Admin', email: 'admin@educore.io' }),
    colegio: () => ({ id: 'col-1', nombre: 'Test', logoUrl: '' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentalComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Debe inicializar el componente de gestión documental', () => {
    expect(component).toBeTruthy();
    expect(component.vistaActiva()).toBe(VistaDocumental.KANBAN);
  });

  it('2. Debe cargar los flujos y trámites en curso desde el backend', () => {
    expect(component.flujos().length).toBe(1);
    expect(component.instancias().length).toBe(1);
    expect(component.instanciasFiltradas().length).toBe(1);
  });

  it('3. Debe filtrar los trámites por estado en el Kanban', () => {
    component.filtroEstado.set('APROBADO_FINAL');
    expect(component.instanciasFiltradas().length).toBe(0);

    component.filtroEstado.set('EN_TRAMITE');
    expect(component.instanciasFiltradas().length).toBe(1);
  });

  it('4. Debe seleccionar un flujo y preparar el formulario dinámico', () => {
    component.seleccionarFlujo(mockFlujos[0]);
    expect(component.flujoSeleccionado()?.codigo).toBe('FLUJO_SALIDA_PEDAGOGICA');
    expect(component.formData()['destino']).toBe('');
  });

  it('5. Debe alternar entre dibujo en pantalla y carga de imagen en el Vault de Firmas', () => {
    component.vistaActiva.set(VistaDocumental.FIRMAS_VAULT);
    expect(component.tipoFirmaTab()).toBe(TipoFirmaTab.TRAZO);

    component.tipoFirmaTab.set(TipoFirmaTab.IMAGEN);
    expect(component.tipoFirmaTab()).toBe(TipoFirmaTab.IMAGEN);
  });

  it('6. Debe calcular métricas de trámites activos, pendientes y completados', () => {
    const metricas = component.metricasTramites();
    expect(metricas.activos).toBe(1);
    expect(metricas.pendientesFirma).toBe(0);
    expect(metricas.completados).toBe(0);
  });

  it('7. Debe cambiar a la pestaña TRD y formatear secciones y disposiciones', () => {
    component.vistaActiva.set(VistaDocumental.TRD);
    expect(component.vistaActiva()).toBe('TRD');
    expect(component.formatSeccion('SECRETARIA_ACADEMICA')).toBe('Secretaría Académica');
    expect(component.formatDisposicion('CONSERVACION_TOTAL')).toBe('Conservación Total (CT)');
  });

  it('8. Debe filtrar subseries TRD por sección productora', () => {
    component.trdSeries.set([
      {
        id: 'trd-1',
        seccion: 'SECRETARIA_ACADEMICA',
        codigoSerie: '100',
        nombreSerie: 'LIBROS Y REGISTROS',
        codigoSubserie: '100.01',
        nombreSubserie: 'Libros de Calificaciones',
        retencionGestionAnios: 2,
        retencionCentralAnios: 100,
        disposicionFinal: 'CONSERVACION_TOTAL',
        soporte: 'ELECTRONICO',
        activa: true,
        createdAt: '2026-08-15',
      },
      {
        id: 'trd-2',
        seccion: 'TESORERIA',
        codigoSerie: '500',
        nombreSerie: 'CONTABILIDAD',
        codigoSubserie: '500.01',
        nombreSubserie: 'Comprobantes de Pago',
        retencionGestionAnios: 1,
        retencionCentralAnios: 5,
        disposicionFinal: 'ELIMINACION',
        soporte: 'ELECTRONICO',
        activa: true,
        createdAt: '2026-08-15',
      },
    ]);

    expect(component.trdSeriesFiltradas().length).toBe(2);

    component.filtrarTrd('SECRETARIA_ACADEMICA');
    expect(component.trdSeriesFiltradas().length).toBe(1);
    expect(component.trdSeriesFiltradas()[0].codigoSerie).toBe('100');
  });
});
