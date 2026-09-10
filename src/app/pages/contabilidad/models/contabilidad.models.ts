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
  tipoIdentificacion?: TipoIdentificacion;
  tipoDocumento?: TipoIdentificacion | string;
  numeroIdentificacion?: string;
  numeroDocumento?: string;
  digitoVerificacion?: number;
  tipoPersona: TipoPersona;
  primerNombre?: string;
  primerApellido?: string;
  razonSocial?: string;
  nombreCompleto?: string;
  esEstudiante?: boolean;
  esAcudiente?: boolean;
  esDocente?: boolean;
  esColaborador?: boolean;
  esProveedor?: boolean;
  esOtro?: boolean;
  bancoCodigo?: string;
  bancoNombre?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export type TerceroModel = Tercero;

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

export interface FacturaDirectaItemModel {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  iva?: number;
  porcentajeIva?: number;
  subtotal?: number;
  total?: number;
  cuentaIngresoCodigo?: string;
}

export interface EmitirFacturaDirectaModel {
  sendToDian?: boolean;
  terceroId: string;
  clienteNombre: string;
  clienteNumeroDocumento: string;
  clienteTipoDocumento?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  items: FacturaDirectaItemModel[];
  observaciones?: string;
  medioPago?: string;
  fechaVencimiento?: string;
}

export interface EmitirFacturasMasivasModel {
  sendToDian?: boolean;
  mes?: number;
  anio?: number;
  cuentasCobroIds?: string[];
}

export interface ResultadoFacturasMasivasModel {
  success: boolean;
  totalProcesadas: number;
  exitosas: number;
  fallidas: number;
  detalles: {
    cuentaCobroId: string;
    estudianteNombre?: string;
    documentoId?: string;
    numero?: string;
    cufe?: string;
    estadoDian?: string;
    error?: string;
  }[];
}

export interface EnviarFacturaEmailModel {
  emailDestino?: string;
  asunto?: string;
  mensaje?: string;
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
  xmlFirmadoUbl?: string;
  pdfUrl?: string;
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

// ─── Deterioro de Cartera NIIF 9 ───────────────────────────────────────────
export interface TramoDeterioroModel {
  rango: string;
  saldo: number;
  porcentajeNIIF: number;
  valorDeterioro: number;
}

export interface MatrizDeterioroModel {
  fechaCorte: string;
  totalCartera: number;
  tramos: TramoDeterioroModel[];
  totalDeterioroCalculado: number;
  cuentaDebito: string;
  cuentaCredito: string;
}

export interface ResultadoAsientoDeterioroModel {
  asientoId: string;
  tipoComprobante: string;
  consecutivo: number;
  concepto: string;
  totalDebito: number;
  totalCredito: number;
  diferencia: number;
  estado: string;
  chkCuadrado: boolean;
}

// ─── Conciliación Bancaria ──────────────────────────────────────────────────
export interface AutoMatchResultadoModel {
  coincidenciasExactas: number;
  partidasConciliadas: number;
  partidasPendientes: number;
  tasaExito: number;
  diferenciaNeta: number;
}

export interface InformeConciliacionModel {
  saldoExtracto: number;
  menosChequesGiradosNoCobrados: number;
  masConsignacionesEnTransito: number;
  menosNotasDebitoNoContabilizadas: number;
  saldoConciliadoLibros: number;
  saldoLibrosContables: number;
  diferencia: number;
}

// ─── Información Exógena DIAN ───────────────────────────────────────────────
export interface ExogenaValidacionAlertaModel {
  terceroId: string;
  numeroDocumento: string;
  nombreCompleto: string;
  tipoAlerta: 'NIT_INVALIDO' | 'DIRECCION_FALTANTE' | 'CODIGO_DANE_INVALIDO';
  descripcion: string;
}

export interface ExogenaValidacionModel {
  valido: boolean;
  totalTercerosAuditados: number;
  alertasNits: number;
  alertasDirecciones: number;
  alertasCodigosDane: number;
  detalles?: ExogenaValidacionAlertaModel[];
}

export interface ExogenaExportacionModel {
  formato: string;
  version: string;
  anio: number;
  registros: number;
  totalPagos?: number;
  totalRetenciones?: number;
  totalIngresos?: number;
  totalSaldos?: number;
  columnas: string[];
  datos: Record<string, any>[];
}

// ─── Activos Fijos, Depreciación y Desvalorización NIIF ──────────────────────
export type CategoriaActivoFijo =
  | 'EQUIPO_COMPUTO'
  | 'VEHICULO_TRANSPORTE'
  | 'MUEBLES_ENSERES'
  | 'MAQUINARIA_EQUIPO'
  | 'EDIFICACIONES'
  | 'TERRENO'
  | 'SOFTWARE_INTANGIBLE'
  | 'OTROS';

export type EstadoActivoFijo = 'ACTIVO' | 'TOTALMENTE_DEPRECIADO' | 'DESVALORIZADO' | 'DADO_DE_BAJA';

export interface ActivoFijoDepreciacionModel {
  id: string;
  activoId: string;
  periodoAnio: number;
  periodoMes: number;
  cuotaDepreciacion: number;
  depreciacionAcumuladaResultante: number;
  valorEnLibrosResultante: number;
  asientoId?: string;
  createdAt: string;
}

export interface ActivoFijoDeterioroModel {
  id: string;
  activoId: string;
  fechaTest: string;
  valorEnLibrosAnterior: number;
  importeRecuperable: number;
  perdidaDeterioro: number;
  motivo: string;
  asientoId?: string;
  createdAt: string;
}

export interface ActivoFijoModel {
  id: string;
  colegioId: string;
  placa: string;
  nombre: string;
  categoria: CategoriaActivoFijo;
  fechaAdquisicion: string;
  costoAdquisicion: number;
  valorResidual: number;
  vidaUtilMeses: number;
  mesesDepreciados: number;
  depreciacionAcumulada: number;
  deterioroAcumulado: number;
  valorEnLibros: number;
  cuentaActivo: string;
  cuentaGastoDepreciacion: string;
  cuentaDepreciacionAcumulada: string;
  cuentaGastoDeterioro: string;
  cuentaDeterioroAcumulado: string;
  centroCostoCodigo?: string;
  ubicacionFisica?: string;
  responsableNombre?: string;
  estado: EstadoActivoFijo;
  depreciaciones?: ActivoFijoDepreciacionModel[];
  deterioros?: ActivoFijoDeterioroModel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearActivoFijoModel {
  placa: string;
  nombre: string;
  categoria: CategoriaActivoFijo;
  fechaAdquisicion: string;
  costoAdquisicion: number;
  valorResidual?: number;
  vidaUtilMeses?: number;
  cuentaActivo?: string;
  cuentaGastoDepreciacion?: string;
  cuentaDepreciacionAcumulada?: string;
  centroCostoCodigo?: string;
  ubicacionFisica?: string;
  responsableNombre?: string;
}

export interface DepreciarMesModel {
  periodoAnio: number;
  periodoMes: number;
}

export interface ResultadoDepreciacionMesModel {
  totalActivosDepreciados: number;
  totalDepreciacionMes: number;
  asientoId?: string;
  asientoConsecutivo?: number;
}

export interface RegistrarDeterioroActivoModel {
  activoId: string;
  fechaTest: string;
  importeRecuperable: number;
  motivo: string;
}

export interface ResumenPatrimonialActivosModel {
  totalActivos: number;
  costoHistoricoTotal: number;
  depreciacionAcumuladaTotal: number;
  deterioroAcumuladoTotal: number;
  valorNetoEnLibros: number;
  activosPorCategoria: Record<string, number>;
}

// Modelos para Flujo de Efectivo NIC 7 y Notas NIIF
export interface FlujoEfectivoPartidaModel {
  concepto: string;
  valor: number;
  tipo: 'SUMA' | 'RESTA' | 'SUBTOTAL';
  nota?: string;
}

export interface FlujoEfectivoModel {
  colegioId: string;
  desde: string;
  hasta: string;
  excedenteNeto: number;
  ajustesNoMonetarios: FlujoEfectivoPartidaModel[];
  cambiosCapitalTrabajo: FlujoEfectivoPartidaModel[];
  flujoNetoOperacion: number;
  actividadesInversion: FlujoEfectivoPartidaModel[];
  flujoNetoInversion: number;
  actividadesFinanciacion: FlujoEfectivoPartidaModel[];
  flujoNetoFinanciacion: number;
  variacionNetaEfectivo: number;
  saldoInicialEfectivo: number;
  saldoFinalEfectivo: number;
  conciliado: boolean;
}

export interface NotaNiifItemModel {
  numero: number;
  titulo: string;
  normaReferencia: string;
  contenido: string;
  tablaDatos?: { columnas: string[]; filas: (string | number)[][] };
}

export interface NotasNiifModel {
  colegioId: string;
  anio: number;
  fechaEmision: string;
  institucion: {
    nombre: string;
    nit: string;
    codigoDane?: string;
    resolucionAprobacion?: string;
    ciudad: string;
    direccion?: string;
  };
  firmas?: {
    rector: { nombre: string; cargo: string };
    contador: { nombre: string; cargo: string; tarjetaProfesional?: string };
    revisorFiscal?: { nombre: string; cargo: string; tarjetaProfesional?: string };
  };
  notas: NotaNiifItemModel[];
}


// ─── Documento Soporte Electrónico (No Obligados) DIAN ─────────────────────
export type EstadoDianDocumentoSoporte = 'BORRADOR' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
export type TipoNotaDocumentoSoporte = 'ANULACION' | 'AJUSTE';

export interface ItemDocumentoSoporteModel {
  id?: string;
  documentoSoporteId?: string;
  descripcion: string;
  cantidad: number;
  unidadMedida?: string;
  precioUnitario: number;
  totalLinea: number;
  porcentajeIva?: number;
  valorIva?: number;
  porcentajeRetefuente?: number;
  valorRetefuente?: number;
  porcentajeReteica?: number;
  valorReteica?: number;
  cuentaGastoCodigo?: string;
  centroCostoCodigo?: string;
}

export interface DocumentoSoporteNotaModel {
  id: string;
  colegioId: string;
  documentoSoporteId: string;
  tipoNota: TipoNotaDocumentoSoporte;
  numeroNota: string;
  prefijo: string;
  consecutivo: number;
  fechaEmision: string;
  motivo: string;
  cudsNota?: string;
  cudsReferencia?: string;
  estadoDian: string;
  createdAt: string;
}

export interface DocumentoSoporteModel {
  id: string;
  colegioId: string;
  terceroId: string;
  numeroDocumento: string;
  prefijo: string;
  consecutivo: number;
  fechaEmision: string;
  fechaVencimiento: string;
  medioPago: string;
  metodoPago: string;
  subtotal: number;
  totalDescuentos: number;
  totalIva: number;
  totalRetefuente: number;
  totalReteica: number;
  totalReteiva: number;
  totalPagar: number;
  cuds?: string;
  qrData?: string;
  xmlUbl?: string;
  estadoDian: EstadoDianDocumentoSoporte;
  codigoRespuestaDian?: string;
  mensajeDian?: string;
  fechaTransmision?: string;
  asientoId?: string;
  notasAdicionales?: string;
  tercero?: TerceroModel;
  items?: ItemDocumentoSoporteModel[];
  notas?: DocumentoSoporteNotaModel[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearDocumentoSoporteModel {
  terceroId: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  medioPago?: string;
  metodoPago?: string;
  items: {
    descripcion: string;
    cantidad?: number;
    unidadMedida?: string;
    precioUnitario: number;
    porcentajeIva?: number;
    porcentajeRetefuente?: number;
    porcentajeReteica?: number;
    cuentaGastoCodigo?: string;
    centroCostoCodigo?: string;
  }[];
  notasAdicionales?: string;
}

// ─── Nómina Electrónica UBL DIAN ───────────────────────────────────────────
export type TipoNominaElectronica = 'INDIVIDUAL' | 'AJUSTE_ELIMINAR' | 'AJUSTE_REEMPLAZAR';
export type EstadoDianNomina = 'BORRADOR' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO';

export interface NominaDevengadoModel {
  id?: string;
  nominaElectronicaId?: string;
  conceptoCodigo: string;
  descripcion: string;
  valor: number;
}

export interface NominaDeduccionModel {
  id?: string;
  nominaElectronicaId?: string;
  conceptoCodigo: string;
  descripcion: string;
  porcentaje?: number;
  valor: number;
}

export interface NominaElectronicaModel {
  id: string;
  colegioId: string;
  terceroEmpleadoId: string;
  colaboradorId?: string;
  numeroNomina: string;
  prefijo: string;
  consecutivo: number;
  periodoAnio: number;
  periodoMes: number;
  fechaInicioPago: string;
  fechaFinPago: string;
  tipoNomina: TipoNominaElectronica;
  diasTrabajados: number;
  sueldoBasico: number;
  totalDevengado: number;
  totalDeducciones: number;
  totalComprobante: number;
  cune?: string;
  qrData?: string;
  xmlUbl?: string;
  estadoDian: EstadoDianNomina;
  codigoRespuestaDian?: string;
  mensajeDian?: string;
  fechaTransmision?: string;
  asientoId?: string;
  terceroEmpleado?: TerceroModel;
  devengados?: NominaDevengadoModel[];
  deducciones?: NominaDeduccionModel[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearNominaIndividualModel {
  terceroEmpleadoId: string;
  colaboradorId?: string;
  periodoAnio: number;
  periodoMes: number;
  fechaInicioPago?: string;
  fechaFinPago?: string;
  diasTrabajados?: number;
  sueldoBasico: number;
  devengados: {
    conceptoCodigo: string;
    descripcion: string;
    valor: number;
  }[];
  deducciones: {
    conceptoCodigo: string;
    descripcion: string;
    porcentaje?: number;
    valor: number;
  }[];
}

export interface GenerarNominaMasivaModel {
  anio: number;
  mes: number;
}

export interface ResultadoNominaMasivaModel {
  procesados: number;
  totalDevengados: number;
  totalDeducciones: number;
  nominas: NominaElectronicaModel[];
}

// ==========================================
// DISPERSIÓN BANCARIA MASIVA H2H & AI FUZZY
// ==========================================

export type TipoDispersionModel = 'NOMINA' | 'PROVEEDORES' | 'SERVICIOS' | 'MIXTO';
export type FormatoBancoDispersionModel = 'ASOBANCARIA_2001' | 'BANCOLOMBIA_PAB' | 'DAVIVIENDA_ACH' | 'BANCO_BOGOTA' | 'SAP_MT940';
export type EstadoDispersionLoteModel = 'BORRADOR' | 'GENERADO' | 'TRANSMITIDO' | 'APLICADO' | 'ANULADO';

export interface DispersionItemModel {
  id?: string;
  loteId?: string;
  terceroId?: string;
  nombreBeneficiario: string;
  tipoDocumento: string;
  numeroDocumento: string;
  bancoDestinoCodigo: string;
  bancoDestinoNombre: string;
  tipoCuentaDestinatario: string;
  numeroCuentaDestinatario: string;
  monto: number;
  referenciaPago?: string;
  emailNotificacion?: string;
  estado?: string;
  origenTipo?: string;
  origenId?: string;
}

export interface DispersionLoteModel {
  id: string;
  colegioId: string;
  codigoLote: string;
  tipo: TipoDispersionModel;
  formatoBanco: FormatoBancoDispersionModel;
  bancoOrigen: string;
  numeroCuentaOrigen: string;
  tipoCuentaOrigen: string;
  fechaAplicacion: string;
  totalRegistros: number;
  montoTotal: number;
  estado: EstadoDispersionLoteModel;
  archivoNombre?: string;
  contenidoArchivo?: string;
  asientoId?: string;
  observaciones?: string;
  items?: DispersionItemModel[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearDispersionLoteModel {
  tipo: TipoDispersionModel;
  formatoBanco: FormatoBancoDispersionModel;
  bancoOrigen: string;
  numeroCuentaOrigen: string;
  tipoCuentaOrigen: string;
  fechaAplicacion: string;
  observaciones?: string;
  items: DispersionItemModel[];
}

export interface ConfirmarDispersionLoteModel {
  cuentaPucBanco: string;
  fechaContable?: string;
  detalleEgreso?: string;
}

export interface LineaFuzzyMatchDetailModel {
  lineaId: string;
  fecha: string;
  concepto: string;
  monto: number;
  tipoMovimiento: 'DEBITO' | 'CREDITO';
  matchScore: number;
  confianza: 'ALTA' | 'MEDIA' | 'BAJA' | 'SIN_MATCH';
  reglaCoincidencia: string;
  candidateId?: string;
  candidateRef?: string;
  candidateTercero?: string;
  asientoSugerido?: {
    cuentaPucCodigo: string;
    cuentaPucNombre: string;
    naturaleza: 'DEBITO' | 'CREDITO';
    descripcion: string;
  };
}

export interface AutoMatchFuzzyResultadoModel extends AutoMatchResultadoModel {
  coincidenciasFuzzy: number;
  sugerenciasHeuristicas: number;
  detalles: LineaFuzzyMatchDetailModel[];
}

