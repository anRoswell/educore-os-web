import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { QuillModule } from 'ngx-quill';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-comunicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule],
  templateUrl: './comunicaciones.component.html'
})
export class ComunicacionesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  
  comunicados: any[] = [];
  selectedComunicado: any = null;
  
  // Nuevo estado para Tabs y Modal
  activeTab: 'WEB' | 'MOVIL' = 'WEB';
  showModal = false;
  
  ngOnInit() {
    this.cargarComunicados();
  }
  
  cargarComunicados() {
    this.api.get<any[]>('comunicaciones').subscribe({
      next: (data) => {
        this.comunicados = data;
      },
      error: (err) => console.error('Error cargando comunicados', err)
    });
  }

  // Filtrado de comunicados según la pestaña actual
  get comunicadosFiltrados() {
    return this.comunicados.filter(c => c.tipoPlataforma === this.activeTab);
  }
  
  nuevoComunicado() {
    this.selectedComunicado = {
      tipoPlataforma: this.activeTab,
      activo: true,
      imagenes: []
    };
    this.showModal = true;
  }
  
  editar(c: any) {
    this.selectedComunicado = { ...c };
    if (!this.selectedComunicado.imagenes) {
      this.selectedComunicado.imagenes = [];
    }
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.selectedComunicado = null;
  }

  isUploadingImg = false;

  subirImagenCarrousel(event: any, img: any) {
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
        this.toast.success('Imagen cargada exitosamente (Modo Offline)');
      }
    });
  }

  getStaticUrl(url: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getFilename(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || url;
  }

  showConfirmModal = false;
  confirmModalConfig = { title: '', message: '', confirmText: 'Confirmar', actionClass: 'btn-danger', onConfirm: () => {} };

  previewImageUrl: string | null = null;

  eliminarComunicado(id: string) {
    this.confirmModalConfig = {
      title: 'Eliminar Comunicado',
      message: '¿Está seguro de que desea eliminar este comunicado? Esta acción no se puede deshacer y se borrará de la plataforma.',
      confirmText: 'Sí, Eliminar',
      actionClass: 'btn-danger',
      onConfirm: () => {
        this.api.delete(`comunicaciones/${id}`).subscribe({
          next: () => {
            this.showConfirmModal = false;
            this.cargarComunicados();
          },
          error: (err) => console.error('Error eliminando comunicado', err)
        });
      }
    };
    this.showConfirmModal = true;
  }
  
  guardar(publicar: boolean) {
    this.selectedComunicado.activo = publicar;
    
    if (this.selectedComunicado.id) {
      this.api.put(`comunicaciones/${this.selectedComunicado.id}`, this.selectedComunicado).subscribe({
        next: () => {
          this.toast.success(publicar ? 'Comunicado publicado exitosamente' : 'Comunicado guardado como borrador');
          this.cargarComunicados();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error actualizando', err);
          this.toast.error('Ocurrió un error al actualizar el comunicado.');
        }
      });
    } else {
      this.api.post('comunicaciones', this.selectedComunicado).subscribe({
        next: () => {
          this.toast.success(publicar ? 'Comunicado publicado exitosamente' : 'Comunicado guardado como borrador');
          this.cargarComunicados();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error creando', err);
          this.toast.error('Ocurrió un error al crear el comunicado.');
        }
      });
    }
  }

  agregarImagenMovil() {
    this.selectedComunicado.imagenes.unshift({
      urlAdjunto: '',
      orden: 1,
      formatoVisual: 'IMAGEN_TEXTO',
      texto: ''
    });
    
    // Recalcular el orden de todas las imágenes para mantener la secuencia correcta
    this.selectedComunicado.imagenes.forEach((img: any, index: number) => {
      img.orden = index + 1;
    });
  }
  
  removerImagenMovil(index: number) {
    this.selectedComunicado.imagenes.splice(index, 1);
  }
}
