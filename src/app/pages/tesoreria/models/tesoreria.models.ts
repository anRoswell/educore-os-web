export enum EstadoCuenta {
  AL_DIA = 'AL_DIA',
  PAGADO = 'PAGADO',
  PAGADO_PARCIAL = 'PAGADO_PARCIAL',
  POR_VENCER = 'POR_VENCER',
  EN_MORA = 'EN_MORA',
  ANULADO = 'ANULADO',
}

export enum MedioPago {
  PSE = 'PSE',
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA_BANCOLOMBIA = 'TRANSFERENCIA_BANCOLOMBIA',
  NEQUI_QR = 'NEQUI_QR',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  CHEQUE = 'CHEQUE',
  CRUCE_ANTICIPO = 'CRUCE_ANTICIPO',
}

export enum EstadoAcuerdo {
  ACTIVO = 'ACTIVO',
  CUMPLIDO = 'CUMPLIDO',
  INCUMPLIDO = 'INCUMPLIDO',
}

export enum EstadoPago {
  APROBADO = 'APROBADO',
  PENDIENTE = 'PENDIENTE',
  RECHAZADO = 'RECHAZADO',
  ANULADO = 'ANULADO',
}

export interface CuentaCobroItem {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteDocumento?: string;
  gradoNombre?: string;
  concepto: string;
  mes: string;
  mesCobro?: number;
  anioCobro?: number;
  valorTotal: number;
  valorPagado?: number;
  saldoPendiente?: number;
  estado: EstadoCuenta;
  fechaVencimiento: string;
  numeroFactura: string;
  descuento?: number;
}

export interface PagoRecaudoItem {
  id: string;
  numeroRecibo: string;
  facturaReferencia: string;
  estudianteId: string;
  estudianteNombre: string;
  conceptoNombre: string;
  medioPago: MedioPago;
  valorPagado: number;
  fechaPago: string;
  referenciaTransaccion: string;
  estado: EstadoPago;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  anuladoPorNombre?: string;
}

export interface AcuerdoPagoItem {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  gradoNombre: string;
  montoTotalAcordado: number;
  numeroCuotas: number;
  montoPorCuota: number;
  diaPagoMensual: number;
  fechaInicio: string;
  estado: EstadoAcuerdo;
  observaciones: string;
}

export interface EstudianteFinanciero {
  id: string;
  nombre: string;
  documento: string;
  grado: string;
  grupo: string;
  acudienteNombre: string;
  acudienteTelefono: string;
  acudienteEmail: string;
}

export enum TipoBeca {
  NINGUNA = 'NINGUNA',
  EXCELENCIA = 'EXCELENCIA',
  HERMANOS = 'HERMANOS',
  DOCENTE = 'DOCENTE',
  CONVENIO = 'CONVENIO',
  SOLIDARIA = 'SOLIDARIA',
  OTRA = 'OTRA',
}

export enum VigenciaBeca {
  ANUAL = 'ANUAL',
  SEMESTRE_1 = 'SEMESTRE_1',
  SEMESTRE_2 = 'SEMESTRE_2',
  BIMESTRE_1 = 'BIMESTRE_1',
  BIMESTRE_2 = 'BIMESTRE_2',
  BIMESTRE_3 = 'BIMESTRE_3',
  BIMESTRE_4 = 'BIMESTRE_4',
  BIMESTRE_5 = 'BIMESTRE_5',
  BIMESTRAL = 'BIMESTRAL',
  MES_ESPECIFICO = 'MES_ESPECIFICO',
  TEMPORAL = 'TEMPORAL',
}

export enum EstadoBeca {
  ACTIVA = 'ACTIVA',
  REVOCADA = 'REVOCADA',
  EXPIRADA = 'EXPIRADA',
}

export enum CuentaContablePuc {
  DESCUENTOS_PENSIONES = '417505',
}

export enum MesEscolar {
  ENERO = 1,
  FEBRERO = 2,
  MARZO = 3,
  ABRIL = 4,
  MAYO = 5,
  JUNIO = 6,
  JULIO = 7,
  AGOSTO = 8,
  SEPTIEMBRE = 9,
  OCTUBRE = 10,
  NOVIEMBRE = 11,
  DICIEMBRE = 12,
}

export enum PorcentajeBeca {
  NINGUNA = 0,
  CONVENIO = 15,
  HERMANOS = 20,
  DOCENTE = 30,
  EXCELENCIA = 50,
  SOLIDARIA = 100,
}

export enum CuotasPeriodo {
  MES_ESPECIFICO = 1,
  BIMESTRE = 2,
  SEMESTRE = 5,
  ANUAL = 10,
}

export enum ConfiguracionFinanciera {
  ANIO_LECTIVO_DEFECTO = 2026,
  TARIFA_BASE_PENSION = 450000,
  DIA_LIMITE_PAGO_DEFECTO = 10,
  DIA_PAGO_ACUERDO_DEFECTO = 15,
  CUOTAS_ACUERDO_DEFECTO = 3,
  VALOR_DEFAULT_ACUERDO = 900000,
}

export interface BecaEstudiante {
  id?: string;
  matriculaId?: string;
  estudianteId?: string;
  tipo: TipoBeca | string;
  nombre?: string;
  nombreBeneficio?: string;
  porcentaje: number;
  valorFijoDescuento?: number;
  vigencia?: VigenciaBeca | string;
  mesInicio?: number;
  mesFin?: number;
  anioLectivo?: number;
  numeroResolucion?: string;
  archivoSoporteUrl?: string;
  archivoSoporteNombre?: string;
  observaciones?: string;
  cuentaContablePuc?: CuentaContablePuc | string;
  otorgadoPorNombre?: string;
  estado?: EstadoBeca | string;
}

