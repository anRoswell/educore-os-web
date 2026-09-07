/**
 * Empirical Verification & Stress-Test Harness for ModalNuevoAsientoComponent Math Logic
 * File: EduCoreOS-web/scripts/test_modal_nuevo_asiento_math.js
 * Target: modal-nuevo-asiento.component.ts
 */

// Exact math logic mirrored from ModalNuevoAsientoComponent (lines 215-238 & 280-306)
function calcularTotales(lineas) {
  const totalDebito =
    Math.round(lineas.reduce((sum, l) => sum + (Number(l.debito) || 0), 0) * 100) / 100;
  const totalCredito =
    Math.round(lineas.reduce((sum, l) => sum + (Number(l.credito) || 0), 0) * 100) / 100;
  const diferencia = Math.round((totalDebito - totalCredito) * 100) / 100;
  const isBalanced = Math.abs(diferencia) < 0.01 && totalDebito > 0;

  return { totalDebito, totalCredito, diferencia, isBalanced };
}

function puedeGuardar(totales, lineas, fechaContable = '2026-09-06', guardando = false) {
  return (
    totales.isBalanced &&
    lineas.length >= 2 &&
    fechaContable.length >= 8 &&
    !guardando
  );
}

function actualizarLineaDebito(linea, valor) {
  const numVal = valor !== null && valor !== undefined ? Number(valor) : null;
  return {
    ...linea,
    debito: numVal,
    credito: numVal && numVal > 0 ? 0 : linea.credito,
  };
}

function actualizarLineaCredito(linea, valor) {
  const numVal = valor !== null && valor !== undefined ? Number(valor) : null;
  return {
    ...linea,
    credito: numVal,
    debito: numVal && numVal > 0 ? 0 : linea.debito,
  };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(description, condition, actualInfo = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${description} | Info: ${actualInfo}`);
  }
}

console.log('======================================================================');
console.log('EMPIRICAL STRESS-TEST: ModalNuevoAsientoComponent Mathematical Engine');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Scenario a — Unbalanced entries (e.g. debit 100, credit 99.99)
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Scenario a — Unbalanced Entries ---');
{
  // a.1: Debit 100 vs Credit 99.99
  const lineas1 = [
    { debito: 100, credito: 0 },
    { debito: 0, credito: 99.99 },
  ];
  const t1 = calcularTotales(lineas1);
  assert('a.1: 100 vs 99.99 -> totalDebito is 100', t1.totalDebito === 100, `Got: ${t1.totalDebito}`);
  assert('a.1: 100 vs 99.99 -> totalCredito is 99.99', t1.totalCredito === 99.99, `Got: ${t1.totalCredito}`);
  assert('a.1: 100 vs 99.99 -> diferencia is 0.01', t1.diferencia === 0.01, `Got: ${t1.diferencia}`);
  assert('a.1: 100 vs 99.99 -> isBalanced is false', t1.isBalanced === false, `Got: ${t1.isBalanced}`);
  assert('a.1: 100 vs 99.99 -> puedeGuardar is false', puedeGuardar(t1, lineas1) === false);

  // a.2: Negative 1 centavo discrepancy: Debit 99.99 vs Credit 100
  const lineas2 = [
    { debito: 99.99, credito: 0 },
    { debito: 0, credito: 100 },
  ];
  const t2 = calcularTotales(lineas2);
  assert('a.2: 99.99 vs 100 -> diferencia is -0.01', t2.diferencia === -0.01, `Got: ${t2.diferencia}`);
  assert('a.2: 99.99 vs 100 -> isBalanced is false', t2.isBalanced === false, `Got: ${t2.isBalanced}`);
  assert('a.2: 99.99 vs 100 -> puedeGuardar is false', puedeGuardar(t2, lineas2) === false);

  // a.3: Gross unbalance: Debit 1000 vs Credit 0
  const lineas3 = [
    { debito: 1000, credito: 0 },
    { debito: 0, credito: 0 },
  ];
  const t3 = calcularTotales(lineas3);
  assert('a.3: 1000 vs 0 -> isBalanced is false', t3.isBalanced === false);
  assert('a.3: 1000 vs 0 -> diferencia is 1000', t3.diferencia === 1000);
  assert('a.3: 1000 vs 0 -> puedeGuardar is false', puedeGuardar(t3, lineas3) === false);
}

// -----------------------------------------------------------------------------
// SUITE 2: Scenario b — Floating point precision edge cases (e.g. 0.1 + 0.2 vs 0.3)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Scenario b — Floating Point Precision Edge Cases ---');
{
  // b.1: Classic IEEE 754: 0.1 + 0.2 vs 0.3
  const rawSum = 0.1 + 0.2; // In JS = 0.30000000000000004
  const lineasB1 = [
    { debito: 0.1, credito: 0 },
    { debito: 0.2, credito: 0 },
    { debito: 0, credito: 0.3 },
  ];
  const tB1 = calcularTotales(lineasB1);
  assert('b.1: raw 0.1 + 0.2 !== 0.3 in native JS', rawSum !== 0.3);
  assert('b.1: totalDebito rounds 0.1+0.2 to exactly 0.3', tB1.totalDebito === 0.3, `Got: ${tB1.totalDebito}`);
  assert('b.1: totalCredito is 0.3', tB1.totalCredito === 0.3);
  assert('b.1: diferencia is 0.00', tB1.diferencia === 0, `Got: ${tB1.diferencia}`);
  assert('b.1: isBalanced is true', tB1.isBalanced === true);
  assert('b.1: puedeGuardar is true', puedeGuardar(tB1, lineasB1) === true);

  // b.2: Three lines of 0.07 (0.07*3 = 0.21000000000000002) vs credit 0.21
  const lineasB2 = [
    { debito: 0.07, credito: 0 },
    { debito: 0.07, credito: 0 },
    { debito: 0.07, credito: 0 },
    { debito: 0, credito: 0.21 },
  ];
  const tB2 = calcularTotales(lineasB2);
  assert('b.2: 3 x 0.07 vs 0.21 -> totalDebito is 0.21', tB2.totalDebito === 0.21, `Got: ${tB2.totalDebito}`);
  assert('b.2: 3 x 0.07 vs 0.21 -> diferencia is 0', tB2.diferencia === 0);
  assert('b.2: 3 x 0.07 vs 0.21 -> isBalanced is true', tB2.isBalanced === true);

  // b.3: Large financial amounts: 987,654,321.99 vs 987,654,321.99
  const lineasB3 = [
    { debito: 987654321.99, credito: 0 },
    { debito: 0, credito: 987654321.99 },
  ];
  const tB3 = calcularTotales(lineasB3);
  assert('b.3: Large numbers -> totalDebito is 987654321.99', tB3.totalDebito === 987654321.99);
  assert('b.3: Large numbers -> diferencia is 0', tB3.diferencia === 0);
  assert('b.3: Large numbers -> isBalanced is true', tB3.isBalanced === true);

  // b.4: Stress test with 10,000 randomized split entries
  let floatPass = 0;
  for (let i = 0; i < 10000; i++) {
    const part1 = Math.floor(Math.random() * 100000) / 100;
    const part2 = Math.floor(Math.random() * 100000) / 100;
    const totalExpected = Math.round((part1 + part2) * 100) / 100;
    const lines = [
      { debito: part1, credito: 0 },
      { debito: part2, credito: 0 },
      { debito: 0, credito: totalExpected },
    ];
    const t = calcularTotales(lines);
    if (t.diferencia === 0 && (totalExpected === 0 ? !t.isBalanced : t.isBalanced)) {
      floatPass++;
    }
  }
  assert('b.4: 10,000 randomized 2-split transactions balanced with 0 difference', floatPass === 10000, `Passed: ${floatPass}/10000`);

  // b.5: 10,000 randomized unbalanced entries (differing by >= 0.01)
  let rejectedPass = 0;
  for (let i = 0; i < 10000; i++) {
    const d = (Math.floor(Math.random() * 50000) + 1) / 100;
    const diff = (Math.floor(Math.random() * 1000) + 1) / 100; // >= 0.01
    const c = Math.round((d + diff) * 100) / 100;
    const lines = [
      { debito: d, credito: 0 },
      { debito: 0, credito: c },
    ];
    const t = calcularTotales(lines);
    if (!t.isBalanced && Math.abs(t.diferencia) >= 0.01) {
      rejectedPass++;
    }
  }
  assert('b.5: 10,000 randomized unbalanced transactions strictly rejected', rejectedPass === 10000, `Passed: ${rejectedPass}/10000`);
}

// -----------------------------------------------------------------------------
// SUITE 3: Scenario c — Fewer than 2 lines
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Scenario c — Fewer Than 2 Lines ---');
{
  // c.1: 0 lines
  const lineas0 = [];
  const t0 = calcularTotales(lineas0);
  assert('c.1: 0 lines -> isBalanced is false', t0.isBalanced === false);
  assert('c.1: 0 lines -> puedeGuardar is false', puedeGuardar(t0, lineas0) === false);

  // c.2: 1 line with debit 100
  const lineas1 = [{ debito: 100, credito: 0 }];
  const t1 = calcularTotales(lineas1);
  assert('c.2: 1 line -> isBalanced is false', t1.isBalanced === false);
  assert('c.2: 1 line -> puedeGuardar is false', puedeGuardar(t1, lineas1) === false);

  // c.3: 1 line hypothetically balanced (e.g. debito 100, credito 100)
  const lineas1Bal = [{ debito: 100, credito: 100 }];
  const t1Bal = calcularTotales(lineas1Bal);
  assert('c.3: 1 line even if debito==credito -> puedeGuardar is false (requires >= 2 lines)', puedeGuardar(t1Bal, lineas1Bal) === false);

  // c.4: Exactly 2 lines balanced
  const lineas2 = [
    { debito: 50, credito: 0 },
    { debito: 0, credito: 50 },
  ];
  const t2 = calcularTotales(lineas2);
  assert('c.4: 2 lines balanced -> puedeGuardar is true', puedeGuardar(t2, lineas2) === true);

  // c.5: 3 lines balanced
  const lineas3 = [
    { debito: 30, credito: 0 },
    { debito: 20, credito: 0 },
    { debito: 0, credito: 50 },
  ];
  const t3 = calcularTotales(lineas3);
  assert('c.5: 3 lines balanced -> puedeGuardar is true', puedeGuardar(t3, lineas3) === true);
}

// -----------------------------------------------------------------------------
// SUITE 4: Scenario d — Debit and Credit on the same line (Unilateral Clearing)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Scenario d — Unilateral Debit/Credit Enforcement ---');
{
  let linea = { cuentaCodigo: '110505', descripcion: 'Caja', debito: null, credito: null };

  // d.1: User enters debito = 250.00
  linea = actualizarLineaDebito(linea, 250);
  assert('d.1: Enters debito 250 -> debito is 250', linea.debito === 250);
  assert('d.1: Enters debito 250 -> credito is null or 0', linea.credito === null || linea.credito === 0);

  // d.2: User now enters credito = 500 on the same line
  linea = actualizarLineaCredito(linea, 500);
  assert('d.2: Enters credito 500 on same line -> credito is 500', linea.credito === 500);
  assert('d.2: Enters credito 500 on same line -> debito cleared to 0', linea.debito === 0);

  // d.3: User enters debito = 750 on the same line
  linea = actualizarLineaDebito(linea, 750);
  assert('d.3: Enters debito 750 -> debito is 750', linea.debito === 750);
  assert('d.3: Enters debito 750 -> credito cleared to 0', linea.credito === 0);

  // d.4: Zero check: debito 0 does not clear existing credit if credit was set
  let lineaZero = { cuentaCodigo: '110505', debito: 0, credito: 100 };
  let resZero = actualizarLineaDebito(lineaZero, 0);
  assert('d.4: Setting debito to 0 leaves debito as 0', resZero.debito === 0);

  // d.5: Null check
  let resNull = actualizarLineaDebito(linea, null);
  assert('d.5: Setting debito to null sets debito to null', resNull.debito === null);
}

// -----------------------------------------------------------------------------
// SUITE 5: Scenario e — Empty or zero amounts
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Scenario e — Empty or Zero Amounts ---');
{
  // e.1: Default initial state: 2 empty lines with null/null
  const lineasVacias = [
    { cuentaCodigo: '', descripcion: '', debito: null, credito: null },
    { cuentaCodigo: '', descripcion: '', debito: null, credito: null },
  ];
  const tVacias = calcularTotales(lineasVacias);
  assert('e.1: Initial empty lines -> totalDebito is 0', tVacias.totalDebito === 0);
  assert('e.1: Initial empty lines -> totalCredito is 0', tVacias.totalCredito === 0);
  assert('e.1: Initial empty lines -> diferencia is 0', tVacias.diferencia === 0);
  assert('e.1: Initial empty lines -> isBalanced is false (totalDebito > 0 guard)', tVacias.isBalanced === false);
  assert('e.1: Initial empty lines -> puedeGuardar is false', puedeGuardar(tVacias, lineasVacias) === false);

  // e.2: Explicit zeros on both lines
  const lineasCeros = [
    { debito: 0, credito: 0 },
    { debito: 0, credito: 0 },
  ];
  const tCeros = calcularTotales(lineasCeros);
  assert('e.2: Explicit zeros -> isBalanced is false', tCeros.isBalanced === false);
  assert('e.2: Explicit zeros -> puedeGuardar is false', puedeGuardar(tCeros, lineasCeros) === false);

  // e.3: Negative numbers test: debito -100, credito -100
  const lineasNegativas = [
    { debito: -100, credito: 0 },
    { debito: 0, credito: -100 },
  ];
  const tNeg = calcularTotales(lineasNegativas);
  assert('e.3: Negative amounts -> totalDebito is -100', tNeg.totalDebito === -100);
  assert('e.3: Negative amounts -> isBalanced is false (totalDebito > 0 prevents negative amounts)', tNeg.isBalanced === false);
  assert('e.3: Negative amounts -> puedeGuardar is false', puedeGuardar(tNeg, lineasNegativas) === false);

  // e.4: Empty string amounts
  const lineasStringEmpty = [
    { debito: '', credito: '' },
    { debito: '', credito: '' },
  ];
  const tStr = calcularTotales(lineasStringEmpty);
  assert('e.4: Empty strings -> totalDebito is 0', tStr.totalDebito === 0);
  assert('e.4: Empty strings -> isBalanced is false', tStr.isBalanced === false);
  assert('e.4: Empty strings -> puedeGuardar is false', puedeGuardar(tStr, lineasStringEmpty) === false);
}

// -----------------------------------------------------------------------------
// SUITE 6: Auxiliary UI Guards (Date, Saving state)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Auxiliary Form Validation Guards ---');
{
  const balancedLines = [
    { debito: 100, credito: 0 },
    { debito: 0, credito: 100 },
  ];
  const tBal = calcularTotales(balancedLines);

  // 6.1: Valid date '2026-09-06'
  assert('6.1: Valid date -> puedeGuardar is true', puedeGuardar(tBal, balancedLines, '2026-09-06', false) === true);

  // 6.2: Invalid/short date '' or '2026'
  assert('6.2: Empty date -> puedeGuardar is false', puedeGuardar(tBal, balancedLines, '', false) === false);
  assert('6.2: Incomplete date "2026" -> puedeGuardar is false', puedeGuardar(tBal, balancedLines, '2026', false) === false);

  // 6.3: Guardando in progress (prevents double submission)
  assert('6.3: guardando=true -> puedeGuardar is false', puedeGuardar(tBal, balancedLines, '2026-09-06', true) === false);
}

console.log('\n======================================================================');
console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
