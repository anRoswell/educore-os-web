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
