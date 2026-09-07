import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ConfiguracionFinanciera } from '../enums';
import {
  ConfiguracionAlertasAcademicas,
  PrevisualizacionBarridoResponse,
  ResultadoBarridoEjecutado,
} from '../models';

export interface Parametro {
  id: string;
  colegioId?: string | null;
  grupo: string;
  codigo: string;
  nombre: string;
  valor?: string;
  descripcion?: string;
  icono?: string;
  badgeClass?: string;
  colorHex?: string;
  bgHex?: string;
  numero?: number;
  peso?: number;
  aplicaNinos?: boolean;
  mesNum?: number;
  abreviatura?: string;
  diasCobro?: number;
  rangoMin?: number;
  rangoMax?: number;
  aprobado?: boolean;
  pesoPorcentaje?: number;
  protocolo?: string;
  tipo?: string;
  orden: number;
  activo: boolean;
}

const DEFAULT_CATALOGS: Record<string, Parametro[]> = {
  MEDIOS_PAGO: [
    {
      id: '1',
      grupo: 'MEDIOS_PAGO',
      codigo: 'EFECTIVO',
      nombre: '💵 Efectivo en Ventanilla (Caja)',
      icono: '💵',
      descripcion: 'Pago físico en tesorería institucional',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'MEDIOS_PAGO',
      codigo: 'TRANSFERENCIA_BANCOLOMBIA',
      nombre: '🏦 Transferencia Bancolombia / PSE',
      icono: '🏦',
      descripcion: 'Transferencia interbancaria o depósito en cuenta corriente/ahorros',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'MEDIOS_PAGO',
      codigo: 'NEQUI_QR',
      nombre: '📱 Nequi / Daviplata QR',
      icono: '📱',
      descripcion: 'Pago inmediato vía billetera digital escaneando código QR',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'MEDIOS_PAGO',
      codigo: 'TARJETA_CREDITO',
      nombre: '💳 Datáfono / Tarjeta Débito-Crédito',
      icono: '💳',
      descripcion: 'Recaudo presencial vía datáfono bancario',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'MEDIOS_PAGO',
      codigo: 'CHEQUE',
      nombre: '📑 Cheque de Gerencia',
      icono: '📑',
      descripcion: 'Cheque de gerencia emitido a nombre de la institución',
      orden: 5,
      activo: true,
    },
    {
      id: '6',
      grupo: 'MEDIOS_PAGO',
      codigo: 'PSE',
      nombre: '🌐 Pago PSE en Línea',
      icono: '🌐',
      descripcion: 'Pasarela electrónica de débitos bancarios ACH',
      orden: 6,
      activo: true,
    },
    {
      id: '7',
      grupo: 'MEDIOS_PAGO',
      codigo: 'WOMPI',
      nombre: '💳 Pasarela Wompi Bancolombia',
      icono: '💳',
      descripcion: 'Checkout oficial digital multi-medio certificado',
      orden: 7,
      activo: true,
    },
    {
      id: '8',
      grupo: 'MEDIOS_PAGO',
      codigo: 'CRUCE_ANTICIPO',
      nombre: '🔁 Cruce de Saldo a Favor (NIIF 2805)',
      icono: '🔁',
      descripcion: 'Aplicación de saldo excedente de meses anteriores',
      orden: 8,
      activo: true,
    },
  ],
  ESTADOS_CUENTA: [
    {
      id: '1',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'AL_DIA',
      nombre: 'Al Día (Cancelado)',
      badgeClass: 'badge-success',
      colorHex: '#166534',
      bgHex: '#dcfce7',
      descripcion: 'Factura pagada en su totalidad sin saldo pendiente',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'PAGADO',
      nombre: 'Pagado',
      badgeClass: 'badge-success',
      colorHex: '#166534',
      bgHex: '#dcfce7',
      descripcion: 'Obligación cancelada',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'PAGADO_PARCIAL',
      nombre: 'Abono Parcial',
      badgeClass: 'badge-warning',
      colorHex: '#92400e',
      bgHex: '#fef3c7',
      descripcion: 'Factura con pago parcial registrado y saldo restante pendiente',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'POR_VENCER',
      nombre: 'Por Vencer',
      badgeClass: 'badge-primary',
      colorHex: '#1e40af',
      bgHex: '#dbeafe',
      descripcion: 'Cuota activa dentro del plazo límite legal para pago oportuno',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'EN_MORA',
      nombre: 'En Mora',
      badgeClass: 'badge-danger',
      colorHex: '#991b1b',
      bgHex: '#fee2e2',
      descripcion: 'Cuota vencida sujeta a cobro de mora y bloqueo de paz y salvo',
      orden: 5,
      activo: true,
    },
    {
      id: '6',
      grupo: 'ESTADOS_CUENTA',
      codigo: 'ANULADO',
      nombre: 'Anulado',
      badgeClass: 'badge-secondary',
      colorHex: '#475569',
      bgHex: '#f1f5f9',
      descripcion: 'Cuenta de cobro cancelada por ajuste contable o rectificación',
      orden: 6,
      activo: true,
    },
  ],
  MESES_ACADEMICOS: [
    { id: '1', grupo: 'MESES_ACADEMICOS', codigo: 'Febrero 2026', nombre: 'Febrero 2026', orden: 1, activo: true },
    { id: '2', grupo: 'MESES_ACADEMICOS', codigo: 'Marzo 2026', nombre: 'Marzo 2026', orden: 2, activo: true },
    { id: '3', grupo: 'MESES_ACADEMICOS', codigo: 'Abril 2026', nombre: 'Abril 2026', orden: 3, activo: true },
    { id: '4', grupo: 'MESES_ACADEMICOS', codigo: 'Mayo 2026', nombre: 'Mayo 2026', orden: 4, activo: true },
    { id: '5', grupo: 'MESES_ACADEMICOS', codigo: 'Junio 2026', nombre: 'Junio 2026', orden: 5, activo: true },
    { id: '6', grupo: 'MESES_ACADEMICOS', codigo: 'Julio 2026', nombre: 'Julio 2026', orden: 6, activo: true },
    { id: '7', grupo: 'MESES_ACADEMICOS', codigo: 'Agosto 2026', nombre: 'Agosto 2026', orden: 7, activo: true },
    { id: '8', grupo: 'MESES_ACADEMICOS', codigo: 'Septiembre 2026', nombre: 'Septiembre 2026', orden: 8, activo: true },
    { id: '9', grupo: 'MESES_ACADEMICOS', codigo: 'Octubre 2026', nombre: 'Octubre 2026', orden: 9, activo: true },
    { id: '10', grupo: 'MESES_ACADEMICOS', codigo: 'Noviembre 2026', nombre: 'Noviembre 2026', orden: 10, activo: true },
    { id: '11', grupo: 'MESES_ACADEMICOS', codigo: 'Diciembre 2026', nombre: 'Diciembre 2026', orden: 11, activo: true },
  ],
  PERIODOS_ESTANDAR: [
    {
      id: '1',
      grupo: 'PERIODOS_ESTANDAR',
      codigo: 'PERIODO_1',
      nombre: 'Primer Periodo',
      valor: '25',
      numero: 1,
      peso: 25,
      orden: 1,
      activo: true,
      descripcion: 'Primer periodo académico estándar del calendario escolar (25%)',
    },
    {
      id: '2',
      grupo: 'PERIODOS_ESTANDAR',
      codigo: 'PERIODO_2',
      nombre: 'Segundo Periodo',
      valor: '25',
      numero: 2,
      peso: 25,
      orden: 2,
      activo: true,
      descripcion: 'Segundo periodo académico estándar del calendario escolar (25%)',
    },
    {
      id: '3',
      grupo: 'PERIODOS_ESTANDAR',
      codigo: 'PERIODO_3',
      nombre: 'Tercer Periodo',
      valor: '25',
      numero: 3,
      peso: 25,
      orden: 3,
      activo: true,
      descripcion: 'Tercer periodo académico estándar del calendario escolar (25%)',
    },
    {
      id: '4',
      grupo: 'PERIODOS_ESTANDAR',
      codigo: 'PERIODO_4',
      nombre: 'Cuarto Periodo',
      valor: '25',
      numero: 4,
      peso: 25,
      orden: 4,
      activo: true,
      descripcion: 'Cuarto periodo académico estándar del calendario escolar (25%)',
    },
  ],
  DOCUMENTOS_IDENTIDAD: [
    {
      id: '1',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'CC',
      nombre: 'Cédula de Ciudadanía',
      aplicaNinos: false,
      descripcion: 'Cédula de Ciudadanía para mayores de edad',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'TI',
      nombre: 'Tarjeta de Identidad',
      aplicaNinos: true,
      descripcion: 'Tarjeta de Identidad para menores entre 7 y 17 años',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'RC',
      nombre: 'Registro Civil de Nacimiento',
      aplicaNinos: true,
      descripcion: 'Registro Civil de Nacimiento para niños de 0 a 7 años',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'CE',
      nombre: 'Cédula de Extranjería',
      aplicaNinos: false,
      descripcion: 'Cédula de Extranjería para extranjeros residentes',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'PEP',
      nombre: 'Permiso Especial de Permanencia',
      aplicaNinos: true,
      descripcion: 'Permiso Especial de Permanencia',
      orden: 5,
      activo: true,
    },
    {
      id: '6',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'PPT',
      nombre: 'Permiso por Protección Temporal',
      aplicaNinos: true,
      descripcion: 'Permiso por Protección Temporal (Estatuto Temporal de Protección)',
      orden: 6,
      activo: true,
    },
    {
      id: '7',
      grupo: 'DOCUMENTOS_IDENTIDAD',
      codigo: 'PASAPORTE',
      nombre: 'Pasaporte',
      aplicaNinos: true,
      descripcion: 'Pasaporte internacional',
      orden: 7,
      activo: true,
    },
  ],
  ESTADOS_MATRICULA: [
    {
      id: '1',
      grupo: 'ESTADOS_MATRICULA',
      codigo: 'PREMATRICULA',
      nombre: 'Prematrícula',
      colorHex: '#d97706',
      descripcion: 'Estudiante con cupo asignado o en proceso preliminar de matrícula',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'ESTADOS_MATRICULA',
      codigo: 'MATRICULADO',
      nombre: 'Matriculado Activo',
      colorHex: '#16a34a',
      descripcion: 'Estudiante activo formalmente registrado en el ciclo académico',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'ESTADOS_MATRICULA',
      codigo: 'RETIRADO',
      nombre: 'Retirado',
      colorHex: '#dc2626',
      descripcion: 'Estudiante desvinculado o trasladado oficialmente',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'ESTADOS_MATRICULA',
      codigo: 'GRADUADO',
      nombre: 'Graduado Oficial',
      colorHex: '#2563eb',
      descripcion: 'Estudiante que ha culminado satisfactoriamente su programa de estudios',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'ESTADOS_MATRICULA',
      codigo: 'ANULADO',
      nombre: 'Anulado',
      colorHex: '#64748b',
      descripcion: 'Registro de matrícula cancelado o anulado administrativamente',
      orden: 5,
      activo: true,
    },
  ],
  TIPOS_MATRICULA: [
    {
      id: '1',
      grupo: 'TIPOS_MATRICULA',
      codigo: 'NUEVA',
      nombre: 'Estudiante Nuevo',
      valor: 'NUEVA',
      descripcion: 'Estudiante que ingresa por primera vez a la institución educativa',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'TIPOS_MATRICULA',
      codigo: 'RENOVACION',
      nombre: 'Renovación Anual',
      valor: 'RENOVACION',
      descripcion: 'Renovación de matrícula de estudiante antiguo para el año lectivo',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'TIPOS_MATRICULA',
      codigo: 'TRANSFERENCIA',
      nombre: 'Transferencia de otra institución',
      valor: 'TRANSFERENCIA',
      descripcion: 'Estudiante procedente de otra institución con homologación de expediente',
      orden: 3,
      activo: true,
    },
  ],
  ESTADOS_PAGO: [
    {
      id: '1',
      grupo: 'ESTADOS_PAGO',
      codigo: 'APROBADO',
      nombre: 'Aprobado',
      colorHex: '#166534',
      descripcion: 'Pago confirmado y aplicado exitosamente',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'ESTADOS_PAGO',
      codigo: 'PENDIENTE',
      nombre: 'Pendiente Verificación',
      colorHex: '#d97706',
      descripcion: 'Pago en proceso de conciliación bancaria o comprobante pendiente',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'ESTADOS_PAGO',
      codigo: 'RECHAZADO',
      nombre: 'Rechazado',
      colorHex: '#dc2626',
      descripcion: 'Transacción declinada o comprobante inválido',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'ESTADOS_PAGO',
      codigo: 'ANULADO',
      nombre: 'Anulado',
      colorHex: '#64748b',
      descripcion: 'Registro de pago cancelado por rectificación contable',
      orden: 4,
      activo: true,
    },
  ],
  ESTADOS_ACUERDO: [
    {
      id: '1',
      grupo: 'ESTADOS_ACUERDO',
      codigo: 'ACTIVO',
      nombre: 'Activo Vigente',
      colorHex: '#2563eb',
      descripcion: 'Acuerdo de pago formalizado con cuotas al día',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'ESTADOS_ACUERDO',
      codigo: 'CUMPLIDO',
      nombre: 'Cumplido al 100%',
      colorHex: '#16a34a',
      descripcion: 'Acuerdo totalmente cancelado y deuda finiquitada',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'ESTADOS_ACUERDO',
      codigo: 'INCUMPLIDO',
      nombre: 'Incumplido en Mora',
      colorHex: '#dc2626',
      descripcion: 'Acuerdo con cuotas vencidas y bloqueo de beneficios',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'ESTADOS_ACUERDO',
      codigo: 'ANULADO',
      nombre: 'Anulado',
      colorHex: '#64748b',
      descripcion: 'Acuerdo cancelado o renegociado administrativamente',
      orden: 4,
      activo: true,
    },
  ],
  MESES_ESCOLARES: [
    { id: '1', grupo: 'MESES_ESCOLARES', codigo: 'FEBRERO', nombre: 'Febrero', mesNum: 2, abreviatura: 'FEB', diasCobro: 10, orden: 1, activo: true },
    { id: '2', grupo: 'MESES_ESCOLARES', codigo: 'MARZO', nombre: 'Marzo', mesNum: 3, abreviatura: 'MAR', diasCobro: 10, orden: 2, activo: true },
    { id: '3', grupo: 'MESES_ESCOLARES', codigo: 'ABRIL', nombre: 'Abril', mesNum: 4, abreviatura: 'ABR', diasCobro: 10, orden: 3, activo: true },
    { id: '4', grupo: 'MESES_ESCOLARES', codigo: 'MAYO', nombre: 'Mayo', mesNum: 5, abreviatura: 'MAY', diasCobro: 10, orden: 4, activo: true },
    { id: '5', grupo: 'MESES_ESCOLARES', codigo: 'JUNIO', nombre: 'Junio', mesNum: 6, abreviatura: 'JUN', diasCobro: 10, orden: 5, activo: true },
    { id: '6', grupo: 'MESES_ESCOLARES', codigo: 'JULIO', nombre: 'Julio', mesNum: 7, abreviatura: 'JUL', diasCobro: 10, orden: 6, activo: true },
    { id: '7', grupo: 'MESES_ESCOLARES', codigo: 'AGOSTO', nombre: 'Agosto', mesNum: 8, abreviatura: 'AGO', diasCobro: 10, orden: 7, activo: true },
    { id: '8', grupo: 'MESES_ESCOLARES', codigo: 'SEPTIEMBRE', nombre: 'Septiembre', mesNum: 9, abreviatura: 'SEP', diasCobro: 10, orden: 8, activo: true },
    { id: '9', grupo: 'MESES_ESCOLARES', codigo: 'OCTUBRE', nombre: 'Octubre', mesNum: 10, abreviatura: 'OCT', diasCobro: 10, orden: 9, activo: true },
    { id: '10', grupo: 'MESES_ESCOLARES', codigo: 'NOVIEMBRE', nombre: 'Noviembre', mesNum: 11, abreviatura: 'NOV', diasCobro: 10, orden: 10, activo: true },
  ],
  CUENTAS_CONTABLES_PUC: [
    { id: '1', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'PENSIONES_MATRICULAS', nombre: 'Pensiones y Matrículas', valor: '417505', orden: 1, activo: true },
    { id: '2', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'CARTERA_ESTUDIANTES', nombre: 'Cartera Estudiantes (Clientes)', valor: '130505', orden: 2, activo: true },
    { id: '3', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'ANTICIPOS_CLIENTES_NIIF_2805', nombre: 'Anticipos de Clientes (NIIF 2805)', valor: '280505', orden: 3, activo: true },
    { id: '4', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'CAJA_GENERAL', nombre: 'Caja General', valor: '110505', orden: 4, activo: true },
    { id: '5', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'BANCOS_NACIONALES', nombre: 'Bancos Nacionales', valor: '111005', orden: 5, activo: true },
    { id: '6', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'DESCUENTOS_BECAS', nombre: 'Descuentos y Becas Otorgadas', valor: '417595', orden: 6, activo: true },
    { id: '7', grupo: 'CUENTAS_CONTABLES_PUC', codigo: 'INTERESES_MORA', nombre: 'Intereses por Mora', valor: '421005', orden: 7, activo: true },
  ],
  ESCALA_DECRETO_1290: [
    {
      id: '1',
      grupo: 'ESCALA_DECRETO_1290',
      codigo: 'SUPERIOR',
      nombre: 'Desempeño Superior',
      rangoMin: 4.6,
      rangoMax: 5.0,
      colorHex: '#16a34a',
      bgHex: '#dcfce7',
      aprobado: true,
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'ESCALA_DECRETO_1290',
      codigo: 'ALTO',
      nombre: 'Desempeño Alto',
      rangoMin: 4.0,
      rangoMax: 4.5,
      colorHex: '#2563eb',
      bgHex: '#dbeafe',
      aprobado: true,
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'ESCALA_DECRETO_1290',
      codigo: 'BASICO',
      nombre: 'Desempeño Básico',
      rangoMin: 3.0,
      rangoMax: 3.9,
      colorHex: '#d97706',
      bgHex: '#fef3c7',
      aprobado: true,
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'ESCALA_DECRETO_1290',
      codigo: 'BAJO',
      nombre: 'Desempeño Bajo',
      rangoMin: 1.0,
      rangoMax: 2.9,
      colorHex: '#dc2626',
      bgHex: '#fee2e2',
      aprobado: false,
      orden: 4,
      activo: true,
    },
  ],
  DIMENSIONES_EVALUACION: [
    {
      id: '1',
      grupo: 'DIMENSIONES_EVALUACION',
      codigo: 'COGNITIVO',
      nombre: 'Saber (Cognitivo)',
      pesoPorcentaje: 40,
      descripcion: 'Apropiación de conceptos y resolución de problemas',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'DIMENSIONES_EVALUACION',
      codigo: 'PROCEDIMENTAL',
      nombre: 'Hacer (Procedimental)',
      pesoPorcentaje: 40,
      descripcion: 'Aplicación práctica, talleres, proyectos y evidencias',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'DIMENSIONES_EVALUACION',
      codigo: 'ACTITUDINAL',
      nombre: 'Ser / Convivir (Actitudinal)',
      pesoPorcentaje: 20,
      descripcion: 'Puntualidad, trabajo colaborativo, respeto y valores',
      orden: 3,
      activo: true,
    },
  ],
  ROLES_SISTEMA: [
    { id: '1', grupo: 'ROLES_SISTEMA', codigo: 'SUPERADMIN', nombre: 'Super Administrador del Sistema', icono: '👑', orden: 1, activo: true },
    { id: '2', grupo: 'ROLES_SISTEMA', codigo: 'RECTOR', nombre: 'Rectoría General', icono: '🏛️', orden: 2, activo: true },
    { id: '3', grupo: 'ROLES_SISTEMA', codigo: 'COORDINADOR', nombre: 'Coordinación Académica y Convivencia', icono: '📋', orden: 3, activo: true },
    { id: '4', grupo: 'ROLES_SISTEMA', codigo: 'DOCENTE', nombre: 'Docente Titular / Asignatura', icono: '👨‍🏫', orden: 4, activo: true },
    { id: '5', grupo: 'ROLES_SISTEMA', codigo: 'ESTUDIANTE', nombre: 'Estudiante', icono: '🎓', orden: 5, activo: true },
    { id: '6', grupo: 'ROLES_SISTEMA', codigo: 'ACUDIENTE', nombre: 'Padre de Familia / Acudiente', icono: '👨‍👩‍👧', orden: 6, activo: true },
    { id: '7', grupo: 'ROLES_SISTEMA', codigo: 'SECRETARIA', nombre: 'Secretaría Académica', icono: '📁', orden: 7, activo: true },
    { id: '8', grupo: 'ROLES_SISTEMA', codigo: 'CONTADOR', nombre: 'Tesorería y Contabilidad', icono: '💼', orden: 8, activo: true },
    { id: '9', grupo: 'ROLES_SISTEMA', codigo: 'PSICORIENTADOR', nombre: 'Orientación y Bienestar Escolar', icono: '🧠', orden: 9, activo: true },
    { id: '10', grupo: 'ROLES_SISTEMA', codigo: 'BIBLIOTECARIO', nombre: 'Gestión de Biblioteca', icono: '📚', orden: 10, activo: true },
    { id: '11', grupo: 'ROLES_SISTEMA', codigo: 'SERVICIOS_GENERALES', nombre: 'Servicios Generales y Portería', icono: '🛡️', orden: 11, activo: true },
  ],
  TIPOS_FALTA_LEY_1620: [
    {
      id: '1',
      grupo: 'TIPOS_FALTA_LEY_1620',
      codigo: 'TIPO_I',
      tipo: 'TIPO_I',
      nombre: 'Situaciones Tipo I (Conflictos cotidianos manejados sin daño físico o moral)',
      protocolo: 'Mediación pedagógica inmediata y compromiso restaurativo escolar',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'TIPOS_FALTA_LEY_1620',
      codigo: 'TIPO_II',
      tipo: 'TIPO_II',
      nombre: 'Situaciones Tipo II (Agresión escolar, ciberacoso o conductas con incapacidad médica)',
      protocolo: 'Atención médica, citación obligatoria y reporte oficial al sistema SIUCE',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'TIPOS_FALTA_LEY_1620',
      codigo: 'TIPO_III',
      tipo: 'TIPO_III',
      nombre: 'Situaciones Tipo III (Presunta comisión de delitos contra la libertad o integridad)',
      protocolo: 'Activación de ruta judicial urgente, reporte a ICBF, Policía de Infancia y Fiscalía',
      orden: 3,
      activo: true,
    },
  ],
  CONFIGURACION_FINANCIERA: [
    {
      id: '1',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'ANIO_LECTIVO_DEFECTO',
      nombre: 'Año Lectivo por Defecto',
      valor: '2026',
      descripcion: 'Año lectivo activo por defecto para matrículas y cobros',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'TARIFA_BASE_PENSION',
      nombre: 'Tarifa Base Pensión',
      valor: '450000',
      descripcion: 'Valor de pensión mensual estándar institucional',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'DIA_LIMITE_PAGO_DEFECTO',
      nombre: 'Día Límite de Pago Mensual',
      valor: '10',
      descripcion: 'Día máximo de cada mes para pago sin recargo',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'DIA_PAGO_ACUERDO_DEFECTO',
      nombre: 'Día de Pago en Acuerdos',
      valor: '15',
      descripcion: 'Día programado para cuotas de acuerdos de pago',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'CUOTAS_ACUERDO_DEFECTO',
      nombre: 'Cuotas Sugeridas para Acuerdos',
      valor: '3',
      descripcion: 'Número de cuotas estándar en refinanciación de cartera',
      orden: 5,
      activo: true,
    },
    {
      id: '6',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'VALOR_DEFAULT_ACUERDO',
      nombre: 'Valor Base de Acuerdo',
      valor: '900000',
      descripcion: 'Monto base sugerido para acuerdos de pago',
      orden: 6,
      activo: true,
    },
    {
      id: '7',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'MORA_PORCENTAJE_DEFAULT',
      nombre: 'Porcentaje de Interés por Mora',
      valor: '2.0',
      descripcion: 'Tasa mensual de mora aplicable a cuentas vencidas (%)',
      orden: 7,
      activo: true,
    },
    {
      id: '8',
      grupo: 'CONFIGURACION_FINANCIERA',
      codigo: 'DIAS_GRACIA_DEFAULT',
      nombre: 'Días de Gracia',
      valor: '5',
      descripcion: 'Días adicionales de tolerancia antes de aplicar mora',
      orden: 8,
      activo: true,
    },
  ],
  PORCENTAJES_BECA: [
    {
      id: '1',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'NINGUNA',
      nombre: 'Sin Beca (0%)',
      valor: '0',
      descripcion: 'Tarifa plena sin beca ni descuento',
      orden: 1,
      activo: true,
    },
    {
      id: '2',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'CONVENIO',
      nombre: 'Convenio Institucional (15%)',
      valor: '15',
      descripcion: 'Descuento por convenios interinstitucionales',
      orden: 2,
      activo: true,
    },
    {
      id: '3',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'HERMANOS',
      nombre: 'Hermanos / Familiar (20%)',
      valor: '20',
      descripcion: 'Descuento para familias con dos o más hermanos',
      orden: 3,
      activo: true,
    },
    {
      id: '4',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'VEINTICINCO',
      nombre: 'Descuento Especial (25%)',
      valor: '25',
      descripcion: 'Descuento del 25% aprobado por rectoría',
      orden: 4,
      activo: true,
    },
    {
      id: '5',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'DOCENTE',
      nombre: 'Hijo Docente / Colab. (30%)',
      valor: '30',
      descripcion: 'Beneficio para hijos de docentes y colaboradores',
      orden: 5,
      activo: true,
    },
    {
      id: '6',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'CINCUENTA',
      nombre: 'Media Beca (50%)',
      valor: '50',
      descripcion: 'Descuento del 50% de la pensión escolar',
      orden: 6,
      activo: true,
    },
    {
      id: '7',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'EXCELENCIA',
      nombre: 'Beca Excelencia Académica (50%)',
      valor: '50',
      descripcion: 'Beca por rendimiento académico superior',
      orden: 7,
      activo: true,
    },
    {
      id: '8',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'SETENTA_Y_CINCO',
      nombre: 'Beca Especial (75%)',
      valor: '75',
      descripcion: 'Descuento del 75% en pensiones',
      orden: 8,
      activo: true,
    },
    {
      id: '9',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'SOLIDARIA',
      nombre: 'Beca Solidaria Total (100%)',
      valor: '100',
      descripcion: 'Exención del 100% por caso de fuerza mayor o solidaridad',
      orden: 9,
      activo: true,
    },
    {
      id: '10',
      grupo: 'PORCENTAJES_BECA',
      codigo: 'CIEN',
      nombre: 'Beca Completa (100%)',
      valor: '100',
      descripcion: 'Beca integral del 100% de la pensión',
      orden: 10,
      activo: true,
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {
  private readonly api = inject(ApiService);

  private parseItem(p: Parametro): Parametro {
    let item = { ...p };
    if (item.valor && typeof item.valor === 'string' && item.valor.trim().startsWith('{')) {
      try {
        const meta = JSON.parse(item.valor);
        item = { ...item, ...meta };
      } catch {
        // ignore
      }
    }
    if (item.grupo === 'PERIODOS_ESTANDAR') {
      if (item.numero === undefined) item.numero = item.orden;
      if (item.peso === undefined) item.peso = Number(item.valor) || 25;
    }
    return item;
  }

  obtenerPorGrupo(grupo: string, colegioId?: string): Observable<Parametro[]> {
    const params: Record<string, string> = { grupo };
    if (colegioId) params['colegioId'] = colegioId;

    return this.api.get<Parametro[]>('parametros', params).pipe(
      map((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          return res.map((item) => this.parseItem(item)).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
        }
        return (DEFAULT_CATALOGS[grupo] || []).map((item) => this.parseItem(item)).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      }),
      catchError(() => of((DEFAULT_CATALOGS[grupo] || []).map((item) => this.parseItem(item)).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)))),
    );
  }

  obtenerPorCodigo(grupo: string, codigo: string, colegioId?: string): Observable<Parametro | undefined> {
    const params: Record<string, string> = {};
    if (colegioId) params['colegioId'] = colegioId;

    return this.api.get<Parametro>(`parametros/${grupo}/${codigo}`, params).pipe(
      map((res) => (res ? this.parseItem(res) : undefined)),
      catchError(() => {
        const list = DEFAULT_CATALOGS[grupo] || [];
        const found = list.find((p) => p.codigo === codigo);
        return of(found ? this.parseItem(found) : undefined);
      }),
    );
  }

  obtenerConfiguracionFinanciera(colegioId?: string): Observable<ConfiguracionFinanciera> {
    const params: Record<string, string> = {};
    if (colegioId) params['colegioId'] = colegioId;

    const fallbackConfig: ConfiguracionFinanciera = {
      anioLectivoDefecto: 2026,
      tarifaBasePension: 450000,
      diaLimitePagoDefecto: 10,
      diaPagoAcuerdoDefecto: 15,
      cuotasAcuerdoDefecto: 3,
      valorDefaultAcuerdo: 900000,
      moraPorcentajeDefault: 2.0,
      diasGraciaDefault: 5,
    };

    return this.api.get<ConfiguracionFinanciera>('parametros/configuracion-financiera', params).pipe(
      map((res) => (res && Object.keys(res).length > 0 ? res : fallbackConfig)),
      catchError(() => of(fallbackConfig)),
    );
  }

  obtenerPorcentajesBeca(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('PORCENTAJES_BECA', colegioId);
  }

  obtenerMapaPorcentajesBeca(colegioId?: string): Observable<Record<string, number>> {
    return this.obtenerMapaValores('PORCENTAJES_BECA', colegioId);
  }

  obtenerMapaValores(grupo: string, colegioId?: string): Observable<Record<string, number>> {
    return this.obtenerPorGrupo(grupo, colegioId).pipe(
      map((items) => {
        const result: Record<string, number> = {};
        for (const item of items) {
          result[item.codigo] = Number(item.valor) || 0;
        }
        return result;
      }),
    );
  }

  obtenerPeriodosEstandar(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('PERIODOS_ESTANDAR', colegioId);
  }

  obtenerDocumentosIdentidad(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('DOCUMENTOS_IDENTIDAD', colegioId);
  }

  obtenerEstadosMatricula(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('ESTADOS_MATRICULA', colegioId);
  }

  obtenerTiposMatricula(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('TIPOS_MATRICULA', colegioId);
  }

  obtenerEstadosPago(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('ESTADOS_PAGO', colegioId);
  }

  obtenerEstadosAcuerdo(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('ESTADOS_ACUERDO', colegioId);
  }

  obtenerMesesEscolares(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('MESES_ESCOLARES', colegioId);
  }

  obtenerCuentasContablesPuc(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('CUENTAS_CONTABLES_PUC', colegioId);
  }

  obtenerEscalaDecreto1290(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('ESCALA_DECRETO_1290', colegioId);
  }

  obtenerDimensionesEvaluacion(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('DIMENSIONES_EVALUACION', colegioId);
  }

  obtenerRolesSistema(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('ROLES_SISTEMA', colegioId);
  }

  obtenerTiposFaltaLey1620(colegioId?: string): Observable<Parametro[]> {
    return this.obtenerPorGrupo('TIPOS_FALTA_LEY_1620', colegioId);
  }

  guardarConfiguracionFinanciera(
    dto: Partial<ConfiguracionFinanciera>,
    colegioId?: string,
  ): Observable<ConfiguracionFinanciera> {
    return this.api.put<ConfiguracionFinanciera>(
      'parametros/configuracion-financiera',
      { ...dto, colegioId },
    );
  }

  crearParametro(parametro: Partial<Parametro>, colegioId?: string): Observable<Parametro> {
    return this.api.post<Parametro>('parametros', { ...parametro, colegioId });
  }

  actualizarParametro(id: string, parametro: Partial<Parametro>, colegioId?: string): Observable<Parametro> {
    return this.api.put<Parametro>(`parametros/${id}`, { ...parametro, colegioId });
  }

  eliminarParametro(id: string, colegioId?: string): Observable<any> {
    return this.api.delete<any>(`parametros/${id}`);
  }

  restablecerDefecto(grupo: string, colegioId: string): Observable<any> {
    return this.api.post<any>('parametros/restablecer-defecto', { grupo, colegioId });
  }

  // --- ALERTAS ACADÉMICAS Y BARRIDO DE MATERIAS PERDIDAS ---

  obtenerConfiguracionAlertasAcademicas(
    colegioId?: string,
  ): Observable<ConfiguracionAlertasAcademicas> {
    const params: Record<string, string> = {};
    if (colegioId) params['colegioId'] = colegioId;

    const fallback: ConfiguracionAlertasAcademicas = {
      diasNotificacion: ['VIERNES'],
      barridoActivo: true,
      horaEnvio: '18:00',
      notaCorteAprobacion: 3.0,
      minimoMateriasPerdidas: 1,
      canalesNotificacion: ['PLATAFORMA_WEB', 'EMAIL'],
      colegioId: colegioId || null,
    };

    return this.api
      .get<ConfiguracionAlertasAcademicas>(
        'academico/alertas-materias-perdidas/configuracion',
        params,
      )
      .pipe(
        map((res) => (res && Object.keys(res).length > 0 ? res : fallback)),
        catchError(() => of(fallback)),
      );
  }

  guardarConfiguracionAlertasAcademicas(
    dto: Partial<ConfiguracionAlertasAcademicas>,
    colegioId?: string,
  ): Observable<ConfiguracionAlertasAcademicas> {
    return this.api.put<ConfiguracionAlertasAcademicas>(
      'academico/alertas-materias-perdidas/configuracion',
      { ...dto, colegioId },
    );
  }

  previsualizarBarridoMateriasPerdidas(
    periodoId?: string,
    colegioId?: string,
  ): Observable<PrevisualizacionBarridoResponse> {
    const params: Record<string, string> = {};
    if (periodoId) params['periodoId'] = periodoId;
    if (colegioId) params['colegioId'] = colegioId;

    return this.api.get<PrevisualizacionBarridoResponse>(
      'academico/alertas-materias-perdidas/previsualizar',
      params,
    );
  }

  ejecutarBarridoMateriasPerdidas(
    periodoId?: string,
    colegioId?: string,
  ): Observable<ResultadoBarridoEjecutado> {
    return this.api.post<ResultadoBarridoEjecutado>(
      'academico/alertas-materias-perdidas/ejecutar-barrido',
      { periodoId, colegioId },
    );
  }
}

