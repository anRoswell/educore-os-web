import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-lms-cuestionario-toma',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lms-cuestionario-toma.html',
  styleUrls: ['./lms-cuestionario-toma.scss']
})
export class LmsCuestionarioTomaComponent implements OnInit {
  @Input() cuestionario: any; // El objeto con preguntas y opciones
  @Input() matriculaId!: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  
  form!: FormGroup;
  minutosRestantes: number = 0;
  timerInterval: any;

  ngOnInit() {
    this.buildForm();
    if (this.cuestionario.limiteTiempoMinutos) {
      this.iniciarTemporizador(this.cuestionario.limiteTiempoMinutos);
    }
  }

  buildForm() {
    this.form = this.fb.group({
      matriculaId: [this.matriculaId, Validators.required],
      respuestas: this.fb.array([])
    });

    const respuestasArr = this.form.get('respuestas') as FormArray;
    
    if (this.cuestionario.preguntas) {
      for (const p of this.cuestionario.preguntas) {
        respuestasArr.push(this.fb.group({
          preguntaId: [p.id, Validators.required],
          opcionId: [''],
          respuestaTexto: ['']
        }));
      }
    }
  }

  get respuestasControls() {
    return (this.form.get('respuestas') as FormArray).controls;
  }

  iniciarTemporizador(minutos: number) {
    this.minutosRestantes = minutos * 60;
    this.timerInterval = setInterval(() => {
      this.minutosRestantes--;
      if (this.minutosRestantes <= 0) {
        clearInterval(this.timerInterval);
        this.enviarFuerza();
      }
    }, 1000);
  }

  get tiempoFormateado() {
    if (this.minutosRestantes <= 0) return '00:00';
    const m = Math.floor(this.minutosRestantes / 60);
    const s = this.minutosRestantes % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  enviarFuerza() {
    // Cuando el tiempo expira
    this.submitted.emit(this.form.value);
  }

  guardar() {
    if (this.form.invalid) return;
    clearInterval(this.timerInterval);
    this.submitted.emit(this.form.value);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
