export interface User {
  id: string;
  email: string;
  primerNombre: string;
  primerApellido: string;
  role: string;
  avatarUrl?: string;
}

export interface Colegio {
  id: string;
  nombre: string;
  razonSocial?: string;
  slug: string;
  nit: string;
  codigoDane: string;
  ciudad: string;
  direccion?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  resolucionAprobacion?: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  plan: 'BASIC' | 'STANDARD' | 'ENTERPRISE';
  modulosActivos: string[];
}

export interface AuthState {
  user: User | null;
  colegio: Colegio | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface KpiRectoria {
  totalEstudiantesMatriculados: number;
  totalDocentesActivos: number;
  relacionEstudianteDocente: number;
  promedioGeneralInstitucional: number;
  porcentajeAprobacionAcademica: number;
  porcentajeEfectividadRecaudo: number;
  carteraPendientePesos: number;
}

export interface Estudiante {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  codigoEstudiante: string;
  grado?: string;
  grupo?: string;
  estado: string;
  telefonoEmergencia?: string;
  eps?: string;
  grupoSanguineoRh?: string;
  estadoCuenta?: 'AL_DIA' | 'POR_VENCER' | 'EN_MORA';
}

export interface CalificacionLoteItem {
  matriculaId: string;
  estudianteNombre: string;
  documento: string;
  nota: number;
  desempeno: 'SUPERIOR' | 'ALTO' | 'BASICO' | 'BAJO';
  observaciones?: string;
}
