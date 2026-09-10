import { Injectable, signal, computed, inject } from '@angular/core';
import { ModuloInfo, PermisoInfo, RoleInfo, PermissionsMatrix } from '../models/permisos.models';
import { AuthService } from './auth.service';

export const MODULOS_SISTEMA: ModuloInfo[] = [
  {
    codigo: 'M01',
    nombre: 'Gestión Académica Curricular',
    descripcion: 'Configuración de planes de estudio, asignaturas, áreas, escalas y Decreto 1290.',
    categoria: 'ACADEMICO',
    icono: '🎓',
    normativa: 'Decreto 1290 de 2009',
    ruta: '/academico',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'ACADEMICO_VER', nombre: 'Consultar Malla y Asignaturas', descripcion: 'Visualizar áreas, materias y períodos', moduloCodigo: 'M01', accion: 'read' },
      { codigo: 'ACADEMICO_CONFIGURAR', nombre: 'Configurar Planes de Estudio', descripcion: 'Crear o modificar asignaturas e intensidades horarias', moduloCodigo: 'M01', accion: 'manage' },
      { codigo: 'ACADEMICO_CALIFICAR', nombre: 'Ingresar y Modificar Calificaciones', descripcion: 'Registrar notas parciales y definitivas por período', moduloCodigo: 'M01', accion: 'update' },
      { codigo: 'ACADEMICO_BOLETINES', nombre: 'Generar e Imprimir Boletines', descripcion: 'Emisión masiva y digital de reportes académicos', moduloCodigo: 'M01', accion: 'export' },
      { codigo: 'ACADEMICO_CIERRE_PERIODO', nombre: 'Cierre y Bloqueo de Períodos', descripcion: 'Consolidar y cerrar períodos académicos', moduloCodigo: 'M01', accion: 'manage' },
    ],
  },
  {
    codigo: 'M02',
    nombre: 'Aula Virtual & Tareas LMS',
    descripcion: 'Publicación de recursos, lecciones multimedia, foros, tareas y evaluaciones interactivas.',
    categoria: 'ACADEMICO',
    icono: '📚',
    normativa: 'UNESCO Digital Learning',
    ruta: '/lms',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'LMS_VER_CURSOS', nombre: 'Ver Cursos y Aulas Virtuales', descripcion: 'Acceso a contenidos y materiales didácticos', moduloCodigo: 'M02', accion: 'read' },
      { codigo: 'LMS_CREAR_TAREAS', nombre: 'Crear Tareas y Cuestionarios', descripcion: 'Publicar actividades evaluativas y rúbricas', moduloCodigo: 'M02', accion: 'create' },
      { codigo: 'LMS_CALIFICAR_ENTREGAS', nombre: 'Calificar Entregas de Estudiantes', descripcion: 'Revisar y retroalimentar trabajos entregados', moduloCodigo: 'M02', accion: 'update' },
      { codigo: 'LMS_SUBIR_RECURSOS', nombre: 'Subir Guías y Material de Apoyo', descripcion: 'Carga de archivos PDF, videos y enlaces', moduloCodigo: 'M02', accion: 'create' },
    ],
  },
  {
    codigo: 'M03',
    nombre: 'Tesorería & Facturación Electrónica DIAN',
    descripcion: 'Emisión de facturas electrónicas, recaudo PSE/Wompi, cobros de pensión y cartera morosa.',
    categoria: 'FINANCIERO',
    icono: '💰',
    normativa: 'Resolución DIAN Anexo 1.9',
    ruta: '/tesoreria',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'TESORERIA_VER_ESTADOS', nombre: 'Consultar Estados de Cuenta', descripcion: 'Ver cartera por estudiante y saldos pendientes', moduloCodigo: 'M03', accion: 'read' },
      { codigo: 'TESORERIA_REGISTRAR_RECAUDO', nombre: 'Registrar Recaudos y Pagos', descripcion: 'Ingresar pagos en efectivo, transferencias o PSE', moduloCodigo: 'M03', accion: 'create' },
      { codigo: 'TESORERIA_FACTURAR_DIAN', nombre: 'Emitir Facturación Electrónica', descripcion: 'Generar y transmitir facturas XML/CUFE a la DIAN', moduloCodigo: 'M03', accion: 'manage' },
      { codigo: 'TESORERIA_ANULAR_RECIBOS', nombre: 'Anular Recibos y Facturas', descripcion: 'Emitir notas crédito y anulación con justificación', moduloCodigo: 'M03', accion: 'delete' },
      { codigo: 'TESORERIA_GESTION_BECAS', nombre: 'Asignar Becas y Descuentos', descripcion: 'Otorgar auxilios y convenios de descuento', moduloCodigo: 'M03', accion: 'manage' },
    ],
  },
  {
    codigo: 'M04',
    nombre: 'Contabilidad NIIF & Exógena',
    descripcion: 'Plan Único de Cuentas PUC, asientos contables automáticos, balances y medios magnéticos.',
    categoria: 'FINANCIERO',
    icono: '🏛',
    normativa: 'NIIF Pymes / DIAN Exógena',
    ruta: '/contabilidad',
    requeridoPlan: 'ENTERPRISE',
    permisos: [
      { codigo: 'CONTABILIDAD_VER_REPORTES', nombre: 'Consultar Balances y Libros', descripcion: 'Visualizar Balance General, PyG y Libro Mayor', moduloCodigo: 'M04', accion: 'read' },
      { codigo: 'CONTABILIDAD_CREAR_ASIENTO', nombre: 'Crear Asientos Contables Manuales', descripcion: 'Registrar comprobantes de diario, egreso e ingreso', moduloCodigo: 'M04', accion: 'create' },
      { codigo: 'CONTABILIDAD_GESTION_PUC', nombre: 'Administrar Catálogo PUC', descripcion: 'Crear o modificar cuentas contables institucionales', moduloCodigo: 'M04', accion: 'manage' },
      { codigo: 'CONTABILIDAD_EXPORTAR_EXOGENA', nombre: 'Generar Formatos Medios Magnéticos', descripcion: 'Exportar formatos 1001, 1007, etc. para DIAN', moduloCodigo: 'M04', accion: 'export' },
      { codigo: 'CONTABILIDAD_CIERRE_FISCAL', nombre: 'Ejecutar Cierres Contables', descripcion: 'Cierres mensuales y anuales de ejercicio fiscal', moduloCodigo: 'M04', accion: 'manage' },
    ],
  },
  {
    codigo: 'M05',
    nombre: 'Control de Asistencia Digital & Excusas',
    descripcion: 'Toma diaria de asistencia por hora/asignatura, alertas SMS a padres y radicación de excusas.',
    categoria: 'ACADEMICO',
    icono: '📅',
    normativa: 'Ley 115 de 1994',
    ruta: '/asistencia',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'ASISTENCIA_REGISTRAR', nombre: 'Tomar Asistencia Diaria', descripcion: 'Registrar presentes, ausencias, retardos y permisos', moduloCodigo: 'M05', accion: 'create' },
      { codigo: 'ASISTENCIA_VER_HISTORIAL', nombre: 'Consultar Historial de Inasistencias', descripcion: 'Ver reportes acumulados y porcentajes de falta', moduloCodigo: 'M05', accion: 'read' },
      { codigo: 'ASISTENCIA_GESTION_EXCUSAS', nombre: 'Aprobar y Justificar Excusas', descripcion: 'Validar soportes médicos y excusas de acudientes', moduloCodigo: 'M05', accion: 'update' },
    ],
  },
  {
    codigo: 'M06',
    nombre: 'Matrícula Estudiantil & Ficha 360°',
    descripcion: 'Proceso de admisión, legalización de matrícula, hoja de vida 360° y asignación de cursos.',
    categoria: 'ACADEMICO',
    icono: '👥',
    normativa: 'Resolución MEN SIMAT',
    ruta: '/matriculas',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'MATRICULAS_VER_ESTUDIANTES', nombre: 'Consultar Directorio Estudiantil', descripcion: 'Búsqueda de alumnos, fichas y acudientes', moduloCodigo: 'M06', accion: 'read' },
      { codigo: 'MATRICULAS_REGISTRAR_NUEVO', nombre: 'Registrar Nueva Matrícula', descripcion: 'Ingreso formal de estudiantes y contrato educativo', moduloCodigo: 'M06', accion: 'create' },
      { codigo: 'MATRICULAS_EDITAR_FICHA', nombre: 'Editar Ficha 360° y Antecedentes', descripcion: 'Modificar datos personales, médicos y familiares', moduloCodigo: 'M06', accion: 'update' },
      { codigo: 'MATRICULAS_RETIRAR_ESTUDIANTE', nombre: 'Retirar o Trasladar Alumnos', descripcion: 'Generar paz y salvo y formalizar retiro', moduloCodigo: 'M06', accion: 'manage' },
    ],
  },
  {
    codigo: 'M07',
    nombre: 'Convivencia Escolar & Ley 1620',
    descripcion: 'Observador digital, tipificación de faltas (Tipo I, II y III), ruta de atención y comités.',
    categoria: 'CONVIVENCIA',
    icono: '🛡️',
    normativa: 'Ley 1620 de 2013',
    ruta: '/convivencia',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'CONVIVENCIA_VER_OBSERVADOR', nombre: 'Consultar Observador del Estudiante', descripcion: 'Lectura de anotaciones y compromisos formativos', moduloCodigo: 'M07', accion: 'read' },
      { codigo: 'CONVIVENCIA_REGISTRAR_FALTA', nombre: 'Registrar Anotación / Incidente', descripcion: 'Apertura de caso disciplinario Tipo I, II o III', moduloCodigo: 'M07', accion: 'create' },
      { codigo: 'CONVIVENCIA_CERRAR_CASO', nombre: 'Firmar Actas y Cerrar Procesos', descripcion: 'Compromisos con padres y cierre de expediente', moduloCodigo: 'M07', accion: 'manage' },
    ],
  },
  {
    codigo: 'M08',
    nombre: 'Inclusión Educativa & PIAR (DUA)',
    descripcion: 'Planes Individuales de Ajustes Razonables (PIAR), caracterización de barreras y diseño DUA.',
    categoria: 'CONVIVENCIA',
    icono: '🧩',
    normativa: 'Decreto 1421 de 2017',
    ruta: '/inclusion',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'INCLUSION_VER_EXPEDIENTES', nombre: 'Consultar Diagnósticos y PIAR', descripcion: 'Ver caracterización médica y ajustes activos', moduloCodigo: 'M08', accion: 'read' },
      { codigo: 'INCLUSION_CREAR_PIAR', nombre: 'Elaborar y Actualizar PIAR', descripcion: 'Definir adaptaciones curriculares y apoyos DUA', moduloCodigo: 'M08', accion: 'create' },
      { codigo: 'INCLUSION_GESTION_TERAPIAS', nombre: 'Seguimiento de Terapias e IPS', descripcion: 'Vincular reportes de fonoaudiología, psicología, etc.', moduloCodigo: 'M08', accion: 'manage' },
    ],
  },
  {
    codigo: 'M09',
    nombre: 'Protección de Datos & Habeas Data',
    descripcion: 'Consentimientos informados digitales, Registro Nacional de Bases de Datos ante la SIC.',
    categoria: 'GESTION',
    icono: '⚖️',
    normativa: 'Ley 1581 de 2012 / SIC',
    ruta: '/habeas-data',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'HABEAS_DATA_VER_CONSENTIMIENTOS', nombre: 'Ver Estado de Autorizaciones', descripcion: 'Listar autorizaciones de uso de imagen y datos', moduloCodigo: 'M09', accion: 'read' },
      { codigo: 'HABEAS_DATA_GESTION_POLITICAS', nombre: 'Administrar Políticas y Formularios', descripcion: 'Actualizar cláusulas y generar reportes SIC', moduloCodigo: 'M09', accion: 'manage' },
    ],
  },
  {
    codigo: 'M10',
    nombre: 'Gobierno Escolar & Elecciones Democráticas',
    descripcion: 'Elecciones electrónicas de Personero, Contralor, Cabildante y Consejo Estudiantil.',
    categoria: 'CONVIVENCIA',
    icono: '🗳️',
    normativa: 'Ley 115 Art. 142',
    ruta: '/gobierno-escolar',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'GOBIERNO_VOTAR', nombre: 'Emitir Voto Electrónico', descripcion: 'Participar en la jornada de votación estudiantil', moduloCodigo: 'M10', accion: 'create' },
      { codigo: 'GOBIERNO_CONFIGURAR_JORNADA', nombre: 'Configurar Candidatos y Tarjetones', descripcion: 'Inscribir planchas, fotos y propuestas', moduloCodigo: 'M10', accion: 'manage' },
      { codigo: 'GOBIERNO_VER_ESCRUTINIO', nombre: 'Consultar Escrutinio y Actas E-14', descripcion: 'Ver resultados en tiempo real y emitir constancias', moduloCodigo: 'M10', accion: 'read' },
    ],
  },
  {
    codigo: 'M11',
    nombre: 'Comunicaciones Institucionales & Circulares',
    descripcion: 'Envío de circulares oficiales con confirmación de lectura, agenda escolar y notificaciones push.',
    categoria: 'COMUNICACIONES',
    icono: '📢',
    normativa: 'Ley 527 de 1999',
    ruta: '/comunicaciones',
    requeridoPlan: 'BASICO',
    permisos: [
      { codigo: 'COMUNICADOS_LEER', nombre: 'Leer Circulares y Avisos', descripcion: 'Acceder a la bandeja de mensajes recibidos', moduloCodigo: 'M11', accion: 'read' },
      { codigo: 'COMUNICADOS_PUBLICAR', nombre: 'Redactar y Emitir Comunicados', descripcion: 'Enviar circulares a cursos, sedes o grupos específicos', moduloCodigo: 'M11', accion: 'create' },
      { codigo: 'COMUNICADOS_VER_METRICAS', nombre: 'Monitorear Confirmaciones de Lectura', descripcion: 'Revisar trazabilidad de quién abrió el comunicado', moduloCodigo: 'M11', accion: 'read' },
    ],
  },
  {
    codigo: 'M12',
    nombre: 'Gestión Documental BPM & Archivo Digital',
    descripcion: 'Peticiones PQRS, expedición de certificados con código QR y archivo central digitalizado.',
    categoria: 'GESTION',
    icono: '📑',
    normativa: 'Ley 594 de 2000 (AGN)',
    ruta: '/documental',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'DOCUMENTAL_VER_TRAMITES', nombre: 'Consultar Bandeja de Trámites', descripcion: 'Seguimiento a solicitudes radicadas', moduloCodigo: 'M12', accion: 'read' },
      { codigo: 'DOCUMENTAL_EMITIR_CERTIFICADOS', nombre: 'Generar Certificados y Constancias', descripcion: 'Expedir certificados de estudio con firma digital', moduloCodigo: 'M12', accion: 'create' },
      { codigo: 'DOCUMENTAL_GESTION_BPM', nombre: 'Administrar Flujos de Radicación', descripcion: 'Asignar responsables y gestionar tiempos PQRS', moduloCodigo: 'M12', accion: 'manage' },
    ],
  },
  {
    codigo: 'M13',
    nombre: 'Importador Masivo Excel / SIMAT',
    descripcion: 'Carga masiva de estudiantes, docentes, notas, horarios y homologación con Ministerio.',
    categoria: 'GESTION',
    icono: '📥',
    normativa: 'SIMAT Ministerio de Educación',
    ruta: '/importador',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'IMPORTADOR_EJECUTAR', nombre: 'Cargar Archivos Excel / CSV', descripcion: 'Procesar e importar bases de datos masivas', moduloCodigo: 'M13', accion: 'manage' },
    ],
  },
  {
    codigo: 'M14',
    nombre: 'Portería & Control de Acceso QR',
    descripcion: 'Lectura de carnés QR en torniquetes, control de visitantes y registro de salidas anticipadas.',
    categoria: 'GESTION',
    icono: '🛡️',
    normativa: 'Seguridad Escolar y Menores',
    ruta: '/porteria',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'PORTERIA_REGISTRAR_ACCESO', nombre: 'Escanear Entradas y Salidas', descripcion: 'Registrar paso peatonal o vehicular en portería', moduloCodigo: 'M14', accion: 'create' },
      { codigo: 'PORTERIA_VER_REGISTROS', nombre: 'Consultar Bitácora de Accesos', descripcion: 'Auditar historial de ingresos y visitantes', moduloCodigo: 'M14', accion: 'read' },
    ],
  },
  {
    codigo: 'M15',
    nombre: 'Talento Humano & Nómina Electrónica',
    descripcion: 'Contratos laborales, escalafón docente (Dec. 1278 / 2277), nómina DIAN y novedades.',
    categoria: 'FINANCIERO',
    icono: '👔',
    normativa: 'Resolución DIAN Nómina 000013',
    ruta: '/talento-humano',
    requeridoPlan: 'ENTERPRISE',
    permisos: [
      { codigo: 'RRHH_VER_COLABORADORES', nombre: 'Consultar Hojas de Vida y Contratos', descripcion: 'Ver personal docente, administrativo y de servicios', moduloCodigo: 'M15', accion: 'read' },
      { codigo: 'RRHH_GESTION_CONTRATOS', nombre: 'Crear y Actualizar Contratos', descripcion: 'Registrar salarios, tipos de contrato y escalafón', moduloCodigo: 'M15', accion: 'manage' },
      { codigo: 'RRHH_LIQUIDAR_NOMINA', nombre: 'Liquidar y Transmitir Nómina DIAN', descripcion: 'Generación de colillas de pago y XML DIAN', moduloCodigo: 'M15', accion: 'manage' },
    ],
  },
  {
    codigo: 'M16',
    nombre: 'Transporte & Restaurante Escolar',
    descripcion: 'Rutas escolares con georreferenciación GPS, control de raciones PAE y dietas especiales.',
    categoria: 'GESTION',
    icono: '🚌',
    normativa: 'PAE MEN / MinTransporte',
    ruta: '/transporte-restaurante',
    requeridoPlan: 'ESTANDAR',
    permisos: [
      { codigo: 'TRANSPORTE_VER_RUTAS', nombre: 'Consultar Rutas y Asignaciones', descripcion: 'Visualizar paradas, monitores y recorrido', moduloCodigo: 'M16', accion: 'read' },
      { codigo: 'TRANSPORTE_GESTION_RUTAS', nombre: 'Crear Rutas y Asignar Vehículos', descripcion: 'Administrar buses, conductores y cupos', moduloCodigo: 'M16', accion: 'manage' },
      { codigo: 'RESTAURANTE_REGISTRO_PAE', nombre: 'Control de Raciones de Comedor', descripcion: 'Registro de almuerzos y refrigerios consumidos', moduloCodigo: 'M16', accion: 'create' },
    ],
  },
];

export const ROLES_SISTEMA: RoleInfo[] = [
  { codigo: 'SUPER_ADMIN', nombre: 'Super Administrador Global', descripcion: 'Control absoluto del ecosistema SaaS y gestión de instituciones', icono: '👑', color: '#6366f1', esGlobal: true },
  { codigo: 'RECTOR', nombre: 'Rectoría / Dirección General', descripcion: 'Representante legal, ordenador del gasto y autoridad escolar', icono: '🏛️', color: '#1e3a8a', esGlobal: false },
  { codigo: 'COORDINADOR', nombre: 'Coordinación Académica / Convivencia', descripcion: 'Gestión curricular, horarios, disciplina y seguimiento docente', icono: '📋', color: '#0284c7', esGlobal: false },
  { codigo: 'DOCENTE', nombre: 'Docente Titular / Profesor', descripcion: 'Calificaciones, asistencias, planeaciones pedagógicas y LMS', icono: '👩‍🏫', color: '#059669', esGlobal: false },
  { codigo: 'TESORERO', nombre: 'Tesorería & Cartera', descripcion: 'Recaudo de pensiones, facturación DIAN, becas y cobros', icono: '💰', color: '#d97706', esGlobal: false },
  { codigo: 'CONTADOR', nombre: 'Contador Público / Revisor Fiscal', descripcion: 'PUC, asientos contables NIIF, balances y medios magnéticos', icono: '📈', color: '#7c3aed', esGlobal: false },
  { codigo: 'SECRETARIA', nombre: 'Secretaría Académica', descripcion: 'Emisión de certificados, matrículas SIMAT y archivo documental', icono: '🗂️', color: '#0d9488', esGlobal: false },
  { codigo: 'PSICOORIENTADOR', nombre: 'Psicoorientación & Bienestar', descripcion: 'Planes de inclusión PIAR, casos de convivencia y bienestar', icono: '🧩', color: '#db2777', esGlobal: false },
  { codigo: 'ESTUDIANTE', nombre: 'Estudiante', descripcion: 'Consulta de notas, tareas en aula virtual, faltas y elecciones', icono: '👨‍🎓', color: '#4f46e5', esGlobal: false },
  { codigo: 'ACUDIENTE', nombre: 'Acudiente / Padre de Familia', descripcion: 'Boletines, pagos en línea, seguimiento y circulares oficiales', icono: '👨‍👩‍👧', color: '#ea580c', esGlobal: false },
  { codigo: 'PORTERIA', nombre: 'Control de Portería & Seguridad', descripcion: 'Lectura de carnés QR y control de acceso vehicular/peatonal', icono: '🛡️', color: '#475569', esGlobal: false },
];

export const DEFAULT_PERMISSIONS_MATRIX: PermissionsMatrix = {
  SUPER_ADMIN: {}, // Bypass total
  RECTOR: {
    ACADEMICO_VER: true, ACADEMICO_CONFIGURAR: true, ACADEMICO_CALIFICAR: true, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: true,
    LMS_VER_CURSOS: true, LMS_CREAR_TAREAS: true, LMS_CALIFICAR_ENTREGAS: true, LMS_SUBIR_RECURSOS: true,
    TESORERIA_VER_ESTADOS: true, TESORERIA_REGISTRAR_RECAUDO: true, TESORERIA_FACTURAR_DIAN: true, TESORERIA_ANULAR_RECIBOS: true, TESORERIA_GESTION_BECAS: true,
    CONTABILIDAD_VER_REPORTES: true, CONTABILIDAD_CREAR_ASIENTO: true, CONTABILIDAD_GESTION_PUC: true, CONTABILIDAD_EXPORTAR_EXOGENA: true, CONTABILIDAD_CIERRE_FISCAL: true,
    ASISTENCIA_REGISTRAR: true, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: true,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: true, MATRICULAS_EDITAR_FICHA: true, MATRICULAS_RETIRAR_ESTUDIANTE: true,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: true, CONVIVENCIA_CERRAR_CASO: true,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: true, INCLUSION_GESTION_TERAPIAS: true,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: true,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: true, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: true,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: true, DOCUMENTAL_GESTION_BPM: true,
    IMPORTADOR_EJECUTAR: true,
    PORTERIA_REGISTRAR_ACCESO: true, PORTERIA_VER_REGISTROS: true,
    RRHH_VER_COLABORADORES: true, RRHH_GESTION_CONTRATOS: true, RRHH_LIQUIDAR_NOMINA: true,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: true, RESTAURANTE_REGISTRO_PAE: true,
  },
  COORDINADOR: {
    ACADEMICO_VER: true, ACADEMICO_CONFIGURAR: true, ACADEMICO_CALIFICAR: true, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: true,
    LMS_VER_CURSOS: true, LMS_CREAR_TAREAS: true, LMS_CALIFICAR_ENTREGAS: true, LMS_SUBIR_RECURSOS: true,
    TESORERIA_VER_ESTADOS: false, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: true, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: true,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: true, MATRICULAS_EDITAR_FICHA: true, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: true, CONVIVENCIA_CERRAR_CASO: true,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: true, INCLUSION_GESTION_TERAPIAS: true,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: true, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: true,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: true, DOCUMENTAL_GESTION_BPM: true,
    IMPORTADOR_EJECUTAR: true,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: true,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: true, RESTAURANTE_REGISTRO_PAE: true,
  },
  DOCENTE: {
    ACADEMICO_VER: true, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: true, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: true, LMS_CREAR_TAREAS: true, LMS_CALIFICAR_ENTREGAS: true, LMS_SUBIR_RECURSOS: true,
    TESORERIA_VER_ESTADOS: false, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: true, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: false,
    MATRICULAS_VER_ESTUDIANTES: false, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: true, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: true, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: false, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: false, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: false, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  TESORERO: {
    ACADEMICO_VER: false, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: false, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: false, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: true, TESORERIA_REGISTRAR_RECAUDO: true, TESORERIA_FACTURAR_DIAN: true, TESORERIA_ANULAR_RECIBOS: true, TESORERIA_GESTION_BECAS: true,
    CONTABILIDAD_VER_REPORTES: true, CONTABILIDAD_CREAR_ASIENTO: true, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: true, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: false, ASISTENCIA_GESTION_EXCUSAS: false,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: false, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: false, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: false,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: true, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: true,
    TRANSPORTE_VER_RUTAS: false, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  CONTADOR: {
    ACADEMICO_VER: false, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: false, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: false, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: true, TESORERIA_REGISTRAR_RECAUDO: true, TESORERIA_FACTURAR_DIAN: true, TESORERIA_ANULAR_RECIBOS: true, TESORERIA_GESTION_BECAS: true,
    CONTABILIDAD_VER_REPORTES: true, CONTABILIDAD_CREAR_ASIENTO: true, CONTABILIDAD_GESTION_PUC: true, CONTABILIDAD_EXPORTAR_EXOGENA: true, CONTABILIDAD_CIERRE_FISCAL: true,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: false, ASISTENCIA_GESTION_EXCUSAS: false,
    MATRICULAS_VER_ESTUDIANTES: false, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: false, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: false, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: false, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: false,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: false, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: false, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: true, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: true,
    TRANSPORTE_VER_RUTAS: false, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  SECRETARIA: {
    ACADEMICO_VER: true, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: false, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: true, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: true, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: true,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: true, MATRICULAS_EDITAR_FICHA: true, MATRICULAS_RETIRAR_ESTUDIANTE: true,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: true,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: true, DOCUMENTAL_GESTION_BPM: true,
    IMPORTADOR_EJECUTAR: true,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: true,
    RRHH_VER_COLABORADORES: true, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  PSICOORIENTADOR: {
    ACADEMICO_VER: true, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: false, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: false, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: true,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: true, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: true, CONVIVENCIA_CERRAR_CASO: true,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: true, INCLUSION_GESTION_TERAPIAS: true,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: true, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: false, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  ESTUDIANTE: {
    ACADEMICO_VER: false, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: true, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: false, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: false,
    MATRICULAS_VER_ESTUDIANTES: false, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: false, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: false, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: true, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: false,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: false, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: false, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
  ACUDIENTE: {
    ACADEMICO_VER: false, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: true, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: true, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: true, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: true, ASISTENCIA_GESTION_EXCUSAS: true,
    MATRICULAS_VER_ESTUDIANTES: false, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: true, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: true, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: true, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: true,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: false, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: true, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: false, PORTERIA_VER_REGISTROS: false,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: true,
  },
  PORTERIA: {
    ACADEMICO_VER: false, ACADEMICO_CONFIGURAR: false, ACADEMICO_CALIFICAR: false, ACADEMICO_BOLETINES: false, ACADEMICO_CIERRE_PERIODO: false,
    LMS_VER_CURSOS: false, LMS_CREAR_TAREAS: false, LMS_CALIFICAR_ENTREGAS: false, LMS_SUBIR_RECURSOS: false,
    TESORERIA_VER_ESTADOS: false, TESORERIA_REGISTRAR_RECAUDO: false, TESORERIA_FACTURAR_DIAN: false, TESORERIA_ANULAR_RECIBOS: false, TESORERIA_GESTION_BECAS: false,
    CONTABILIDAD_VER_REPORTES: false, CONTABILIDAD_CREAR_ASIENTO: false, CONTABILIDAD_GESTION_PUC: false, CONTABILIDAD_EXPORTAR_EXOGENA: false, CONTABILIDAD_CIERRE_FISCAL: false,
    ASISTENCIA_REGISTRAR: false, ASISTENCIA_VER_HISTORIAL: false, ASISTENCIA_GESTION_EXCUSAS: false,
    MATRICULAS_VER_ESTUDIANTES: true, MATRICULAS_REGISTRAR_NUEVO: false, MATRICULAS_EDITAR_FICHA: false, MATRICULAS_RETIRAR_ESTUDIANTE: false,
    CONVIVENCIA_VER_OBSERVADOR: false, CONVIVENCIA_REGISTRAR_FALTA: false, CONVIVENCIA_CERRAR_CASO: false,
    INCLUSION_VER_EXPEDIENTES: false, INCLUSION_CREAR_PIAR: false, INCLUSION_GESTION_TERAPIAS: false,
    HABEAS_DATA_VER_CONSENTIMIENTOS: false, HABEAS_DATA_GESTION_POLITICAS: false,
    GOBIERNO_VOTAR: false, GOBIERNO_CONFIGURAR_JORNADA: false, GOBIERNO_VER_ESCRUTINIO: false,
    COMUNICADOS_LEER: true, COMUNICADOS_PUBLICAR: false, COMUNICADOS_VER_METRICAS: false,
    DOCUMENTAL_VER_TRAMITES: false, DOCUMENTAL_EMITIR_CERTIFICADOS: false, DOCUMENTAL_GESTION_BPM: false,
    IMPORTADOR_EJECUTAR: false,
    PORTERIA_REGISTRAR_ACCESO: true, PORTERIA_VER_REGISTROS: true,
    RRHH_VER_COLABORADORES: false, RRHH_GESTION_CONTRATOS: false, RRHH_LIQUIDAR_NOMINA: false,
    TRANSPORTE_VER_RUTAS: true, TRANSPORTE_GESTION_RUTAS: false, RESTAURANTE_REGISTRO_PAE: false,
  },
};

@Injectable({
  providedIn: 'root',
})
export class PermisosService {
  private readonly authService = inject(AuthService);

  readonly modulos = signal<ModuloInfo[]>(MODULOS_SISTEMA);
  readonly roles = signal<RoleInfo[]>(ROLES_SISTEMA);

  private readonly matrixState = signal<PermissionsMatrix>(this.loadMatrix());
  readonly matrix = computed(() => this.matrixState());

  private loadMatrix(): PermissionsMatrix {
    const saved = localStorage.getItem('educore_permissions_matrix');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_PERMISSIONS_MATRIX, ...parsed };
        }
      } catch {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_MATRIX));
  }

  saveMatrix(newMatrix: PermissionsMatrix) {
    this.matrixState.set({ ...newMatrix });
    localStorage.setItem('educore_permissions_matrix', JSON.stringify(newMatrix));
  }

  togglePermission(roleCode: string, permissionCode: string): boolean {
    if (roleCode === 'SUPER_ADMIN') {
      return true; // Super admin siempre tiene todo
    }
    const current = { ...this.matrixState() };
    if (!current[roleCode]) {
      current[roleCode] = {};
    }
    const currentVal = !!current[roleCode][permissionCode];
    current[roleCode] = {
      ...current[roleCode],
      [permissionCode]: !currentVal,
    };
    this.saveMatrix(current);
    return !currentVal;
  }

  toggleModuleForRole(roleCode: string, moduloCodigo: string, enable: boolean) {
    if (roleCode === 'SUPER_ADMIN') return;

    const mod = MODULOS_SISTEMA.find((m) => m.codigo === moduloCodigo);
    if (!mod) return;

    const current = { ...this.matrixState() };
    if (!current[roleCode]) {
      current[roleCode] = {};
    }
    const rolePerms = { ...current[roleCode] };
    mod.permisos.forEach((p) => {
      rolePerms[p.codigo] = enable;
    });
    current[roleCode] = rolePerms;
    this.saveMatrix(current);
  }

  resetToDefaults() {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_MATRIX));
    this.saveMatrix(defaults);
  }

  hasPermission(role: string, permissionCode: string): boolean {
    if (!role) return false;
    if (role === 'SUPER_ADMIN') return true;
    const m = this.matrixState();
    return !!(m[role] && m[role][permissionCode]);
  }

  // --- MÉTODOS DE GESTIÓN DE MÓDULOS POR COLEGIO (SUPER_ADMIN EXCLUSIVO) ---

  isModuloActivoEnColegio(colegioId: string, moduloCodigo: string): boolean {
    const cols = this.authService.todosLosColegios();
    const target = cols.find((c) => c.id === colegioId);
    if (!target) return true;
    return target.modulosActivos?.includes(moduloCodigo) ?? true;
  }

  toggleModuloColegio(colegioId: string, moduloCodigo: string, activo: boolean) {
    const cols = [...this.authService.todosLosColegios()];
    const index = cols.findIndex((c) => c.id === colegioId);
    if (index === -1) return;

    const colegio = { ...cols[index] };
    let currentMods = [...(colegio.modulosActivos || [])];

    if (activo && !currentMods.includes(moduloCodigo)) {
      currentMods.push(moduloCodigo);
      currentMods.sort();
    } else if (!activo && currentMods.includes(moduloCodigo)) {
      currentMods = currentMods.filter((m) => m !== moduloCodigo);
    }

    colegio.modulosActivos = currentMods;
    cols[index] = colegio;

    // Actualizar signal en AuthService
    this.authService.todosLosColegios.set(cols);

    // Si el colegio editado es el colegio activo actualmente, actualizarlo
    if (this.authService.colegio()?.id === colegioId) {
      this.authService.setColegio(colegio);
    }

    // Persistir cambios en localStorage
    const customColegios = cols.filter((c) => !COLEGIOS_DEFAULT_IDS.includes(c.id));
    if (customColegios.length > 0) {
      localStorage.setItem('educore_colegios_custom', JSON.stringify(customColegios));
    }

    // Persistir override de módulos de colegios base
    const overridesRaw = localStorage.getItem('educore_colegios_modules_override') || '{}';
    try {
      const overrides = JSON.parse(overridesRaw);
      overrides[colegioId] = currentMods;
      localStorage.setItem('educore_colegios_modules_override', JSON.stringify(overrides));
    } catch {}
  }

  setPlanModulosPreset(colegioId: string, plan: 'BASIC' | 'STANDARD' | 'ENTERPRISE') {
    let mods: string[] = [];
    if (plan === 'BASIC') {
      mods = ['M01', 'M02', 'M05', 'M06', 'M07', 'M10', 'M11'];
    } else if (plan === 'STANDARD') {
      mods = ['M01', 'M02', 'M03', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M14', 'M16'];
    } else {
      mods = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'];
    }

    const cols = [...this.authService.todosLosColegios()];
    const index = cols.findIndex((c) => c.id === colegioId);
    if (index === -1) return;

    const colegio = { ...cols[index], plan, modulosActivos: mods };
    cols[index] = colegio;

    this.authService.todosLosColegios.set(cols);
    if (this.authService.colegio()?.id === colegioId) {
      this.authService.setColegio(colegio);
    }

    const overridesRaw = localStorage.getItem('educore_colegios_modules_override') || '{}';
    try {
      const overrides = JSON.parse(overridesRaw);
      overrides[colegioId] = mods;
      localStorage.setItem('educore_colegios_modules_override', JSON.stringify(overrides));
    } catch {}
  }
}

const COLEGIOS_DEFAULT_IDS = [
  '11111111-2222-3333-4444-555555555555',
  '22222222-3333-4444-5555-666666666666',
  '33333333-4444-5555-6666-777777777777',
];
