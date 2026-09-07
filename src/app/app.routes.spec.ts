import { routes } from './app.routes';

describe('App Routes - Lazy Loading Architecture', () => {
  it('1. Debe definir todas las rutas protegidas y públicas con loadComponent asíncrono', () => {
    const adminRoute = routes.find((r) => r.path === '');
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.children).toBeDefined();

    const expectedLazyPaths = [
      'dashboard',
      'academico',
      'lms',
      'asistencia',
      'matriculas',
      'tesoreria',
      'educore-ai',
      'gobierno-escolar',
      'convivencia',
      'inclusion',
      'habeas-data',
      'comunicaciones',
      'documental',
      'importador',
      'porteria',
      'talento-humano',
      'transporte-restaurante',
    ];

    expectedLazyPaths.forEach((pathName) => {
      const route = adminRoute?.children?.find((c) => c.path === pathName);
      expect(route).toBeDefined();
      expect(typeof route?.loadComponent).toBe(
        'function',
      );
    });
  });

  it('2. Las rutas públicas y de autenticación deben usar loadComponent', () => {
    const publicPaths = [
      'public/firmar-acta',
      'public/firmar-matricula',
      'login',
    ];

    publicPaths.forEach((pathName) => {
      const route = routes.find((r) => r.path === pathName);
      expect(route).toBeDefined();
      expect(typeof route?.loadComponent).toBe(
        'function',
      );
    });
  });

  it('3. Debe resolver correctamente el componente dinámico para la ruta dashboard', async () => {
    const adminRoute = routes.find((r) => r.path === '');
    const dashboardRoute = adminRoute?.children?.find((c) => c.path === 'dashboard');
    expect(dashboardRoute?.loadComponent).toBeDefined();

    if (dashboardRoute?.loadComponent) {
      const comp = await (dashboardRoute.loadComponent as any)();
      expect(comp).toBeDefined();
    }
  });
});
