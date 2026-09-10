import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComunicacionesComponent } from './comunicaciones.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ComunicadoItem, EstadisticasComunicadoResponse, MensajePrivadoItem } from '../../core/models';

describe('ComunicacionesComponent (Circulares, Trazabilidad & Mensajería)', () => {
  let component: ComunicacionesComponent;
  let fixture: ComponentFixture<ComunicacionesComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockComunicadoWeb: ComunicadoItem = {
    id: 'com-web-001',
    titulo: 'Circular 01: Inicio de Clases',
    contenidoHtml: '<p>Bienvenidos al nuevo año lectivo 2026.</p>',
    tipoPlataforma: 'WEB',
    activo: true,
    prioridad: 'ALTA',
    alcance: 'TODOS',
    requiereFirma: true,
    fechaPublicacion: '2026-02-01T08:00:00.000Z',
    emisor: {
      id: 'usr-1',
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      email: 'rectoria@sanbartolome.edu.co'
    }
  };

  const mockComunicadoMovil: ComunicadoItem = {
    id: 'com-movil-001',
    titulo: 'Boletín Móvil Febrero',
    tipoPlataforma: 'MOVIL',
    activo: true,
    prioridad: 'NORMAL',
    alcance: 'TODOS',
    requiereFirma: false,
    imagenes: [
      {
        id: 'img-1',
        urlAdjunto: 'https://images.unsplash.com/test.jpg',
        formatoVisual: 'IMAGEN_TEXTO',
        orden: 1,
        texto: 'Imagen 1'
      }
    ]
  };

  const mockStats: EstadisticasComunicadoResponse = {
    comunicadoId: 'com-web-001',
    titulo: 'Circular 01: Inicio de Clases',
    alcance: 'TODOS',
    requiereFirma: true,
    totalLecturas: 15,
    totalFirmas: 12,
    ultimasLecturas: [
      {
        id: 'lec-1',
        colegioId: 'col-1',
        comunicadoId: 'com-web-001',
        userId: 'usr-padre-1',
        user: {
          id: 'usr-padre-1',
          nombres: 'María',
          apellidos: 'Rodríguez',
          email: 'maria.rodriguez@gmail.com'
        },
        leidoEn: '2026-02-01T09:30:00.000Z',
        firmadoDigitalmente: true,
        fechaFirma: '2026-02-01T09:31:00.000Z',
        ipLectura: '190.24.12.8'
      }
    ]
  };

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-1', nombre: 'Rector Carlos', email: 'rector@sanbartolome.edu.co' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio Mayor de San Bartolomé', nit: '890.102.345-1' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunicacionesComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComunicacionesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('debe inicializarse correctamente con KPIs en 0 y cargar datos', () => {
    vi.spyOn(apiService, 'get').mockReturnValue(of([mockComunicadoWeb, mockComunicadoMovil]));

    component.ngOnInit();

    expect(component.comunicados().length).toBe(2);
    expect(component.kpiTotalComunicados()).toBe(2);
    expect(component.kpiWebPublicados()).toBe(1);
    expect(component.kpiMovilActivos()).toBe(1);
    expect(component.kpiRequierenFirma()).toBe(1);
  });

  it('debe filtrar comunicados web por término de búsqueda y prioridad', () => {
    component.comunicados.set([
      mockComunicadoWeb,
      {
        id: 'com-web-002',
        titulo: 'Noticia de Deportes',
        contenidoHtml: '<p>Torneo intercolegial</p>',
        tipoPlataforma: 'WEB',
        activo: false,
        prioridad: 'NORMAL',
        alcance: 'TODOS',
        requiereFirma: false
      }
    ]);

    // Filtrar por término
    component.searchTerm.set('Deportes');
    expect(component.comunicadosWebFiltrados().length).toBe(1);
    expect(component.comunicadosWebFiltrados()[0].titulo).toBe('Noticia de Deportes');

    // Filtrar por prioridad
    component.searchTerm.set('');
    component.filtroPrioridad.set('ALTA');
    expect(component.comunicadosWebFiltrados().length).toBe(1);
    expect(component.comunicadosWebFiltrados()[0].prioridad).toBe('ALTA');

    // Limpiar filtros
    component.limpiarFiltros();
    expect(component.searchTerm()).toBe('');
    expect(component.filtroPrioridad()).toBe('TODAS');
    expect(component.comunicadosWebFiltrados().length).toBe(2);
  });

  it('debe abrir el modal de creación inicializando campos según la pestaña activa', () => {
    component.activeTab.set('WEB');
    component.nuevoComunicado();

    expect(component.showModal).toBe(true);
    expect(component.selectedComunicado).not.toBeNull();
    expect(component.selectedComunicado?.tipoPlataforma).toBe('WEB');
    expect(component.selectedComunicado?.prioridad).toBe('NORMAL');

    component.cerrarModal();
    expect(component.showModal).toBe(false);
    expect(component.selectedComunicado).toBeNull();
  });

  it('debe guardar un comunicado web exitosamente llamando al ApiService', () => {
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.nuevoComunicado();
    component.selectedComunicado!.titulo = 'Circular de Prueba';
    component.selectedComunicado!.contenidoHtml = '<p>Contenido</p>';

    component.guardar(true);

    expect(postSpy).toHaveBeenCalledWith('comunicaciones', expect.objectContaining({
      titulo: 'Circular de Prueba',
      activo: true
    }));
    expect(toastSpy).toHaveBeenCalledWith('Comunicado publicado exitosamente');
    expect(component.showModal).toBe(false);
  });

  it('debe abrir el lector oficial de circular y permitir imprimir', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    component.verLector(mockComunicadoWeb);

    expect(component.showReaderModal).toBe(true);
    expect(component.readingComunicado).toEqual(mockComunicadoWeb);

    component.imprimirCircular();
    expect(printSpy).toHaveBeenCalled();

    component.cerrarLector();
    expect(component.showReaderModal).toBe(false);
    expect(component.readingComunicado).toBeNull();
  });

  it('debe abrir modal de estadísticas y consultar métricas de lectura con trazabilidad', () => {
    vi.spyOn(apiService, 'get').mockReturnValue(of(mockStats));

    component.abrirEstadisticas(mockComunicadoWeb);

    expect(component.showStatsModal).toBe(true);
    expect(component.statsData).toEqual(mockStats);
    expect(component.statsData?.totalLecturas).toBe(15);
    expect(component.statsData?.totalFirmas).toBe(12);
    expect(component.statsData?.ultimasLecturas.length).toBe(1);

    component.cerrarEstadisticas();
    expect(component.showStatsModal).toBe(false);
  });

  it('debe alternar estado activo/borrador con toggleEstado', () => {
    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.toggleEstado(mockComunicadoWeb);

    expect(putSpy).toHaveBeenCalledWith('comunicaciones/com-web-001', expect.objectContaining({
      activo: false
    }));
    expect(toastSpy).toHaveBeenCalledWith('Comunicado marcado como borrador');
  });

  it('debe gestionar la redacción y envío de mensajes directos', () => {
    const postSpy = vi.spyOn(apiService, 'post').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'success');

    component.abrirNuevoMensaje();
    expect(component.showNewMessageModal).toBe(true);

    component.nuevoMensaje.asunto = 'Asunto de prueba';
    component.nuevoMensaje.mensaje = 'Mensaje para el docente';

    component.enviarMensajeDirecto();

    expect(postSpy).toHaveBeenCalledWith('comunicaciones/mensajes', expect.objectContaining({
      asunto: 'Asunto de prueba',
      mensaje: 'Mensaje para el docente'
    }));
    expect(toastSpy).toHaveBeenCalledWith('Mensaje directo enviado exitosamente');
    expect(component.showNewMessageModal).toBe(false);
  });

  it('debe gestionar la eliminación de comunicados con modal de confirmación', () => {
    const deleteSpy = vi.spyOn(apiService, 'delete').mockReturnValue(of({ success: true }));

    component.eliminarComunicado('com-web-001');

    expect(component.showConfirmModal).toBe(true);
    expect(component.confirmModalConfig.title).toBe('Eliminar Comunicado');

    // Confirmar eliminación
    component.confirmModalConfig.onConfirm();
    expect(deleteSpy).toHaveBeenCalledWith('comunicaciones/com-web-001');
  });
});
