export interface ModuloInfo {
  codigo: string; // e.g. 'M01', 'M02', ...
  nombre: string;
  descripcion: string;
  categoria: 'ACADEMICO' | 'FINANCIERO' | 'CONVIVENCIA' | 'INNOVACION' | 'COMUNICACIONES' | 'GESTION';
  icono: string;
  normativa?: string; // e.g. 'Decreto 1290', 'Ley 1620', 'Decreto 1421', 'Ley 1581'
  ruta: string;
  requeridoPlan?: 'BASICO' | 'ESTANDAR' | 'PREMIUM' | 'ENTERPRISE';
  permisos: PermisoInfo[];
}

export interface PermisoInfo {
  codigo: string; // e.g. 'ACADEMICO_CALIFICAR', 'TESORERIA_RECAUDOS'
  nombre: string;
  descripcion: string;
  moduloCodigo: string;
  accion: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'export';
}

export interface RoleInfo {
  codigo: string; // 'SUPER_ADMIN', 'RECTOR', 'COORDINADOR', 'DOCENTE', 'TESORERO', 'CONTADOR', 'SECRETARIA', 'PSICOORIENTADOR', 'ESTUDIANTE', 'ACUDIENTE', 'PORTERIA'
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  esGlobal: boolean;
}

export type PermissionsMatrix = Record<string, Record<string, boolean>>; // { [roleCode]: { [permissionCode]: boolean } }

export interface ColegioModuloConfig {
  colegioId: string;
  modulosActivos: string[]; // List of active module codes ['M01', 'M02', ...]
  updatedAt?: string;
}
