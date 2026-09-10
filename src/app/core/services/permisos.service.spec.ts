import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { PermisosService, MODULOS_SISTEMA, ROLES_SISTEMA } from './permisos.service';
import { AuthService, COLEGIOS_DEMO } from './auth.service';

describe('PermisosService', () => {
  let service: PermisosService;
  let authService: AuthService;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
      length: 0,
      key: (i: number) => Object.keys(mockStorage)[i] || null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        PermisosService,
        {
          provide: Router,
          useValue: { navigate: () => {} },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    service = TestBed.inject(PermisosService);
  });

  it('1. Debe inicializarse con los 16 módulos de EduCoreOS y catálogo de roles', () => {
    expect(service.modulos().length).toBe(16);
    expect(service.modulos()[0].codigo).toBe('M01');
    expect(service.modulos()[15].codigo).toBe('M16');
    expect(service.roles().length).toBeGreaterThanOrEqual(10);
    expect(service.roles().some((r) => r.codigo === 'SUPER_ADMIN')).toBe(true);
    expect(service.roles().some((r) => r.codigo === 'RECTOR')).toBe(true);
  });

  it('2. Debe verificar permisos por defecto para RECTOR y DOCENTE', () => {
    expect(service.hasPermission('RECTOR', 'ACADEMICO_CALIFICAR')).toBe(true);
    expect(service.hasPermission('RECTOR', 'CONTABILIDAD_VER_REPORTES')).toBe(true);
    expect(service.hasPermission('DOCENTE', 'ACADEMICO_CALIFICAR')).toBe(true);
    expect(service.hasPermission('DOCENTE', 'CONTABILIDAD_VER_REPORTES')).toBe(false);
    expect(service.hasPermission('SUPER_ADMIN', 'CUALQUIER_PERMISO_GLOBAL')).toBe(true);
  });

  it('3. Debe alternar (toggle) un permiso individual para un rol y persistir en storage', () => {
    const estadoInicial = service.hasPermission('DOCENTE', 'IMPORTADOR_EJECUTAR');
    expect(estadoInicial).toBe(false);

    const nuevoEstado = service.togglePermission('DOCENTE', 'IMPORTADOR_EJECUTAR');
    expect(nuevoEstado).toBe(true);
    expect(service.hasPermission('DOCENTE', 'IMPORTADOR_EJECUTAR')).toBe(true);
    expect(mockStorage['educore_permissions_matrix']).toBeTruthy();
  });

  it('4. Debe permitir habilitar o deshabilitar todos los permisos de un módulo para un rol', () => {
    service.toggleModuleForRole('DOCENTE', 'M03', true);
    expect(service.hasPermission('DOCENTE', 'TESORERIA_VER_ESTADOS')).toBe(true);
    expect(service.hasPermission('DOCENTE', 'TESORERIA_FACTURAR_DIAN')).toBe(true);

    service.toggleModuleForRole('DOCENTE', 'M03', false);
    expect(service.hasPermission('DOCENTE', 'TESORERIA_VER_ESTADOS')).toBe(false);
  });

  it('5. Debe restablecer los permisos predeterminados con resetToDefaults', () => {
    service.togglePermission('DOCENTE', 'CONTABILIDAD_CIERRE_FISCAL');
    expect(service.hasPermission('DOCENTE', 'CONTABILIDAD_CIERRE_FISCAL')).toBe(true);

    service.resetToDefaults();
    expect(service.hasPermission('DOCENTE', 'CONTABILIDAD_CIERRE_FISCAL')).toBe(false);
  });

  it('6. Debe activar y desactivar módulos para un colegio específico (Super Admin)', () => {
    const colId = COLEGIOS_DEMO[0].id; // San Bartolome
    expect(service.isModuloActivoEnColegio(colId, 'M04')).toBe(true);

    // Desactivar M04 (Contabilidad) para San Bartolome
    service.toggleModuloColegio(colId, 'M04', false);
    expect(service.isModuloActivoEnColegio(colId, 'M04')).toBe(false);

    // Reactivar M04
    service.toggleModuloColegio(colId, 'M04', true);
    expect(service.isModuloActivoEnColegio(colId, 'M04')).toBe(true);
  });

  it('7. Debe aplicar plantillas de módulos por plan (BASIC, STANDARD, ENTERPRISE)', () => {
    const colId = COLEGIOS_DEMO[1].id;

    // Aplicar Plan BASIC (solo 7 módulos)
    service.setPlanModulosPreset(colId, 'BASIC');
    const colBasic = authService.todosLosColegios().find((c) => c.id === colId);
    expect(colBasic?.modulosActivos.length).toBe(7);
    expect(colBasic?.modulosActivos.includes('M04')).toBe(false);

    // Aplicar Plan ENTERPRISE (16 módulos)
    service.setPlanModulosPreset(colId, 'ENTERPRISE');
    const colEnterprise = authService.todosLosColegios().find((c) => c.id === colId);
    expect(colEnterprise?.modulosActivos.length).toBe(16);
    expect(colEnterprise?.modulosActivos.includes('M04')).toBe(true);
  });
});
