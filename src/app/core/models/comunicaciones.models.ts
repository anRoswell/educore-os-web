export interface ComunicadoImagenItem {
  id?: string;
  comunicadoId?: string;
  urlAdjunto: string;
  formatoVisual: 'IMAGEN_TEXTO' | 'PANTALLA_COMPLETA';
  orden: number;
  texto?: string;
}

export interface ComunicadoItem {
  id?: string;
  colegioId?: string;
  emisorUserId?: string;
  emisor?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    avatarUrl?: string;
  };
  titulo: string;
  contenidoHtml?: string;
  contenido?: string;
  tipoPlataforma: 'WEB' | 'MOVIL';
  activo: boolean;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  alcance: 'TODOS' | 'SEDE' | 'GRADO' | 'GRUPO';
  gradoId?: string;
  grado?: {
    id: string;
    nombre: string;
  };
  grupoId?: string;
  grupo?: {
    id: string;
    nombre: string;
  };
  requiereFirma: boolean;
  urlAdjunto?: string;
  fechaPublicacion?: string;
  createdAt?: string;
  updatedAt?: string;
  imagenes?: ComunicadoImagenItem[];
}

export interface LecturaUsuarioInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  avatarUrl?: string;
}

export interface LecturaTrazabilidadItem {
  id: string;
  colegioId: string;
  comunicadoId: string;
  userId: string;
  user?: LecturaUsuarioInfo;
  leidoEn: string;
  firmadoDigitalmente: boolean;
  fechaFirma?: string;
  ipLectura?: string;
}

export interface EstadisticasComunicadoResponse {
  comunicadoId: string;
  titulo: string;
  alcance: string;
  requiereFirma: boolean;
  totalLecturas: number;
  totalFirmas: number;
  ultimasLecturas: LecturaTrazabilidadItem[];
}

export interface MensajePrivadoItem {
  id?: string;
  colegioId?: string;
  remitenteUserId?: string;
  remitente?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  destinatarioUserId: string;
  destinatario?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  asunto?: string;
  mensaje: string;
  urlAdjunto?: string;
  leido: boolean;
  leidoAt?: string;
  createdAt?: string;
}
