export type EstadoAsistencia = 'PRESENTE' | 'FALTA_INJUSTIFICADA' | 'FALTA_JUSTIFICADA' | 'RETARDO' | 'FUGA';

export interface AlumnoAsistencia {
  matriculaId: string;
  estudianteNombre: string;
  numeroDocumento?: string;
  estado: EstadoAsistencia;
  minutosRetardo: number;
  observacion: string;
  notificarAcudiente: boolean;
  avatarUrl?: string;
}

export interface CargaDocenteItem {
  id: string;
  grupoId?: string;
  grupoNombre: string;
  asignaturaId?: string;
  asignaturaNombre: string;
  gradoNombre?: string;
  estudiantesCount?: number;
}

export type MotivoExcusa = 'MEDICA' | 'CALAMIDAD' | 'VIAJE' | 'OTRO';
export type EstadoExcusa = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface ExcusaMedicaItem {
  id: string;
  matriculaId?: string;
  estudianteNombre: string;
  grupoNombre?: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: MotivoExcusa;
  descripcion: string;
  urlSoporte?: string;
  estado: EstadoExcusa;
  motivoRechazo?: string;
  createdAt?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  url_soporte?: string;
}

export interface SesionClaseItem {
  id: string;
  fecha: string;
  temaTratado: string;
  cargaDocenteId?: string;
  asignaturaNombre?: string;
  grupoNombre?: string;
  totalPresentes?: number;
  totalFaltas?: number;
  totalRetardos?: number;
}

export interface ResumenInasistenciaEstudiante {
  matriculaId: string;
  estudianteNombre: string;
  grupoNombre: string;
  totalClases: number;
  asistencias: number;
  faltasInjustificadas: number;
  faltasJustificadas: number;
  retardos: number;
  porcentajeAsistencia: number;
  riesgoPerdida: boolean;
}
