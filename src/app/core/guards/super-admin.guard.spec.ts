import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { superAdminGuard } from './super-admin.guard';
import { AuthService } from '../services/auth.service';

describe('SuperAdminGuard (RBAC SaaS Protection)', () => {
  let authService: AuthService;
  let routerNavigatedTo: string | null = null;

  beforeEach(() => {
    routerNavigatedTo = null;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: {
            navigate: (commands: string[]) => {
              routerNavigatedTo = commands[0];
            },
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('1. Debe permitir el acceso si el usuario es SUPER_ADMIN', () => {
    authService.user.set({
      id: 'usr-001',
      primerNombre: 'Super',
      primerApellido: 'Admin',
      email: 'superadmin@educore.co',
      role: 'SUPER_ADMIN',
      colegioId: undefined,
      colegiosIds: [],
    });

    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(routerNavigatedTo).toBeNull();
  });

  it('2. Debe bloquear el acceso y redirigir a /dashboard si el usuario es RECTOR u otro rol', () => {
    authService.user.set({
      id: 'usr-002',
      primerNombre: 'Carlos',
      primerApellido: 'Mendoza',
      email: 'rectoria@sanbartolome.edu.co',
      role: 'RECTOR',
      colegioId: '11111111-2222-3333-4444-555555555555',
      colegiosIds: ['11111111-2222-3333-4444-555555555555'],
    });

    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(routerNavigatedTo).toBe('/dashboard');
  });

  it('3. Debe bloquear el acceso y redirigir si no hay usuario autenticado', () => {
    authService.user.set(null);

    const result = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(routerNavigatedTo).toBe('/dashboard');
  });
});
