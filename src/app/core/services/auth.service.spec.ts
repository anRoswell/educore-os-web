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
    service = new AuthService(routerSpy as unknown as Router);
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
    service.loginDemo('DOCENTE');
    expect(service.user()?.role).toBe('DOCENTE');
    expect(service.hasRole('DOCENTE')).toBe(true);
    expect(service.hasRole('TESORERO')).toBe(false);

    // Cuando no hay usuario autenticado
    service.logout();
    expect(service.hasRole('DOCENTE')).toBe(false);
  });

  it('4. Debe verificar permisos institucionales con hasPermission', () => {
    // RECTOR tiene permisos globales
    service.loginDemo('RECTOR');
    expect(service.hasPermission('CREAR_PERIODO')).toBe(true);

    // DOCENTE no tiene permisos de rector/admin
    service.loginDemo('DOCENTE');
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
      service.loginDemo(rol);
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
    expect(service.todosLosColegios().length).toBeGreaterThan(COLEGIOS_DEMO.length);
    expect(service.colegiosDisponibles().length).toBe(1);
    expect(service.colegiosDisponibles()[0].id).toBe(nuevo.id);
  });

  it('7. Debe realizar logout limpiando señales, almacenamiento y redirigiendo a login', () => {
    service.logout();

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('8. Debe aislar estrictamente las instituciones para usuarios no SUPER_ADMIN', () => {
    // Usuario RECTOR de San Bartolomé solo debe tener 1 colegio disponible
    service.loginDemo('RECTOR');
    expect(service.user()?.email).toBe('rectoria@sanbartolome.edu.co');
    expect(service.colegiosDisponibles().length).toBe(1);
    expect(service.colegiosDisponibles()[0].slug).toBe('san-bartolome');
    expect(service.todosLosColegios().length).toBe(COLEGIOS_DEMO.length);

    // Usuario SUPER_ADMIN debe tener todos los colegios disponibles
    service.user.set({
      id: 'super-admin-01',
      email: 'admin@educoreos.com',
      primerNombre: 'Super',
      primerApellido: 'Admin',
      role: 'SUPER_ADMIN',
    });
    expect(service.colegiosDisponibles().length).toBe(COLEGIOS_DEMO.length);
  });

  it('9. Debe validar credenciales y retornar mensajes de error específicos ante datos incorrectos', () => {
    // 9.1 Vacío
    const resVacio = service.loginWithCredentials('', '');
    expect(resVacio.success).toBe(false);
    expect(resVacio.message).toContain('correo institucional');

    // 9.2 Formato de email inválido
    const resFormato = service.loginWithCredentials('correo-invalido', '123456');
    expect(resFormato.success).toBe(false);
    expect(resFormato.message).toContain('formato');

    // 9.3 Dominio de colegio no existente
    const resNoColegio = service.loginWithCredentials('usuario@colegiodesconocido.com', 'EduCore2026*');
    expect(resNoColegio.success).toBe(false);
    expect(resNoColegio.message).toContain('No existe ninguna institución educativa');

    // 9.4 Contraseña incorrecta
    const resPassInvalido = service.loginWithCredentials('rectoria@sanbartolome.edu.co', 'wrongpass');
    expect(resPassInvalido.success).toBe(false);
    expect(resPassInvalido.message).toContain('incorrectos');

    // 9.5 Usuario no registrado dentro de la institución
    const resUserNoReg = service.loginWithCredentials('alguien_desconocido@sanbartolome.edu.co', 'EduCore2026*');
    expect(resUserNoReg.success).toBe(false);
    expect(resUserNoReg.message).toContain('no se encuentra registrado');

    // 9.6 Éxito con credenciales válidas
    const resExito = service.loginWithCredentials('rectoria@sanbartolome.edu.co', 'EduCore2026*');
    expect(resExito.success).toBe(true);
    expect(service.user()?.role).toBe('RECTOR');
    expect(service.colegio().slug).toBe('san-bartolome');

    // 9.7 Éxito Super Admin con superadmin@poscore.co
    const resSuper = service.loginWithCredentials('superadmin@poscore.co', 'EduCore2026*');
    expect(resSuper.success).toBe(true);
    expect(service.user()?.role).toBe('SUPER_ADMIN');
    expect(service.user()?.email).toBe('superadmin@poscore.co');
  });
});
