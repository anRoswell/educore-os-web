export enum EstadoCuenta {
  AL_DIA = 'AL_DIA',
  POR_VENCER = 'POR_VENCER',
  EN_MORA = 'EN_MORA',
  ANULADO = 'ANULADO'
}

export enum MedioPago {
  PSE = 'PSE',
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA_BANCOLOMBIA = 'TRANSFERENCIA_BANCOLOMBIA',
  NEQUI_QR = 'NEQUI_QR',
  TARJETA_CREDITO = 'TARJETA_CREDITO'
}

export enum EstadoAcuerdo {
  ACTIVO = 'ACTIVO',
  CUMPLIDO = 'CUMPLIDO',
  INCUMPLIDO = 'INCUMPLIDO'
}

export enum EstadoPago {
  APROBADO = 'APROBADO',
  PENDIENTE = 'PENDIENTE',
  RECHAZADO = 'RECHAZADO'
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
