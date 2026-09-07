import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParametrosService, Parametro } from './parametros.service';
import { ApiService } from './api.service';

describe('ParametrosService (Web Frontend)', () => {
  let service: ParametrosService;
  let apiServiceMock: any;

  const mockParam: Parametro = {
    id: 'p-1',
    colegioId: 'col-123',
    grupo: 'PORCENTAJES_BECA',
    codigo: 'DEPORTIVA',
    nombre: 'Beca Deportiva',
    valor: '35',
    orden: 1,
    activo: true,
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ParametrosService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(ParametrosService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('obtenerPorGrupo debe invocar api.get con grupo y colegioId opcional', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.get.mockReturnValue(of([mockParam]));

      service.obtenerPorGrupo('PORCENTAJES_BECA', 'col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'PORCENTAJES_BECA',
          colegioId: 'col-123',
        });
        expect(res.length).toBe(1);
        expect(res[0].codigo).toBe('DEPORTIVA');
        resolve();
      });
    });
  });

  it('guardarConfiguracionFinanciera debe hacer PUT a parametros/configuracion-financiera', () => {
    return new Promise<void>((resolve) => {
      const configMock = { tarifaBasePension: 500000, colegioId: 'col-123' };
      apiServiceMock.put.mockReturnValue(of(configMock));

      service.guardarConfiguracionFinanciera({ tarifaBasePension: 500000 }, 'col-123').subscribe((res) => {
        expect(apiServiceMock.put).toHaveBeenCalledWith(
          'parametros/configuracion-financiera',
          { tarifaBasePension: 500000, colegioId: 'col-123' },
        );
        expect(res.tarifaBasePension).toBe(500000);
        resolve();
      });
    });
  });

  it('crearParametro debe hacer POST a parametros', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.post.mockReturnValue(of(mockParam));

      service.crearParametro(mockParam, 'col-123').subscribe((res) => {
        expect(apiServiceMock.post).toHaveBeenCalledWith('parametros', {
          ...mockParam,
          colegioId: 'col-123',
        });
        expect(res.id).toBe('p-1');
        resolve();
      });
    });
  });

  it('actualizarParametro debe hacer PUT a parametros/:id', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.put.mockReturnValue(of(mockParam));

      service.actualizarParametro('p-1', mockParam, 'col-123').subscribe((res) => {
        expect(apiServiceMock.put).toHaveBeenCalledWith('parametros/p-1', {
          ...mockParam,
          colegioId: 'col-123',
        });
        resolve();
      });
    });
  });

  it('eliminarParametro debe hacer DELETE a parametros/:id', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.delete.mockReturnValue(of({ success: true }));

      service.eliminarParametro('p-1', 'col-123').subscribe((res) => {
        expect(apiServiceMock.delete).toHaveBeenCalledWith('parametros/p-1');
        expect(res.success).toBe(true);
        resolve();
      });
    });
  });

  it('restablecerDefecto debe hacer POST a parametros/restablecer-defecto', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.post.mockReturnValue(of({ success: true, count: 3 }));

      service.restablecerDefecto('CONFIGURACION_FINANCIERA', 'col-123').subscribe((res) => {
        expect(apiServiceMock.post).toHaveBeenCalledWith(
          'parametros/restablecer-defecto',
          { grupo: 'CONFIGURACION_FINANCIERA', colegioId: 'col-123' },
        );
        expect(res.count).toBe(3);
        resolve();
      });
    });
  });

  it('obtenerPeriodosEstandar debe invocar obtenerPorGrupo con PERIODOS_ESTANDAR y mapear numero y peso', () => {
    return new Promise<void>((resolve) => {
      const mockPeriodosParam: Parametro = {
        id: 'per-param-1',
        grupo: 'PERIODOS_ESTANDAR',
        codigo: 'PERIODO_1',
        nombre: 'Primer Periodo',
        valor: '25',
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockPeriodosParam]));

      service.obtenerPeriodosEstandar('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'PERIODOS_ESTANDAR',
          colegioId: 'col-123',
        });
        expect(res.length).toBe(1);
        expect(res[0].nombre).toBe('Primer Periodo');
        expect(res[0].numero).toBe(1);
        expect(res[0].peso).toBe(25);
        resolve();
      });
    });
  });

  it('obtenerDocumentosIdentidad debe invocar DOCUMENTOS_IDENTIDAD y parsear aplicaNinos', () => {
    return new Promise<void>((resolve) => {
      const mockDoc: Parametro = {
        id: 'doc-1',
        grupo: 'DOCUMENTOS_IDENTIDAD',
        codigo: 'TI',
        nombre: 'Tarjeta de Identidad',
        valor: JSON.stringify({ aplicaNinos: true }),
        orden: 2,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockDoc]));

      service.obtenerDocumentosIdentidad('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'DOCUMENTOS_IDENTIDAD',
          colegioId: 'col-123',
        });
        expect(res.length).toBe(1);
        expect(res[0].codigo).toBe('TI');
        expect(res[0].aplicaNinos).toBe(true);
        resolve();
      });
    });
  });

  it('obtenerEstadosMatricula debe invocar ESTADOS_MATRICULA y parsear colorHex', () => {
    return new Promise<void>((resolve) => {
      const mockEstado: Parametro = {
        id: 'est-1',
        grupo: 'ESTADOS_MATRICULA',
        codigo: 'MATRICULADO',
        nombre: 'Matriculado Activo',
        valor: JSON.stringify({ colorHex: '#16a34a' }),
        orden: 2,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockEstado]));

      service.obtenerEstadosMatricula('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'ESTADOS_MATRICULA',
          colegioId: 'col-123',
        });
        expect(res.length).toBe(1);
        expect(res[0].colorHex).toBe('#16a34a');
        resolve();
      });
    });
  });

  it('obtenerTiposMatricula debe invocar TIPOS_MATRICULA', () => {
    return new Promise<void>((resolve) => {
      const mockTipo: Parametro = {
        id: 'tip-1',
        grupo: 'TIPOS_MATRICULA',
        codigo: 'NUEVA',
        nombre: 'Estudiante Nuevo',
        valor: 'NUEVA',
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockTipo]));

      service.obtenerTiposMatricula('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'TIPOS_MATRICULA',
          colegioId: 'col-123',
        });
        expect(res.length).toBe(1);
        expect(res[0].codigo).toBe('NUEVA');
        resolve();
      });
    });
  });

  it('obtenerEstadosPago debe invocar ESTADOS_PAGO y parsear colorHex', () => {
    return new Promise<void>((resolve) => {
      const mockItem: Parametro = {
        id: 'pago-1',
        grupo: 'ESTADOS_PAGO',
        codigo: 'APROBADO',
        nombre: 'Aprobado',
        valor: JSON.stringify({ colorHex: '#166534' }),
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockItem]));

      service.obtenerEstadosPago('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros', {
          grupo: 'ESTADOS_PAGO',
          colegioId: 'col-123',
        });
        expect(res[0].colorHex).toBe('#166534');
        resolve();
      });
    });
  });

  it('obtenerMesesEscolares debe invocar MESES_ESCOLARES y parsear mesNum', () => {
    return new Promise<void>((resolve) => {
      const mockItem: Parametro = {
        id: 'mes-1',
        grupo: 'MESES_ESCOLARES',
        codigo: 'FEBRERO',
        nombre: 'Febrero',
        valor: JSON.stringify({ mesNum: 2, abreviatura: 'FEB', diasCobro: 10 }),
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockItem]));

      service.obtenerMesesEscolares('col-123').subscribe((res) => {
        expect(res[0].mesNum).toBe(2);
        expect(res[0].abreviatura).toBe('FEB');
        expect(res[0].diasCobro).toBe(10);
        resolve();
      });
    });
  });

  it('obtenerEscalaDecreto1290 debe invocar ESCALA_DECRETO_1290 y parsear rangoMin/Max', () => {
    return new Promise<void>((resolve) => {
      const mockItem: Parametro = {
        id: 'esc-1',
        grupo: 'ESCALA_DECRETO_1290',
        codigo: 'SUPERIOR',
        nombre: 'Desempeño Superior',
        valor: JSON.stringify({ rangoMin: 4.6, rangoMax: 5.0, colorHex: '#16a34a', bgHex: '#dcfce7', aprobado: true }),
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockItem]));

      service.obtenerEscalaDecreto1290('col-123').subscribe((res) => {
        expect(res[0].rangoMin).toBe(4.6);
        expect(res[0].rangoMax).toBe(5.0);
        expect(res[0].aprobado).toBe(true);
        resolve();
      });
    });
  });

  it('obtenerTiposFaltaLey1620 debe invocar TIPOS_FALTA_LEY_1620 y parsear protocolo', () => {
    return new Promise<void>((resolve) => {
      const mockItem: Parametro = {
        id: 'falta-1',
        grupo: 'TIPOS_FALTA_LEY_1620',
        codigo: 'TIPO_I',
        nombre: 'Situaciones Tipo I',
        valor: JSON.stringify({ protocolo: 'Mediación escolar' }),
        orden: 1,
        activo: true,
      };
      apiServiceMock.get.mockReturnValue(of([mockItem]));

      service.obtenerTiposFaltaLey1620('col-123').subscribe((res) => {
        expect(res[0].protocolo).toBe('Mediación escolar');
        resolve();
      });
    });
  });

  it('obtenerConfiguracionFinanciera debe retornar la configuración devuelta por la API', () => {
    return new Promise<void>((resolve) => {
      const mockConfig = {
        anioLectivoDefecto: 2026,
        tarifaBasePension: 480000,
        diaLimitePagoDefecto: 12,
        diaPagoAcuerdoDefecto: 18,
        cuotasAcuerdoDefecto: 4,
        valorDefaultAcuerdo: 950000,
        moraPorcentajeDefault: 2.5,
        diasGraciaDefault: 7,
      };
      apiServiceMock.get.mockReturnValue(of(mockConfig));

      service.obtenerConfiguracionFinanciera('col-123').subscribe((res) => {
        expect(apiServiceMock.get).toHaveBeenCalledWith('parametros/configuracion-financiera', {
          colegioId: 'col-123',
        });
        expect(res.tarifaBasePension).toBe(480000);
        expect(res.diaLimitePagoDefecto).toBe(12);
        resolve();
      });
    });
  });

  it('obtenerConfiguracionFinanciera debe retornar fallback seguro si la API falla o está vacía', () => {
    return new Promise<void>((resolve) => {
      apiServiceMock.get.mockReturnValue(throwError(() => new Error('Error de red')));

      service.obtenerConfiguracionFinanciera('col-123').subscribe((res) => {
        expect(res.anioLectivoDefecto).toBe(2026);
        expect(res.tarifaBasePension).toBe(450000);
        expect(res.diaLimitePagoDefecto).toBe(10);
        expect(res.moraPorcentajeDefault).toBe(2.0);
        resolve();
      });
    });
  });

  it('obtenerPorcentajesBeca y obtenerMapaPorcentajesBeca deben invocar PORCENTAJES_BECA', () => {
    return new Promise<void>((resolve) => {
      const mockBecas: Parametro[] = [
        { id: 'b-1', grupo: 'PORCENTAJES_BECA', codigo: 'EXCELENCIA', nombre: 'Excelencia (50%)', valor: '50', orden: 1, activo: true },
        { id: 'b-2', grupo: 'PORCENTAJES_BECA', codigo: 'HERMANOS', nombre: 'Hermanos (20%)', valor: '20', orden: 2, activo: true },
      ];
      apiServiceMock.get.mockReturnValue(of(mockBecas));

      service.obtenerMapaPorcentajesBeca('col-123').subscribe((mapa) => {
        expect(mapa['EXCELENCIA']).toBe(50);
        expect(mapa['HERMANOS']).toBe(20);
        resolve();
      });
    });
  });
});
