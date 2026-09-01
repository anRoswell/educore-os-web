import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-11: Talento Humano, Escalafón Docente & Nómina Legal (Leyes Laborales Colombia)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('11.1 Should register teacher collaborator profile with escalafón docente and banking details (rh_colaboradores)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const teacherUserId = '71111111-1111-4111-8111-000000000003'; // Diana Gómez

    // Check if collaborator already exists or create new
    const existingColab = await queryDb('SELECT * FROM rh_colaboradores WHERE user_id = $1', [teacherUserId]);
    
    let colabId: string;
    if (existingColab.length === 0) {
      const createRes = await request.post('http://127.0.0.1:3001/api/v1/rrhh/colaboradores', {
        headers: {
          'x-colegio-id': tenantId,
          'Content-Type': 'application/json',
        },
        data: {
          userId: teacherUserId,
          cargo: 'DOCENTE_TITULAR',
          escalafonDocente: 'Escalafón 2A (Licenciado con Posgrado)',
          tipoVinculacion: 'TERMINO_FIJO',
          salarioBase: 3800000.0,
          bancoNombre: 'Bancolombia',
          tipoCuentaBanco: 'AHORROS',
          numeroCuentaBanco: '102-948576-33',
          fechaIngreso: '2026-01-15',
        },
      });

      expect(createRes.status()).toBe(201);
      const colabData = await createRes.json();
      colabId = colabData.id;
    } else {
      colabId = existingColab[0].id;
    }

    // Direct PostgreSQL validation in rh_colaboradores
    const dbColab = await queryDb('SELECT * FROM rh_colaboradores WHERE user_id = $1', [teacherUserId]);
    expect(dbColab.length).toBeGreaterThan(0);
    expect(dbColab[0].cargo).toBe('DOCENTE_TITULAR');
    expect(dbColab[0].banco_nombre).toBe('Bancolombia');
    expect(dbColab[0].estado).toBe('ACTIVO');
  });

  test('11.2 Should create a labor contract (rh_contratos) with salary and term', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const teacherUserId = '71111111-1111-4111-8111-000000000003';

    const colab = await queryDb('SELECT id FROM rh_colaboradores WHERE user_id = $1', [teacherUserId]);
    expect(colab.length).toBeGreaterThan(0);
    const colabId = colab[0].id;

    const uniqueContractNum = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;

    const createRes = await request.post('http://127.0.0.1:3001/api/v1/rrhh/contratos', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        colaboradorId: colabId,
        numeroContrato: uniqueContractNum,
        fechaInicio: '2026-01-15',
        fechaFin: '2026-11-30',
        salarioPactado: 3800000.0,
        urlContratoPdf: `https://storage.educoreos.com/contratos/${uniqueContractNum}.pdf`,
      },
    });

    expect(createRes.status()).toBe(201);
    const contractData = await createRes.json();
    expect(contractData.numeroContrato).toBe(uniqueContractNum);

    // Direct PostgreSQL validation in rh_contratos
    const dbContract = await queryDb('SELECT * FROM rh_contratos WHERE numero_contrato = $1', [uniqueContractNum]);
    expect(dbContract.length).toBeGreaterThan(0);
    expect(Number(dbContract[0].salario_pactado)).toBe(3800000.0);
    expect(dbContract[0].estado).toBe('VIGENTE');
  });

  test('11.3 Should execute monthly payroll liquidation with statutory 4% health & 4% pension deductions (rh_liquidaciones_nomina)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const currentMonth = 8;
    const currentYear = 2026;

    const liqRes = await request.post('http://127.0.0.1:3001/api/v1/rrhh/nomina/liquidar-mes', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        mes: currentMonth,
        anio: currentYear,
      },
    });

    expect(liqRes.status()).toBe(201);
    const liqData = await liqRes.json();
    expect(liqData.liquidaciones.length).toBeGreaterThan(0);

    // Direct PostgreSQL validation for statutory payroll calculation
    const dbLiqs = await queryDb('SELECT * FROM rh_liquidaciones_nomina WHERE mes = $1 AND anio = $2', [currentMonth, currentYear]);
    expect(dbLiqs.length).toBeGreaterThan(0);

    const firstLiq = dbLiqs[0];
    const salarioBase = Number(firstLiq.salario_basico);
    const auxTransporte = Number(firstLiq.auxilio_transporte);
    const salud = Number(firstLiq.deduccion_salud);
    const pension = Number(firstLiq.deduccion_pension);
    const totalDeducciones = Number(firstLiq.total_deducciones);
    const neto = Number(firstLiq.neto_a_pagar);

    // Statutory deductions formula checks: Salud = 4%, Pension = 4%
    const expectedSalud = Number((salarioBase * 0.04).toFixed(2));
    const expectedPension = Number((salarioBase * 0.04).toFixed(2));
    expect(salud).toBeCloseTo(expectedSalud, 1);
    expect(pension).toBeCloseTo(expectedPension, 1);
    expect(totalDeducciones).toBeCloseTo(salud + pension, 1);
    expect(neto).toBeCloseTo((salarioBase + auxTransporte) - totalDeducciones, 1);
    expect(firstLiq.estado).toBe('LIQUIDADA');
  });

  test('11.4 Should query collaborator payslips (Colillas de Pago) and verify payroll lifecycle in PostgreSQL', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    const getNominaRes = await request.get('http://127.0.0.1:3001/api/v1/rrhh/nomina?mes=8&anio=2026', {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(getNominaRes.status()).toBe(200);
    const nominas = await getNominaRes.json();
    expect(Array.isArray(nominas)).toBe(true);
    expect(nominas.length).toBeGreaterThan(0);

    const payslip = nominas[0];
    expect(payslip.urlColillaPago).toContain('.pdf');
    expect(payslip.estado).toBe('LIQUIDADA');

    // Verify DB count
    const countDb = await queryDb('SELECT count(*) as total FROM rh_liquidaciones_nomina');
    expect(Number(countDb[0].total)).toBeGreaterThan(0);
  });
});
