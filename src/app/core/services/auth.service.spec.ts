import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, COLEGIOS_DEMO } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
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

    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('1. Debe inicializarse con usuario demo por defecto y colegio configurado', () => {
    expect(service.user()).toBeTruthy();
    expect(service.user()?.role).toBe('RECTOR');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.colegio().nombre).toBe(COLEGIOS_DEMO[0].nombre);
  });

  it('2. Debe permitir cambiar de colegio activo y persistir en localStorage', () => {
    const segundoColegio = COLEGIOS_DEMO[1];
    service.setColegio(segundoColegio);

    expect(service.colegio().id).toBe(segundoColegio.id);
    expect(mockStorage['educore_colegio_id']).toBe(segundoColegio.id);
    expect(mockStorage['educore_colegio_slug']).toBe(segundoColegio.slug);
  });

  it('3. Debe verificar roles jerárquicos con hasRole', () => {
    // Cuando el usuario es RECTOR, hasRole debe retornar true para cualquier rol o SUPER_ADMIN/RECTOR
    expect(service.hasRole('DOCENTE')).toBe(true);
    expect(service.hasRole('RECTOR')).toBe(true);
    expect(service.hasRole('COORDINADOR')).toBe(true);

    // Cambiar a DOCENTE
    service.loginDemo('DOCENTE', 0);
    expect(service.user()?.role).toBe('DOCENTE');
    expect(service.hasRole('DOCENTE')).toBe(true);
    expect(service.hasRole('TESORERO')).toBe(false);

    // Cuando no hay usuario autenticado
    service.logout();
    expect(service.hasRole('DOCENTE')).toBe(false);
  });

  it('4. Debe verificar permisos institucionales con hasPermission', () => {
    // RECTOR tiene permisos globales
    service.loginDemo('RECTOR', 0);
    expect(service.hasPermission('CREAR_PERIODO')).toBe(true);

    // DOCENTE no tiene permisos de rector/admin
    service.loginDemo('DOCENTE', 0);
    expect(service.hasPermission('CREAR_PERIODO')).toBe(false);
  });

  it('5. Debe ejecutar loginDemo para todos los roles educativos y navegar al dashboard', () => {
    const roles: Array<'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE'> = [
      'RECTOR',
      'DOCENTE',
      'TESORERO',
      'COORDINADOR',
      'ESTUDIANTE',
    ];

    roles.forEach((rol) => {
      service.loginDemo(rol, 0);
      expect(service.user()?.role).toBe(rol);
      expect(service.token()).toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  it('6. Debe registrar un nuevo colegio y seleccionarlo como activo', () => {
    const nuevo = service.registrarNuevoColegio(
      {
        nombre: 'Colegio Experimental Santander',
        ciudad: 'Bucaramanga',
        nit: '800.555.444-3',
      },
      {
        nombre: 'Alejandro',
        apellido: 'Santander',
        email: 'rectoria@santander.edu.co',
      }
    );

    expect(nuevo.id).toBeTruthy();
    expect(nuevo.slug).toContain('santander');
    expect(service.colegio().nombre).toBe('Colegio Experimental Santander');
    expect(service.user()?.email).toBe('rectoria@santander.edu.co');
    expect(service.colegiosDisponibles().length).toBeGreaterThan(COLEGIOS_DEMO.length);
  });

  it('7. Debe realizar logout limpiando señales, almacenamiento y redirigiendo a login', () => {
    service.logout();

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
