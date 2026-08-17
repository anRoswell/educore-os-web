import { Injectable, signal } from '@angular/core';

export interface TerminoGlosario {
  key: string;
  sigla: string;
  nombreCompleto: string;
  categoria: 'Normativa MEN' | 'Sistema Oficial' | 'Pedagogía' | 'Tecnología & Seguridad' | 'Finanzas';
  icono: string;
  explicacionSencilla: string;
  marcoLegal?: string;
  utilidadEnSistema: string;
  ejemplo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlossaryService {
  readonly activeTermino = signal<TerminoGlosario | null>(null);

  private readonly diccionario: Record<string, TerminoGlosario> = {
    SIMAT: {
      key: 'SIMAT',
      sigla: 'SIMAT',
      nombreCompleto: 'Sistema Integrado de Matrícula (MEN)',
      categoria: 'Sistema Oficial',
      icono: '🏛️',
      explicacionSencilla:
        'Es la plataforma nacional obligatoria del Ministerio de Educación donde todos los colegios de Colombia deben registrar y reportar sus estudiantes matriculados, retiros, traslados y cupos disponibles.',
      marcoLegal: 'Resolución 166 de 2003 y directrices del Ministerio de Educación Nacional.',
      utilidadEnSistema:
        'El código SIMAT permite que los grados, asignaturas y estudiantes de EduCoreOS coincidan exactamente con la base de datos nacional, facilitando la exportación de archivos oficiales sin errores de homologación.',
      ejemplo: 'Código SIMAT "10" para el grado Décimo, o "0" para Transición.',
    },
    CODIGO_SIMAT: {
      key: 'CODIGO_SIMAT',
      sigla: 'Código SIMAT',
      nombreCompleto: 'Código Oficial de Homologación SIMAT (MEN)',
      categoria: 'Sistema Oficial',
      icono: '🔢',
      explicacionSencilla:
        'Es el número o código estándar que el Ministerio de Educación asigna a cada grado escolar o programa para poder consolidar las estadísticas nacionales de estudiantes.',
      marcoLegal: 'Manual de Estándares de Información del MEN.',
      utilidadEnSistema:
        'Al registrar este código, EduCoreOS puede generar automáticamente los reportes y archivos planos que la Secretaría de Educación exige cada año.',
      ejemplo: '0 = Preescolar / Transición, 1 a 5 = Primaria, 6 a 9 = Secundaria, 10 y 11 = Media.',
    },
    MEN: {
      key: 'MEN',
      sigla: 'MEN',
      nombreCompleto: 'Ministerio de Educación Nacional de Colombia',
      categoria: 'Normativa MEN',
      icono: '🇨🇴',
      explicacionSencilla:
        'Es la entidad del gobierno colombiano encargada de fijar las políticas, estándares de calidad pedagógica, lineamientos curriculares y normativas para todos los colegios del país.',
      marcoLegal: 'Constitución Política de Colombia (Art. 67) y Ley 115 de 1994.',
      utilidadEnSistema:
        'Garantiza que la estructura académica, planes de estudio y boletines de notas cumplan 100% con los decretos y resoluciones vigentes.',
    },
    LEY_115: {
      key: 'LEY_115',
      sigla: 'Ley 115 de 1994',
      nombreCompleto: 'Ley General de Educación de Colombia',
      categoria: 'Normativa MEN',
      icono: '📜',
      explicacionSencilla:
        'Es la ley principal que organiza la educación en Colombia. Establece que todos los colegios deben impartir obligatoriamente 9 Áreas Fundamentales del Conocimiento (como Matemáticas, Lengua Castellana, Ciencias Naturales, etc.) y define cómo funciona el Gobierno Escolar.',
      marcoLegal: 'Ley 115 de 1994, Artículos 14, 23, 31 y 142.',
      utilidadEnSistema:
        'Al crear un Área del Conocimiento en EduCoreOS, la vinculas con una de las áreas de ley para asegurar que el plan de estudios cumpla con la normatividad curricular.',
      ejemplo: 'Área: "Ciencias Naturales y Educación Ambiental" con asignaturas como Biología, Química y Física.',
    },
    SIEE: {
      key: 'SIEE',
      sigla: 'SIEE',
      nombreCompleto: 'Sistema Institucional de Evaluación de los Estudiantes',
      categoria: 'Pedagogía',
      icono: '📊',
      explicacionSencilla:
        'Es el reglamento interno de evaluación propio de tu colegio. Define cómo se califica a los alumnos, qué porcentaje tiene cada periodo académico, los criterios para aprobar el año y las escalas de desempeño (Superior, Alto, Básico y Bajo).',
      marcoLegal: 'Decreto 1290 de 2009 del MEN.',
      utilidadEnSistema:
        'Los periodos académicos y actividades que configures en EduCoreOS calculan los promedios y emiten los boletines de notas siguiendo fielmente las reglas del SIEE de tu institución.',
      ejemplo: '4 periodos académicos del 25% cada uno con escala numérica de 1.0 a 5.0.',
    },
    PIAR: {
      key: 'PIAR',
      sigla: 'PIAR',
      nombreCompleto: 'Plan Individual de Ajustes Razonables',
      categoria: 'Pedagogía',
      icono: '🧩',
      explicacionSencilla:
        'Es un plan personalizado de apoyo pedagógico diseñado para estudiantes con discapacidad, trastornos de aprendizaje o talentos excepcionales, garantizando una educación inclusiva.',
      marcoLegal: 'Decreto 1421 de 2017 (Educación Inclusiva).',
      utilidadEnSistema:
        'Permite a psicorientación y a los docentes registrar adaptaciones curriculares, seguimientos y apoyos específicos en la ficha integral 360° del alumno.',
    },
    DANE: {
      key: 'DANE',
      sigla: 'Código DANE',
      nombreCompleto: 'Código del Directorio Único de Establecimientos Educativos',
      categoria: 'Sistema Oficial',
      icono: '🏢',
      explicacionSencilla:
        'Es el número de 12 dígitos asignado por el DANE que funciona como la "cédula de identidad" única oficial del colegio ante el Estado colombiano.',
      marcoLegal: 'Departamento Administrativo Nacional de Estadística (DANE).',
      utilidadEnSistema:
        'Encabeza todos los certificados oficiales, diplomas, actas de grado y boletines generados por la plataforma.',
    },
    TRD: {
      key: 'TRD',
      sigla: 'TRD (AGN)',
      nombreCompleto: 'Tablas de Retención Documental',
      categoria: 'Normativa MEN',
      icono: '📁',
      explicacionSencilla:
        'Es el listado técnico avalado por el Archivo General de la Nación que determina cuánto tiempo debe guardarse cada tipo de documento (actas de notas, libros de matrícula, circulares) antes de ser digitalizado o destruido.',
      marcoLegal: 'Ley 594 de 2000 (Ley General de Archivos) y lineamientos del AGN.',
      utilidadEnSistema:
        'Organiza el módulo de Gestión Documental para custodiar las historias académicas y actas de grado con validez legal.',
    },
    CARNET_QR: {
      key: 'CARNET_QR',
      sigla: 'Carnet QR Dinámico',
      nombreCompleto: 'Credencial Digital con Token Criptográfico Rotativo',
      categoria: 'Tecnología & Seguridad',
      icono: '🪪',
      explicacionSencilla:
        'Es un carnet escolar digital para teléfonos móviles cuyo código QR cambia automáticamente cada pocos minutos, impidiendo que los estudiantes se pasen capturas de pantalla para ingresar.',
      marcoLegal: 'Estándares de Ciberseguridad y Control de Acceso Escolar.',
      utilidadEnSistema:
        'Se valida en portería o torniquetes mediante escaneo óptico, registrando la hora exacta de entrada/salida y notificando al padre de familia en tiempo real.',
    },
    WOMPI_PSE: {
      key: 'WOMPI_PSE',
      sigla: 'Wompi / PSE',
      nombreCompleto: 'Pasarela de Recaudo Electrónico (Bancolombia & ACH Colombia)',
      categoria: 'Finanzas',
      icono: '💳',
      explicacionSencilla:
        'Es el sistema de pagos seguros en línea que permite a los padres de familia pagar pensiones, matrículas o certificados directamente desde su cuenta de ahorros (cualquier banco de Colombia), tarjeta de crédito o Nequi.',
      marcoLegal: 'Superintendencia Financiera de Colombia.',
      utilidadEnSistema:
        'Al recibir un pago por Wompi/PSE, la factura en EduCoreOS se marca automáticamente como "PAGADA" en tiempo real y emite el recibo de caja digital.',
    },
    GOBIERNO_ESCOLAR: {
      key: 'GOBIERNO_ESCOLAR',
      sigla: 'Gobierno Escolar',
      nombreCompleto: 'Órganos de Participación y Democracia Escolar',
      categoria: 'Normativa MEN',
      icono: '🗳️',
      explicacionSencilla:
        'Es la estructura democrática donde estudiantes, docentes y padres eligen a sus representantes (Personero, Contralor, Cabildante, Consejo Directivo) para participar en la vida institucional.',
      marcoLegal: 'Ley 115 de 1994 (Art. 142) y Decreto 1860 de 1994.',
      utilidadEnSistema:
        'El módulo de Gobierno Escolar permite realizar votaciones electrónicas secretas e inmutables con tarjetón digital y escrutinio en tiempo real.',
    },
    CAUSAL_SIMAT: {
      key: 'CAUSAL_SIMAT',
      sigla: 'Causal de Retiro SIMAT',
      nombreCompleto: 'Tipificación Oficial de Retiro o Traslado Estudiantil',
      categoria: 'Sistema Oficial',
      icono: '⚠️',
      explicacionSencilla:
        'Es el motivo formal estandarizado por el Ministerio de Educación por el cual un alumno deja de pertenecer al colegio (cambio de ciudad, traslado a otro colegio, motivos socioeconómicos, etc.).',
      marcoLegal: 'Guía de Auditoría de Matrícula del MEN.',
      utilidadEnSistema:
        'Evita sanciones por parte de la Secretaría de Educación al justificar adecuadamente las bajas de cupos en el reporte oficial.',
    },
    LEY_1620: {
      key: 'LEY_1620',
      sigla: 'Ley 1620 de 2013',
      nombreCompleto: 'Ley de Convivencia Escolar y Mitigación de la Violencia',
      categoria: 'Normativa MEN',
      icono: '🛡️',
      explicacionSencilla:
        'Crea el Sistema Nacional de Convivencia Escolar para la formación de derechos humanos, educación para la sexualidad y la prevención y mitigación de la violencia escolar y el bullying en todos los colegios de Colombia.',
      marcoLegal: 'Ley 1620 de 2013 y Decreto Reglamentario 1965 de 2013.',
      utilidadEnSistema:
        'Fundamenta la tipificación obligatoria de faltas Tipo I, II y III, la Ruta de Atención Integral y los procesos de descargos y conciliación.',
      ejemplo: 'Manejo de conflictos escolares, ciberacoso y medidas pedagógicas formativas.',
    },
    SIUCE: {
      key: 'SIUCE',
      sigla: 'SIUCE',
      nombreCompleto: 'Sistema de Información Unificado de Convivencia Escolar',
      categoria: 'Sistema Oficial',
      icono: '📊',
      explicacionSencilla:
        'Es la plataforma del Ministerio de Educación donde los colegios deben reportar estadísticas y casos de acoso escolar, violencia y vulneración de derechos de los menores de edad.',
      marcoLegal: 'Artículo 28 de la Ley 1620 de 2013.',
      utilidadEnSistema:
        'EduCoreOS genera automáticamente los indicadores semestrales y consolidados para cumplir oportunamente con el reporte de la Secretaría de Educación.',
    },
    TIPO_I: {
      key: 'TIPO_I',
      sigla: 'Falta Tipo I (Ley 1620)',
      nombreCompleto: 'Conflictos Manejados Inadecuadamente y Situaciones Esporádicas',
      categoria: 'Normativa MEN',
      icono: '🟢',
      explicacionSencilla:
        'Son desacuerdos o discusiones comunes entre estudiantes que se presentan esporádicamente y no causan daño a la salud física o psicológica.',
      marcoLegal: 'Decreto 1965 de 2013, Artículo 40.',
      utilidadEnSistema:
        'Permite a los docentes mediar y registrar compromisos pedagógicos inmediatos en el aula sin sanciones disciplinarias graves.',
      ejemplo: 'Interrupciones reiteradas en clase, discusiones verbales de momento sin insultos discriminatorios.',
    },
    TIPO_II: {
      key: 'TIPO_II',
      sigla: 'Falta Tipo II (Ley 1620)',
      nombreCompleto: 'Acoso Escolar (Bullying) y Ciberacoso Reiterado',
      categoria: 'Normativa MEN',
      icono: '🟠',
      explicacionSencilla:
        'Situaciones de agresión reiterada, bullying, ciberacoso o violencia que dañan la integridad psicológica o moral del estudiante sin constituir un delito formal con incapacidad médica.',
      marcoLegal: 'Decreto 1965 de 2013, Artículo 40.',
      utilidadEnSistema:
        'Activa la Ruta de Atención Integral: notificación obligatoria a acudientes, descargos formales y remisión al Comité de Convivencia Escolar.',
      ejemplo: 'Creación de grupos en redes para burlarse de un estudiante o exclusión social sistemática.',
    },
    TIPO_III: {
      key: 'TIPO_III',
      sigla: 'Falta Tipo III (Ley 1620)',
      nombreCompleto: 'Presuntos Delitos y Violencia con Incapacidad',
      categoria: 'Normativa MEN',
      icono: '🔴',
      explicacionSencilla:
        'Situaciones de extrema gravedad que configuran presuntos delitos según la ley colombiana (porte de armas, venta o consumo de sustancias psicoactivas, agresiones físicas graves o abusos).',
      marcoLegal: 'Decreto 1965 de 2013, Art. 40 y Código de la Infancia y la Adolescencia (Ley 1098 de 2006).',
      utilidadEnSistema:
        'Exige la activación inmediata de la Ruta Externa: denuncia y remisión prioritaria a Policía de Infancia y Adolescencia, ICBF, Fiscalía y atención médica de urgencias.',
      ejemplo: 'Lesiones personales con incapacidad o amenazas graves contra la vida.',
    },
    DEBIDO_PROCESO: {
      key: 'DEBIDO_PROCESO',
      sigla: 'Debido Proceso Disciplinario',
      nombreCompleto: 'Garantía Constitucional de Defensa y Descargos',
      categoria: 'Normativa MEN',
      icono: '⚖️',
      explicacionSencilla:
        'Es el principio fundamental que garantiza que todo estudiante tiene derecho a ser escuchado, a presentar sus descargos y pruebas, y a estar acompañado por su acudiente antes de recibir cualquier sanción formativa.',
      marcoLegal: 'Constitución Política de Colombia (Art. 29) y Sentencias T-478/15 y T-240/18 de la Corte Constitucional.',
      utilidadEnSistema:
        'El módulo de Convivencia registra la fecha, versión de los hechos y firmas digitales inalterables para blindar legalmente al colegio ante tutelas.',
    },
    COMITE_CONVIVENCIA: {
      key: 'COMITE_CONVIVENCIA',
      sigla: 'Comité de Convivencia Escolar',
      nombreCompleto: 'Instancia Institucional de Mediación y Clima Escolar',
      categoria: 'Normativa MEN',
      icono: '🤝',
      explicacionSencilla:
        'Órgano colegiado conformado por el Rector, el Personero Estudiantil, el Coordinador, un docente, un padre de familia y el orientador escolar para liderar acciones de convivencia y resolver casos Tipo II y III.',
      marcoLegal: 'Artículo 12 de la Ley 1620 de 2013.',
      utilidadEnSistema:
        'Gestiona las convocatorias de reuniones, el orden del día, las deliberaciones y la generación automática de actas foliadas y firmadas.',
    },
  };

  mostrar(key: string) {
    const cleanKey = key.toUpperCase().trim();
    const termino = this.diccionario[cleanKey] || this.buscarAproximado(cleanKey);
    if (termino) {
      this.activeTermino.set(termino);
    }
  }

  cerrar() {
    this.activeTermino.set(null);
  }

  getTermino(key: string): TerminoGlosario | undefined {
    const cleanKey = key.toUpperCase().trim();
    return this.diccionario[cleanKey] || this.buscarAproximado(cleanKey);
  }

  private buscarAproximado(query: string): TerminoGlosario | undefined {
    const keys = Object.keys(this.diccionario);
    const found = keys.find((k) => query.includes(k) || k.includes(query));
    return found ? this.diccionario[found] : undefined;
  }
}
