import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lms-cuestionario-creador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lms-cuestionario-creador.html',
  styleUrls: ['./lms-cuestionario-creador.scss']
})
export class LmsCuestionarioCreadorComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  form: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    fechaApertura: ['', Validators.required],
    fechaCierre: ['', Validators.required],
    limiteTiempoMinutos: [60],
    preguntas: this.fb.array([])
  });

  get preguntas() {
    return this.form.get('preguntas') as FormArray;
  }

  opciones(preguntaIndex: number) {
    return this.preguntas.at(preguntaIndex).get('opciones') as FormArray;
  }

  addPregunta() {
    const preguntaForm = this.fb.group({
      enunciado: ['', Validators.required],
      tipo: ['CERRADA_MULTIPLE', Validators.required],
      valorPuntos: [1, [Validators.required, Validators.min(0.1)]],
      opciones: this.fb.array([])
    });
    this.preguntas.push(preguntaForm);
    this.addOpcion(this.preguntas.length - 1);
  }

  removePregunta(index: number) {
    this.preguntas.removeAt(index);
  }

  addOpcion(preguntaIndex: number) {
    const opcionForm = this.fb.group({
      texto: ['', Validators.required],
      esCorrecta: [false]
    });
    this.opciones(preguntaIndex).push(opcionForm);
  }

  removeOpcion(preguntaIndex: number, opcionIndex: number) {
    this.opciones(preguntaIndex).removeAt(opcionIndex);
  }

  setOpcionCorrecta(preguntaIndex: number, opcionIndex: number) {
    const opts = this.opciones(preguntaIndex);
    opts.controls.forEach((c, i) => {
      c.get('esCorrecta')?.setValue(i === opcionIndex);
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.created.emit(this.form.value);
  }
}
