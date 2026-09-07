import {
  EstadoCuentaCobro,
  EstadoCuenta,
  MedioPago,
  EstadoAcuerdoPago,
  EstadoAcuerdo,
  EstadoPagoRecaudo,
  EstadoPago,
  TipoBeca,
  VigenciaBeca,
  EstadoBeca,
  CuentaContablePuc,
  MesEscolar,
  PorcentajeBeca,
  CuotasPeriodo,
  ClaveParametroFinanciero,
  FiltroGeneral,
  FILTRO_TODOS,
} from '../../../core/enums';
import type { ConfiguracionFinanciera } from '../../../core/enums';

export {
  EstadoCuentaCobro,
  EstadoCuenta,
  MedioPago,
  EstadoAcuerdoPago,
  EstadoAcuerdo,
  EstadoPagoRecaudo,
  EstadoPago,
  TipoBeca,
  VigenciaBeca,
  EstadoBeca,
  CuentaContablePuc,
  MesEscolar,
  PorcentajeBeca,
  CuotasPeriodo,
  ClaveParametroFinanciero,
  FiltroGeneral,
  FILTRO_TODOS,
};
export type { ConfiguracionFinanciera };

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
  dianEstado?: string;
  cufe?: string;
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

export interface PagoManualForm {
  cuentaCobroId: string;
  medioPago: MedioPago;
  valorPagado: number;
  referenciaTransaccion: string;
}
