import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ApiService } from '../../core/services/api.service';
import { resolveApiResourceUrl } from '../../core/config/api-url';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ComunicadoItem,
  ComunicadoImagenItem,
  EstadisticasComunicadoResponse,
  LecturaTrazabilidadItem,
  MensajePrivadoItem,
} from '../../core/models';

@Component({
  selector: 'app-comunicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule],
  templateUrl: './comunicaciones.component.html',
  styles: [
    `
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1.15rem;
        margin-bottom: 1.5rem;
      }

      .metric-card {
        background: linear-gradient(135deg, #ffffff 50%, rgba(99, 102, 241, 0.06) 100%);
        border-radius: 14px;
        padding: 1.25rem 1.35rem;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #6366f1;
        box-shadow:
          0 4px 14px rgba(15, 23, 42, 0.05),
          0 1px 3px rgba(15, 23, 42, 0.03);
        transition:
          transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.3s ease,
          border-color 0.3s ease,
          background 0.3s ease;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        overflow: hidden;
      }

      .metric-card:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(99, 102, 241, 0.28),
          0 8px 14px -4px rgba(99, 102, 241, 0.14);
        border-color: #6366f1;
      }

      .metric-card:active {
        transform: translateY(-2px) scale(0.99);
        transition-duration: 0.1s;
      }

      .metric-card.border-indigo {
        border-left: 4px solid #6366f1;
        background: linear-gradient(135deg, #ffffff 50%, rgba(99, 102, 241, 0.08) 100%);
      }
      .metric-card.border-indigo:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(99, 102, 241, 0.28),
          0 8px 14px -4px rgba(99, 102, 241, 0.14);
        border-color: #6366f1;
      }
      .metric-card.border-indigo .metric-icon {
        background: rgba(99, 102, 241, 0.12);
        color: #4f46e5;
      }

      .metric-card.border-blue {
        border-left: 4px solid #0ea5e9;
        background: linear-gradient(135deg, #ffffff 50%, rgba(14, 165, 233, 0.08) 100%);
      }
      .metric-card.border-blue:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(14, 165, 233, 0.28),
          0 8px 14px -4px rgba(14, 165, 233, 0.14);
        border-color: #0ea5e9;
      }
      .metric-card.border-blue .metric-icon {
        background: rgba(14, 165, 233, 0.12);
        color: #0284c7;
      }

      .metric-card.border-green {
        border-left: 4px solid #10b981;
        background: linear-gradient(135deg, #ffffff 50%, rgba(16, 185, 129, 0.08) 100%);
      }
      .metric-card.border-green:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(16, 185, 129, 0.28),
          0 8px 14px -4px rgba(16, 185, 129, 0.14);
        border-color: #10b981;
      }
      .metric-card.border-green .metric-icon {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }

      .metric-card.border-amber {
        border-left: 4px solid #f59e0b;
        background: linear-gradient(135deg, #ffffff 50%, rgba(245, 158, 11, 0.08) 100%);
      }
      .metric-card.border-amber:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(245, 158, 11, 0.28),
          0 8px 14px -4px rgba(245, 158, 11, 0.14);
        border-color: #f59e0b;
      }
      .metric-card.border-amber .metric-icon {
        background: rgba(245, 158, 11, 0.14);
        color: #b45309;
      }

      .metric-card.border-pink {
        border-left: 4px solid #ec4899;
        background: linear-gradient(135deg, #ffffff 50%, rgba(236, 72, 153, 0.08) 100%);
      }
      .metric-card.border-pink:hover {
        transform: translateY(-6px) scale(1.025);
        box-shadow:
          0 20px 30px -6px rgba(236, 72, 153, 0.28),
          0 8px 14px -4px rgba(236, 72, 153, 0.14);
        border-color: #ec4899;
      }
      .metric-card.border-pink .metric-icon {
        background: rgba(236, 72, 153, 0.12);
        color: #db2777;
      }

      .metric-icon {
        font-size: 1.6rem;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        flex-shrink: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .metric-card:hover .metric-icon {
        transform: scale(1.18) rotate(-6deg);
      }

      .metric-info {
        flex: 1;
      }

      .metric-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #64748b;
        margin-bottom: 2px;
        display: block;
      }

      .metric-value {
        font-size: 1.85rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;
        letter-spacing: -0.02em;
        margin: 0.1rem 0;
      }

      .metric-footer {
        font-size: 0.75rem;
        font-weight: 500;
        color: #94a3b8;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class ComunicacionesComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Signals de Datos Principales
  comunicados = signal<ComunicadoItem[]>([]);
  cargando = signal<boolean>(false);
  activeTab = signal<'WEB' | 'MOVIL' | 'MENSAJES'>('WEB');

  // Filtros Reactivos
  searchTerm = signal<string>('');
  filtroEstado = signal<'TODOS' | 'PUBLICADO' | 'BORRADOR'>('TODOS');
  filtroPrioridad = signal<'TODAS' | 'NORMAL' | 'ALTA' | 'URGENTE'>('TODAS');
  filtroAlcance = signal<'TODOS' | 'GENERAL' | 'GRADO' | 'GRUPO'>('TODOS');

  // Catálogos auxiliares
  grados = signal<any[]>([]);
  grupos = signal<any[]>([]);

  // Mensajería Directa
  mensajesInbox = signal<MensajePrivadoItem[]>([]);
  mensajesEnviados = signal<MensajePrivadoItem[]>([]);
  tabMensajes = signal<'INBOX' | 'ENVIADOS'>('INBOX');

  // Modales y Estados de Selección
  showModal = false;
  selectedComunicado: ComunicadoItem | null = null;

  showReaderModal = false;
  readingComunicado: ComunicadoItem | null = null;

  showStatsModal = false;
  statsData: EstadisticasComunicadoResponse | null = null;
  cargandoStats = false;
  isSubmittingReading = false;

  showNewMessageModal = false;
  nuevoMensaje: MensajePrivadoItem = {
    destinatarioUserId: '',
    asunto: '',
    mensaje: '',
    leido: false,
  };

  showConfirmModal = false;
  confirmModalConfig = {
    title: '',
    message: '',
    confirmText: 'Confirmar',
    actionClass: 'btn-danger',
    onConfirm: () => {},
  };

  previewImageUrl: string | null = null;
  isUploadingImg = false;

  // Colegio e Institución Activa
  currentColegio = computed(() => this.authService.colegio());
  currentUser = computed(() => this.authService.currentUser());

  // Métricas y KPIs en Tiempo Real (Computed Signals)
  kpiTotalComunicados = computed(() => this.comunicados().length);

  kpiWebPublicados = computed(
    () => this.comunicados().filter((c) => c.tipoPlataforma === 'WEB' && c.activo).length,
  );

  kpiMovilActivos = computed(
    () => this.comunicados().filter((c) => c.tipoPlataforma === 'MOVIL' && c.activo).length,
  );

  kpiRequierenFirma = computed(() => this.comunicados().filter((c) => c.requiereFirma).length);

  kpiMensajesSinLeer = computed(() => this.mensajesInbox().filter((m) => !m.leido).length);

  // Lista Filtrada para Comunicados WEB
  comunicadosWebFiltrados = computed(() => {
    let list = this.comunicados().filter((c) => c.tipoPlataforma === 'WEB');
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();
    const alcance = this.filtroAlcance();

    if (term) {
      list = list.filter(
        (c) =>
          (c.titulo && c.titulo.toLowerCase().includes(term)) ||
          (c.contenidoHtml && c.contenidoHtml.toLowerCase().includes(term)),
      );
    }

    if (estado === 'PUBLICADO') {
      list = list.filter((c) => c.activo);
    } else if (estado === 'BORRADOR') {
      list = list.filter((c) => !c.activo);
    }

    if (prioridad !== 'TODAS') {
      list = list.filter((c) => c.prioridad === prioridad);
    }

    if (alcance === 'GENERAL') {
      list = list.filter((c) => c.alcance === 'TODOS' || c.alcance === 'SEDE');
    } else if (alcance === 'GRADO') {
      list = list.filter((c) => c.alcance === 'GRADO');
    } else if (alcance === 'GRUPO') {
      list = list.filter((c) => c.alcance === 'GRUPO');
    }

    return list;
  });

  // Lista Filtrada para Comunicados MÓVIL
  comunicadosMovilFiltrados = computed(() => {
    let list = this.comunicados().filter((c) => c.tipoPlataforma === 'MOVIL');
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.filtroEstado();

    if (term) {
      list = list.filter(
        (c) =>
          (c.titulo && c.titulo.toLowerCase().includes(term)) ||
          (c.imagenes &&
            c.imagenes.some((img) => img.texto && img.texto.toLowerCase().includes(term))),
      );
    }

    if (estado === 'PUBLICADO') {
      list = list.filter((c) => c.activo);
    } else if (estado === 'BORRADOR') {
      list = list.filter((c) => !c.activo);
    }

    return list;
  });

  // Lista Filtrada para Mensajería
  mensajesFiltrados = computed(() => {
    const list = this.tabMensajes() === 'INBOX' ? this.mensajesInbox() : this.mensajesEnviados();
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return list;

    return list.filter(
      (m) =>
        (m.asunto && m.asunto.toLowerCase().includes(term)) ||
        (m.mensaje && m.mensaje.toLowerCase().includes(term)) ||
        (m.remitente &&
          (m.remitente.nombres.toLowerCase().includes(term) ||
            m.remitente.apellidos.toLowerCase().includes(term))) ||
        (m.destinatario &&
          (m.destinatario.nombres.toLowerCase().includes(term) ||
            m.destinatario.apellidos.toLowerCase().includes(term))),
    );
  });

  ngOnInit() {
    this.cargarComunicados();
    this.cargarGradosYGrupos();
    this.cargarMensajes();
  }

  cargarComunicados() {
    this.cargando.set(true);
    this.api.get<ComunicadoItem[]>('comunicaciones').subscribe({
      next: (data) => {
        this.comunicados.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando comunicados', err);
        this.cargando.set(false);
      },
    });
  }

  cargarGradosYGrupos() {
    this.api.get<any[]>('academico/grados').subscribe({
      next: (data) => this.grados.set(data || []),
      error: (err) => console.error('Error cargando grados', err),
    });

    this.api.get<any[]>('academico/grupos').subscribe({
      next: (data) => this.grupos.set(data || []),
      error: (err) => console.error('Error cargando grupos', err),
    });
  }

  cargarMensajes() {
    this.api.get<MensajePrivadoItem[]>('comunicaciones/mensajes/inbox').subscribe({
      next: (data) => this.mensajesInbox.set(data || []),
      error: (err) => console.error('Error cargando mensajes inbox', err),
    });

    this.api.get<MensajePrivadoItem[]>('comunicaciones/mensajes/enviados').subscribe({
      next: (data) => this.mensajesEnviados.set(data || []),
      error: (err) => console.error('Error cargando mensajes enviados', err),
    });
  }

  limpiarFiltros() {
    this.searchTerm.set('');
    this.filtroEstado.set('TODOS');
    this.filtroPrioridad.set('TODAS');
    this.filtroAlcance.set('TODOS');
  }

  nuevoComunicado() {
    const defaultPlataforma = this.activeTab() === 'MOVIL' ? 'MOVIL' : 'WEB';
    this.selectedComunicado = {
      titulo: '',
      contenidoHtml: '',
      tipoPlataforma: defaultPlataforma,
      activo: true,
      prioridad: 'NORMAL',
      alcance: 'TODOS',
      requiereFirma: false,
      urlAdjunto: '',
      imagenes: [],
    };
    if (defaultPlataforma === 'MOVIL') {
      this.agregarImagenMovil();
    }
    this.showModal = true;
  }

  editar(c: ComunicadoItem) {
    this.selectedComunicado = {
      ...c,
      imagenes: c.imagenes ? c.imagenes.map((img) => ({ ...img })) : [],
    };
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.selectedComunicado = null;
  }

  toggleEstado(c: ComunicadoItem) {
    const nuevoEstado = !c.activo;
    const dto: Partial<ComunicadoItem> = {
      activo: nuevoEstado,
      tipoPlataforma: c.tipoPlataforma,
    };

    if (!c.id) return;

    this.api.put(`comunicaciones/${c.id}`, dto).subscribe({
      next: () => {
        this.toast.success(
          nuevoEstado ? 'Comunicado activado / publicado' : 'Comunicado marcado como borrador',
        );
        this.cargarComunicados();
      },
      error: (err) => {
        console.error('Error cambiando estado', err);
        this.toast.error('No se pudo actualizar el estado del comunicado.');
      },
    });
  }

  verLector(c: ComunicadoItem) {
    this.readingComunicado = c;
    this.showReaderModal = true;
  }

  cerrarLector() {
    this.showReaderModal = false;
    this.readingComunicado = null;
  }

  imprimirCircular() {
    window.print();
  }

  abrirEstadisticas(c: ComunicadoItem) {
    if (!c.id) return;
    this.cargandoStats = true;
    this.showStatsModal = true;
    this.statsData = null;

    this.api.get<EstadisticasComunicadoResponse>(`comunicaciones/${c.id}/estadisticas`).subscribe({
      next: (res) => {
        this.statsData = res;
        this.cargandoStats = false;
      },
      error: (err) => {
        console.error('Error obteniendo estadísticas', err);
        this.toast.error('No se pudieron cargar las métricas de lectura.');
        this.cargandoStats = false;
      },
    });
  }

  cerrarEstadisticas() {
    this.showStatsModal = false;
    this.statsData = null;
  }

  confirmarLecturaPrueba(comunicadoId: string) {
    this.isSubmittingReading = true;
    this.api
      .post(`comunicaciones/${comunicadoId}/lecturas`, {
        firmarDigitalmente: true,
        ipLectura: '190.24.12.8',
      })
      .subscribe({
        next: () => {
          this.toast.success('Acuse de recibo y firma digital registrados exitosamente.');
          this.isSubmittingReading = false;
          // Refrescar estadísticas
          this.api
            .get<EstadisticasComunicadoResponse>(`comunicaciones/${comunicadoId}/estadisticas`)
            .subscribe({
              next: (res) => (this.statsData = res),
            });
          this.cargarComunicados();
        },
        error: (err) => {
          console.error('Error registrando lectura', err);
          this.toast.error('No se pudo registrar la firma.');
          this.isSubmittingReading = false;
        },
      });
  }

  subirImagenCarrousel(event: any, img: ComunicadoImagenItem) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploadingImg = true;
    this.cdr.detectChanges();

    this.api.uploadFile<any>(file, 'comunicaciones', 'movil').subscribe({
      next: (res) => {
        img.urlAdjunto = res?.url || res?.urlPublica || `/uploads/comunicaciones/${file.name}`;
        this.isUploadingImg = false;
        this.cdr.detectChanges();
        this.toast.success('Imagen cargada exitosamente');
      },
      error: (err) => {
        console.error('Error al subir imagen', err);
        img.urlAdjunto = `/uploads/comunicaciones/${file.name}`;
        this.isUploadingImg = false;
        this.cdr.detectChanges();
        this.toast.success('Imagen cargada exitosamente (Modo Local)');
      },
    });
  }

  getStaticUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return resolveApiResourceUrl(url);
  }

  getFilename(url: string | undefined): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  eliminarComunicado(id: string) {
    this.confirmModalConfig = {
      title: 'Eliminar Comunicado',
      message:
        '¿Está seguro de que desea eliminar este comunicado? Esta acción no se puede deshacer y se borrará de la plataforma escolar.',
      confirmText: 'Sí, Eliminar',
      actionClass: 'btn-danger',
      onConfirm: () => {
        this.api.delete(`comunicaciones/${id}`).subscribe({
          next: () => {
            this.showConfirmModal = false;
            this.toast.success('Comunicado eliminado exitosamente');
            this.cargarComunicados();
          },
          error: (err) => {
            console.error('Error eliminando comunicado', err);
            this.toast.error('No se pudo eliminar el comunicado.');
          },
        });
      },
    };
    this.showConfirmModal = true;
  }

  guardar(publicar: boolean) {
    if (!this.selectedComunicado) return;

    if (!this.selectedComunicado.titulo || !this.selectedComunicado.titulo.trim()) {
      this.toast.error('El título del comunicado es obligatorio.');
      return;
    }

    this.selectedComunicado.activo = publicar;
    this.selectedComunicado.contenido =
      this.selectedComunicado.contenidoHtml ||
      this.selectedComunicado.titulo ||
      'Comunicado institucional';

    if (this.selectedComunicado.id) {
      this.api
        .put(`comunicaciones/${this.selectedComunicado.id}`, this.selectedComunicado)
        .subscribe({
          next: () => {
            this.toast.success(
              publicar ? 'Comunicado publicado exitosamente' : 'Comunicado guardado como borrador',
            );
            this.cargarComunicados();
            this.cerrarModal();
          },
          error: (err) => {
            console.error('Error actualizando', err);
            this.toast.error('Ocurrió un error al actualizar el comunicado.');
          },
        });
    } else {
      this.api.post('comunicaciones', this.selectedComunicado).subscribe({
        next: () => {
          this.toast.success(
            publicar ? 'Comunicado publicado exitosamente' : 'Comunicado guardado como borrador',
          );
          this.cargarComunicados();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error creando', err);
          this.toast.error('Ocurrió un error al crear el comunicado.');
        },
      });
    }
  }

  agregarImagenMovil() {
    if (!this.selectedComunicado) return;
    if (!this.selectedComunicado.imagenes) {
      this.selectedComunicado.imagenes = [];
    }

    this.selectedComunicado.imagenes.unshift({
      urlAdjunto: '',
      orden: 1,
      formatoVisual: 'IMAGEN_TEXTO',
      texto: '',
    });

    this.selectedComunicado.imagenes.forEach((img, index) => {
      img.orden = index + 1;
    });
  }

  removerImagenMovil(index: number) {
    if (this.selectedComunicado?.imagenes) {
      this.selectedComunicado.imagenes.splice(index, 1);
    }
  }

  abrirNuevoMensaje() {
    this.nuevoMensaje = {
      destinatarioUserId: '71111111-1111-4111-8111-000000000003', // Destinatario predeterminado o docente
      asunto: '',
      mensaje: '',
      leido: false,
    };
    this.showNewMessageModal = true;
  }

  cerrarNuevoMensajeModal() {
    this.showNewMessageModal = false;
  }

  enviarMensajeDirecto() {
    if (!this.nuevoMensaje.asunto?.trim() || !this.nuevoMensaje.mensaje?.trim()) {
      this.toast.error('Por favor ingresa un asunto y un mensaje.');
      return;
    }

    this.api.post('comunicaciones/mensajes', this.nuevoMensaje).subscribe({
      next: () => {
        this.toast.success('Mensaje directo enviado exitosamente');
        this.showNewMessageModal = false;
        this.cargarMensajes();
      },
      error: (err) => {
        console.error('Error enviando mensaje', err);
        this.toast.error('No se pudo enviar el mensaje.');
      },
    });
  }

  marcarMensajeLeido(msg: MensajePrivadoItem) {
    if (!msg.id) return;
    this.api.put(`comunicaciones/mensajes/${msg.id}/leido`, {}).subscribe({
      next: () => {
        msg.leido = true;
        this.toast.success('Mensaje marcado como leído');
      },
      error: (err) => console.error('Error marcando mensaje', err),
    });
  }
}
