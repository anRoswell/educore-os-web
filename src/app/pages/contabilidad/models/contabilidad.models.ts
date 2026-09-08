// ============================================================================
// EduCoreOS — Contabilidad NIIF: Modelos y Tipos Fuertemente Tipados
// Conforme a NIIF para Pymes (Decreto 2420) y Arquitectura Angular 22
// ============================================================================

export type AccountNature = 'DEBITO' | 'CREDITO';
export type TipoComprobante = 'CAU' | 'ING' | 'EGR' | 'AJU' | 'NOT' | 'CIER' | 'APE' | 'CIE' | 'APR';
export type EstadoAsiento = 'POSTED' | 'DRAFT' | 'VOID' | 'ACTIVO' | 'ANULADO';
export type EstadoPeriodo = 'ABIERTO' | 'BLOQUEADO' | 'CERRADO';
export type TipoIdentificacion = 'CC' | 'NIT' | 'CE' | 'PP' | 'TI' | 'RC';
export type TipoPersona = 'NATURAL' | 'JURIDICA';

export interface PucCuenta {
  id: string;
  colegioId?: string;
  codigo: string;
  nombre: string;
  naturaleza: AccountNature;
  nivel: number;
  esAuxiliar: boolean;
  parentId?: string;
  categoriaNiif?: string;
  manejaTercero: boolean;
  manejaCentroCosto: boolean;
  manejaMatricula?: boolean;
  activo: boolean;
  children?: PucCuenta[];
}

export interface Tercero {
  id: string;
  colegioId?: string;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  digitoVerificacion?: number;
  tipoPersona: TipoPersona;
  primerNombre?: string;
  primerApellido?: string;
  razonSocial?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export interface PeriodoContable {
  id: string;
  colegioId?: string;
  anio: number;
  mes: number;
  estado: EstadoPeriodo;
  fechaApertura: string;
  fechaCierre?: string;
  cerradoPor?: string;
  observaciones?: string;
  usuarioCierre?: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
}

export interface AsientoLinea {
  id?: string;
  asientoId?: string;
  lineaNumero?: number;
  cuentaId?: string;
  cuentaPucId?: string;
  cuentaCodigo?: string;
  cuentaNombre?: string;
  cuenta?: {
    id: string;
    codigo: string;
    nombre: string;
    naturaleza: AccountNature;
  };
  terceroId?: string;
  terceroNombre?: string;
  tercero?: {
    id: string;
    numeroIdentificacion: string;
    nombreCompleto: string;
  };
  centroCostoId?: string;
  matriculaId?: string;
  documentoReferencia?: string;
  descripcion?: string;
  debito: number;
  credito: number;
}

export interface Asiento {
  id: string;
  colegioId?: string;
  tipoComprobante: TipoComprobante;
  consecutivo: number;
  numeroComprobante?: string;
  fechaContable: string;
  periodoId?: string;
  concepto?: string;
  totalDebito: number;
  totalCredito: number;
  diferencia?: number;
  estado: EstadoAsiento;
  fuenteModulo?: string;
  fuenteId?: string;
  motivoAnulacion?: string;
  voidedAt?: string;
  voidedBy?: string;
  usuarioCreador?: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
  usuarioAnulador?: {
    id: string;
    nombreCompleto: string;
  };
  lineas: AsientoLinea[];
  generadoEn: string;
}

// ============================================================================
// Modelos DIAN & Facturación Electrónica UBL 2.1
// ============================================================================

export type AmbienteDian = 'HABILITACION' | 'PRODUCCION';
export type TipoDocumentoElectronico =
  | 'FACTURA_VENTA_01'
  | 'NOTA_CREDITO_91'
  | 'NOTA_DEBITO_92'
  | 'DOCUMENTO_SOPORTE_05';
export type EstadoDianDocumento =
  | 'BORRADOR'
  | 'FIRMADO'
  | 'ENVIADO'
  | 'ACEPTADO'
  | 'RECHAZADO';

export interface DianConfigModel {
  id?: string;
  colegioId?: string;
  ambiente: AmbienteDian;
  nitEmisor: string;
  dvEmisor: string;
  razonSocialEmisor: string;
  prefijoFactura: string;
  rangoDesde: number;
  rangoHasta: number;
  ultimoConsecutivo?: number;
  resolucionDian?: string;
  fechaResolucionDesde?: string;
  fechaResolucionHasta?: string;
  claveTecnica?: string;
  pinSoftware?: string;
  idSoftware?: string;
  testSetId?: string;
  certificadoDigitalBase64?: string;
  passwordCertificado?: string;
  activo?: boolean;
  prefijoNc?: string;
  ultimoConsecutivoNc?: number;
  prefijoNd?: string;
  ultimoConsecutivoNd?: number;
  prefijoDs?: string;
  ultimoConsecutivoDs?: number;
  resolucionDs?: string;
  rangoDesdeDs?: number;
  rangoHastaDs?: number;
}

export interface DocumentoElectronicoModel {
  id: string;
  colegioId: string;
  tipoDocumento: TipoDocumentoElectronico;
  prefijo: string;
  numero: string;
  fechaEmision: string;
  horaEmision: string;
  terceroId: string;
  tercero?: Tercero;
  cuentaCobroId?: string;
  cuentaCobro?: any;
  subtotal: number;
  descuentos: number;
  iva: number;
  retenciones: number;
  total: number;
  cufeCude?: string;
  codigoQr?: string;
  estadoDian: EstadoDianDocumento;
  codigoRespuestaDian?: string;
  mensajeRespuestaDian?: string;
  trackIdDian?: string;
  createdAt: string;
}

export interface AsientosPaginados {
  data: Asiento[];
  total: number;
  page: number;
  limit: number;
}

export interface ConceptoMapping {
  id: string;
  colegioId?: string;
  conceptoCobroId?: string;
  conceptoNombre?: string;
  tipoConceptoCodigo: string;
  cuentaIngresoId?: string;
  cuentaIngresoPucId?: string;
  cuentaIngresoCodigo?: string;
  cuentaIngreso?: PucCuenta;
  cuentaCxcId?: string;
  cuentaCxc?: PucCuenta;
  cuentaAnticiposPucId?: string;
  cuentaAnticiposCodigo?: string;
  cuentaDescuentoId?: string;
  cuentaDescuento?: PucCuenta;
  cuentaCajaBancoDefaultId?: string;
  cuentaCajaBancoDefault?: PucCuenta;
  centroCostoId?: string;
  activo: boolean;
}

export interface CuentaReporte {
  codigo: string;
  nombre: string;
  naturaleza: AccountNature;
  nivel: number;
  totalDebito: number;
  totalCredito: number;
  saldo: number;
}

export interface BalanceGeneral {
  colegioId?: string;
  fechaCorte: string;
  activos: CuentaReporte[];
  pasivos: CuentaReporte[];
  patrimonio: CuentaReporte[];
  totalActivos: number;
  totalPasivos: number;
  totalPatrimonio: number;
  cuadra: boolean;
}

export interface EstadoResultados {
  colegioId?: string;
  desde: string;
  hasta: string;
  ingresos: CuentaReporte[];
  gastos: CuentaReporte[];
  costos?: CuentaReporte[];
  totalIngresos: number;
  totalGastos: number;
  totalCostos?: number;
  excedente: number;
}

export interface LibroDiarioItem {
  fecha: string;
  tipo: TipoComprobante;
  consecutivo: number;
  concepto: string;
  codigoCuenta: string;
  nombreCuenta: string;
  terceroNombre?: string | null;
  debito: number;
  credito: number;
}

export interface LibroMayorMovimiento {
  fecha: string;
  tipo: string;
  consecutivo: number;
  concepto: string;
  debito: number;
  credito: number;
  saldoAcumulado: number;
}

export interface LibroMayorCuenta {
  codigoCuenta: string;
  nombreCuenta: string;
  naturaleza: AccountNature;
  saldoInicial: number;
  movimientos: LibroMayorMovimiento[];
  totalDebitos: number;
  totalCreditos: number;
  saldoFinal: number;
}

export interface AuxiliarTerceroMovimiento {
  fecha: string;
  comprobante: string;
  cuentaCodigo: string;
  cuentaNombre: string;
  concepto: string;
  debito: number;
  credito: number;
  saldoAcumulado: number;
}

export interface AuxiliarTerceroReporte {
  terceroId: string;
  terceroNombre: string;
  numeroIdentificacion: string;
  fechaInicio: string;
  fechaFin: string;
  movimientos: AuxiliarTerceroMovimiento[];
  totalDebito: number;
  totalCredito: number;
  saldoFinal: number;
}

// ─── Interfaces de formulario ─────────────────────────────────────────────
export interface AsientoLineaForm {
  cuentaId?: string;
  cuentaPucId?: string;
  cuentaCodigo: string;
  cuentaNombre?: string;
  terceroId?: string;
  centroCostoId?: string;
  matriculaId?: string;
  descripcion: string;
  debito: number | null;
  credito: number | null;
}

export interface AsientoForm {
  tipoComprobante: TipoComprobante;
  fechaContable: string;
  concepto: string;
  lineas: AsientoLineaForm[];
}

// ─── Ingresos Diferidos NIIF 15 ───────────────────────────────────────────
export interface AmortizacionCuotaModel {
  id?: string;
  mes: number;
  anio: number;
  monto: number;
  estado: 'PENDIENTE' | 'AMORTIZADA' | 'REVERTIDA';
  fechaAmortizacion?: string;
  asientoId?: string;
}

export interface IngresoDiferidoModel {
  id: string;
  colegioId: string;
  estudianteId?: string;
  matriculaId?: string;
  estudianteNombre?: string;
  concepto: string;
  valorTotal: number;
  cuotasPactadas: number;
  cuotasAmortizadas: number;
  saldoPendiente: number;
  anioLectivo: number;
  estado: 'ACTIVO' | 'LIQUIDADO' | 'CANCELADO';
  cuentaPasivoCodigo: string;
  cuentaIngresoCodigo: string;
  cuotas?: AmortizacionCuotaModel[];
  createdAt?: string;
}

// ─── Nómina Contable NIC 19 ───────────────────────────────────────────────
export interface NominaResumenModel {
  mes: number;
  anio: number;
  totalDocentes: number;
  totalDevengado: number;
  totalSueldoBasico: number;
  totalAuxilioTransporte: number;
  totalBonificaciones: number;
  totalDeduccionSalud: number;
  totalDeduccionPension: number;
  totalOtrasDeducciones: number;
  totalNetoAPagar: number;
  provisiones: {
    cesantias: number;
    interesesCesantias: number;
    primaServicios: number;
    vacaciones: number;
    totalProvisiones: number;
  };
  asientoCausacionId?: string;
  asientoProvisionesId?: string;
  asientoDispersionId?: string;
}

// ─── Cierre Contable Periodo 13 & Apertura ────────────────────────────────
export interface BalancePrevioCierreModel {
  anio: number;
  totalClase4Ingresos: number;
  totalClase5Gastos: number;
  totalClase6Costos: number;
  excedenteNeto: number;
  cuentaPatrimonialDestino: string;
  balanceCuadrado: boolean;
}

export interface ResultadoCierreModel {
  asientoCierId: string;
  tipoComprobante: string;
  consecutivo: number;
  periodosCerrados: number;
  saldoCuentas456: number;
  trasladoExcedente: number;
  cuentaExcedente: string;
  estadoPeriodo: string;
}

export interface ResultadoAperturaModel {
  asientoApeId: string;
  tipoComprobante: string;
  anio: number;
  totalDebito: number;
  totalCredito: number;
  diferencia: number;
  estado: string;
}

// ─── Caja Menor & Fondos Fijos Escolar ────────────────────────────────────
export interface CajaMenorLegalizacionModel {
  id: string;
  colegioId: string;
  cajaMenorId: string;
  fechaGasto: string;
  numeroRecibo: string;
  terceroId?: string;
  terceroNombre: string;
  terceroNit: string;
  concepto: string;
  cuentaPucGasto: string;
  valorBruto: number;
  valorRetencion: number;
  valorNeto: number;
  estado: 'PENDIENTE' | 'REEMBOLSADO' | 'ANULADO';
  asientoEgresoId?: string;
  comprobanteEgresoNumero?: string;
  createdAt?: string;
}

export interface CajaMenorModel {
  id: string;
  colegioId: string;
  nombre: string;
  responsableNombre: string;
  responsableCargo?: string;
  montoAutorizado: number;
  saldoDisponible: number;
  porcentajeDisponible?: number;
  totalGastadoPendiente?: number;
  alertaReposicion?: boolean;
  cantidadGastosPendientes?: number;
  cuentaPucCaja: string;
  cuentaPucBancos: string;
  umbralAlertaPorcentaje: number;
  estado: 'ACTIVA' | 'EN_REPOSICION' | 'CERRADA';
  legalizaciones?: CajaMenorLegalizacionModel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearCajaMenorModel {
  colegioId?: string;
  nombre: string;
  responsableNombre: string;
  responsableCargo?: string;
  montoAutorizado: number;
  cuentaPucCaja?: string;
  cuentaPucBancos?: string;
  umbralAlertaPorcentaje?: number;
}

export interface RegistrarGastoCajaMenorModel {
  colegioId?: string;
  cajaMenorId?: string;
  fechaGasto: string;
  numeroRecibo: string;
  terceroNombre: string;
  terceroNit: string;
  concepto: string;
  cuentaPucGasto: string;
  valorBruto: number;
  valorRetencion?: number;
  valorNeto?: number;
}

// ─── Certificados a Proveedores Art. 381 & Formulario 350 ─────────────────
export interface ProveedorRetencionModel {
  terceroId: string;
  razonSocial: string;
  numeroDocumento: string;
  tipoDocumento: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  totalRetenido: number;
  totalBaseGravable: number;
  cantidadOperaciones: number;
  tiposRetencion: string[];
}

export interface CertificadoProveedorDetalleModel {
  cuentaCodigo: string;
  cuentaNombre: string;
  concepto: string;
  baseGravable: number;
  porcentajeTarifa: number;
  montoRetenido: number;
  tipoRetencion: 'RETEFUENTE' | 'RETEIVA' | 'RETEICA';
}

export interface CertificadoProveedorResumenModel {
  colegioId: string;
  colegioNombre: string;
  colegioNit: string;
  colegioDireccion?: string;
  colegioCiudad?: string;
  terceroId: string;
  terceroNombre: string;
  terceroNit: string;
  terceroDireccion?: string;
  terceroCiudad?: string;
  terceroEmail?: string;
  anioGravable: number;
  fechaExpedicion: string;
  ciudadExpedicion: string;
  detalles: CertificadoProveedorDetalleModel[];
  totalBaseGravable: number;
  totalRetenido: number;
  totalRetenidoLetras: string;
  contadorNombre?: string;
  contadorTP?: string;
  codigoVerificacion?: string;
}

export interface RenglonFormulario350Model {
  codigoRenglon: string;
  concepto: string;
  cuentasPuc: string[];
  baseGravable: number;
  retencion: number;
}

export interface Formulario350ResumenModel {
  colegioId: string;
  colegioNombre: string;
  colegioNit: string;
  anio: number;
  mes: number;
  periodoNombre: string;
  renglonesRenta: RenglonFormulario350Model[];
  renglonesIva: RenglonFormulario350Model[];
  totalBasesRenta: number;
  totalRetencionesRenta: number;
  totalBasesIva: number;
  totalRetencionesIva: number;
  totalRetencionesPagar: number;
  totalRetencionesLetras: string;
  fechaGeneracion: string;
}
