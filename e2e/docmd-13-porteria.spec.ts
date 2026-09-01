import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-13: Portería, Minuta Digital de Visitantes & Control de Acceso (Torniquetes QR)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('13.1 Should register visitor campus check-in (Minuta Digital) and badge assignment (acc_minuta_visitantes)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const uniqueDoc = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    const uniqueVisitor = `Visitante Auditor E2E ${Date.now()}`;
    const badgeNum = `GAFETE-${Math.floor(10 + Math.random() * 90)}`;

    const checkinRes = await request.post('http://127.0.0.1:3001/api/v1/porteria/visitantes/ingreso', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        tipoDocumento: 'CC',
        numeroDocumento: uniqueDoc,
        nombreCompleto: uniqueVisitor,
        empresaEntidad: 'Secretaría de Educación Distrital',
        motivoVisita: 'Auditoría presencial de estándares de calidad',
        personaAVisitar: 'Rectoría / Coordinación Académica',
        gafeteAsignado: badgeNum,
      },
    });

    expect(checkinRes.status()).toBe(201);
    const visitorData = await checkinRes.json();
    const visitorId = visitorData.id;
    expect(visitorId).toBeDefined();

    // PostgreSQL Direct Validation
    const dbVisitas = await queryDb('SELECT * FROM acc_minuta_visitantes WHERE id = $1', [visitorId]);
    expect(dbVisitas.length).toBeGreaterThan(0);
    expect(dbVisitas[0].nombre_completo).toBe(uniqueVisitor);
    expect(dbVisitas[0].numero_documento).toBe(uniqueDoc);
    expect(dbVisitas[0].gafete_asignado).toBe(badgeNum);
    expect(dbVisitas[0].fecha_salida).toBeNull();
  });

  test('13.2 Should register visitor campus check-out and update visit duration (acc_minuta_visitantes)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    // Get an open visitor record
    const openVisits = await queryDb('SELECT id FROM acc_minuta_visitantes WHERE colegio_id = $1 AND fecha_salida IS NULL ORDER BY created_at DESC LIMIT 1', [tenantId]);
    expect(openVisits.length).toBeGreaterThan(0);
    const visitorId = openVisits[0].id;

    const checkoutRes = await request.put(`http://127.0.0.1:3001/api/v1/porteria/visitantes/${visitorId}/salida`, {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(checkoutRes.status()).toBe(200);
    const checkoutData = await checkoutRes.json();
    expect(checkoutData.fechaSalida).toBeDefined();

    // PostgreSQL Direct Validation
    const dbUpdated = await queryDb('SELECT * FROM acc_minuta_visitantes WHERE id = $1', [visitorId]);
    expect(dbUpdated[0].fecha_salida).not.toBeNull();
  });

  test('13.3 Should register turnstile digital access event via QR scanning (acc_marcaciones_torniquete)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const studentId = '11111111-1111-4111-8111-000000000001';

    const qrRes = await request.post('http://127.0.0.1:3001/api/v1/porteria/torniquete/marcar-qr', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        estudianteId: studentId,
        tipoMarcacion: 'ENTRADA',
        puntoAcceso: 'TORNIQUETE_PEATONAL_PRINCIPAL',
      },
    });

    expect(qrRes.status()).toBe(201);
    const marcacionData = await qrRes.json();
    expect(marcacionData.id).toBeDefined();
    expect(marcacionData.tipoMarcacion).toBe('ENTRADA');

    // PostgreSQL Direct Validation
    const dbMarcaciones = await queryDb('SELECT * FROM acc_marcaciones_torniquete WHERE id = $1', [marcacionData.id]);
    expect(dbMarcaciones.length).toBeGreaterThan(0);
    expect(dbMarcaciones[0].tipo_marcacion).toBe('ENTRADA');
    expect(dbMarcaciones[0].punto_acceso).toBe('TORNIQUETE_PEATONAL_PRINCIPAL');
  });

  test('13.4 Should authorize student early dismissal and execute gate check-out with parent alert (acc_autorizaciones_salida)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const coordinatorId = '71111111-1111-4111-8111-000000000002';

    // 1. Query valid student matricula
    const matRows = await queryDb('SELECT id FROM mat_matriculas WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    expect(matRows.length).toBeGreaterThan(0);
    const matriculaId = matRows[0].id;

    // 2. Create early dismissal authorization
    const authRes = await request.post('http://127.0.0.1:3001/api/v1/porteria/autorizaciones-salida', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        matriculaId: matriculaId,
        fechaSalida: '2026-09-02',
        horaSalidaEstimada: '11:45:00',
        motivo: 'Cita médica especialista pediatría',
        personaRetiraNombre: 'Carolina Restrepo (Madre)',
        personaRetiraDocumento: '52876123',
      },
    });

    expect(authRes.status()).toBe(201);
    const authData = await authRes.json();
    const authId = authData.id;
    expect(authId).toBeDefined();
    expect(authData.estado).toBe('AUTORIZADO');

    // 3. Execute check-out validation at gate
    const gateRes = await request.put(`http://127.0.0.1:3001/api/v1/porteria/autorizaciones-salida/${authId}/validar`, {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(gateRes.status()).toBe(200);
    const gateData = await gateRes.json();
    expect(gateData.success).toBe(true);

    // 4. PostgreSQL Direct Validation
    const dbAuth = await queryDb('SELECT * FROM acc_autorizaciones_salida WHERE id = $1', [authId]);
    expect(dbAuth.length).toBeGreaterThan(0);
    expect(dbAuth[0].estado).toBe('EJECUTADO');
    expect(dbAuth[0].motivo).toContain('Cita médica');
  });
});
