import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { ImportadorComponent } from './importador.component';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

describe('ImportadorComponent (Excel & SIMAT Frontend)', () => {
  let component: ImportadorComponent;
  let fixture: ComponentFixture<ImportadorComponent>;

  const mockApiService = {
    get: vi.fn().mockReturnValue(of({})),
    post: vi.fn().mockReturnValue(of({ success: true, insertados: 10 })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportadorComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Debe inicializar el componente de importación con entidad Estudiantes por defecto', () => {
    expect(component).toBeTruthy();
    expect(component.entidadSeleccionada()).toBe('ESTUDIANTES');
  });

  it('2. Debe cambiar de entidad y actualizar los requisitos de columnas', () => {
    component.seleccionarEntidad('COLEGIOS');
    expect(component.entidadSeleccionada()).toBe('COLEGIOS');
    expect(component.getEntidadActual()?.nombre).toContain('Colegios');
  });

  it('3. Debe limpiar los datos al cancelar el archivo cargado', () => {
    component.filasParsed.set([
      { numeroFila: 1, data: { primer_nombre: 'Juan' }, estado: 'VALIDO', errores: [] },
    ]);
    expect(component.totalFilas()).toBe(1);

    component.limpiarArchivo();
    expect(component.archivoCargado()).toBeNull();
    expect(component.filasParsed().length).toBe(0);
    expect(component.totalFilas()).toBe(0);
  });
});
