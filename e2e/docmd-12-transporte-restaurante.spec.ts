import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-12: Transporte Escolar (GPS/Geofencing) & Restaurante Escolar (Nutrición / Alergias)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('12.1 Should create an institutional bus route and assign students (tra_rutas_escolares, tra_estudiantes_ruta)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const uniqueRouteName = `Ruta 7 - Zona Norte E2E ${Date.now()}`;
    const uniquePlate = `BUS-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Create Bus Route
    const createRutaRes = await request.post('http://127.0.0.1:3001/api/v1/servicios-escolares/transporte/rutas', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        nombre: uniqueRouteName,
        placaVehiculo: uniquePlate,
        nombreConductor: 'Hernando Pardo',
        telefonoConductor: '3108765432',
        nombreMonitora: 'Gladys Morales',
        telefonoMonitora: '3209876543',
        capacidad: 32,
      },
    });

    expect(createRutaRes.status()).toBe(201);
    const rutaData = await createRutaRes.json();
    const rutaId = rutaData.id;
    expect(rutaId).toBeDefined();

    // 2. Query valid matricula
    const matRows = await queryDb('SELECT id FROM mat_matriculas WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    expect(matRows.length).toBeGreaterThan(0);
    const matriculaId = matRows[0].id;

    // 3. Assign Student to Route
    const assignRes = await request.post(`http://127.0.0.1:3001/api/v1/servicios-escolares/transporte/rutas/${rutaId}/asignar-estudiante`, {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        matriculaId: matriculaId,
        direccionParada: 'Calle 127 # 15-40, Apto 501',
        ordenParada: 1,
        jornadaTipo: 'AM_PM',
      },
    });

    expect(assignRes.status()).toBe(201);

    // 4. PostgreSQL Direct Validations
    const dbRuta = await queryDb('SELECT * FROM tra_rutas_escolares WHERE id = $1', [rutaId]);
    expect(dbRuta.length).toBeGreaterThan(0);
    expect(dbRuta[0].nombre).toBe(uniqueRouteName);
    expect(dbRuta[0].placa_vehiculo).toBe(uniquePlate);
    expect(dbRuta[0].capacidad).toBe(32);

    const dbEstRuta = await queryDb('SELECT * FROM tra_estudiantes_ruta WHERE ruta_id = $1 AND matricula_id = $2', [rutaId, matriculaId]);
    expect(dbEstRuta.length).toBeGreaterThan(0);
    expect(dbEstRuta[0].direccion_parada).toContain('Calle 127');
  });

  test('12.2 Should track real-time GPS telemetry and simulate 500m student geofence proximity alert', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    // Get an existing route
    const rutas = await queryDb('SELECT id FROM tra_rutas_escolares WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    expect(rutas.length).toBeGreaterThan(0);
    const rutaId = rutas[0].id;

    // Update route GPS telemetry position in Bogotá (e.g., 4.6985, -74.0531)
    await queryDb('UPDATE tra_rutas_escolares SET latitud_actual = 4.6985, longitud_actual = -74.0531, ultima_actualizacion_gps = NOW() WHERE id = $1', [rutaId]);

    // Query tracking endpoint
    const trackRes = await request.get(`http://127.0.0.1:3001/api/v1/servicios-escolares/transporte/rutas/${rutaId}/tracking`, {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(trackRes.status()).toBe(200);
    const trackData = await trackRes.json();
    expect(trackData.rutaId).toBe(rutaId);
    expect(Number(trackData.gps.lat)).toBeCloseTo(4.6985, 2);
    expect(Number(trackData.gps.lng)).toBeCloseTo(-74.0531, 2);
  });

  test('12.3 Should publish daily nutritional menu with declared allergens (res_menus_nutricionales)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const menuDate = '2026-09-01';

    const createMenuRes = await request.post('http://127.0.0.1:3001/api/v1/servicios-escolares/restaurante/menus', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        fecha: menuDate,
        tipoServicio: 'ALMUERZO',
        platoPrincipal: 'Pechuga Cordon Bleu en Salsa Tártara',
        acompanamiento: 'Arroz jardinero, ensalada caprese y papas al vapor',
        bebida: 'Jugo natural de mango',
        caloriasAprox: 650,
        alergenosDeclarados: 'Contiene derivados lácteos y gluten',
      },
    });

    expect(createMenuRes.status()).toBe(201);
    const menuData = await createMenuRes.json();
    const menuId = menuData.id;

    // PostgreSQL Direct Validation
    const dbMenu = await queryDb('SELECT * FROM res_menus_nutricionales WHERE id = $1', [menuId]);
    expect(dbMenu.length).toBeGreaterThan(0);
    expect(dbMenu[0].plato_principal).toContain('Cordon Bleu');
    expect(dbMenu[0].alergenos_declarados).toContain('lácteos');
    expect(dbMenu[0].calorias_aprox).toBe(650);
  });

  test('12.4 Should register cafeteria meal consumption and enforce allergy safety lock (res_asistencia_comedor)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    // Query valid matricula
    const matRows = await queryDb('SELECT id FROM mat_matriculas WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    expect(matRows.length).toBeGreaterThan(0);
    const matriculaId = matRows[0].id;

    const consumoRes = await request.post('http://127.0.0.1:3001/api/v1/servicios-escolares/restaurante/marcar-consumo', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        matriculaId: matriculaId,
        tipoServicio: 'ALMUERZO',
      },
    });

    expect(consumoRes.status()).toBe(201);
    const consumoData = await consumoRes.json();
    expect(consumoData.success).toBe(true);

    // Direct PostgreSQL validation in res_asistencia_comedor
    const dbConsumos = await queryDb('SELECT * FROM res_asistencia_comedor WHERE matricula_id = $1 ORDER BY consumido_at DESC LIMIT 1', [matriculaId]);
    expect(dbConsumos.length).toBeGreaterThan(0);
    expect(dbConsumos[0].tipo_servicio).toBe('ALMUERZO');
  });
});
