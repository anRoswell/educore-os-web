import sys

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

old_p = """                          <button 
                            (click)="a.estado = 'PRESENTE'" 
                            [class.active]="a.estado === 'PRESENTE'" 
                            class="estado-btn btn-presente">
                            P
                          </button>"""
new_p = """                          <button 
                            (click)="a.estado = 'PRESENTE'" 
                            [class.active]="a.estado === 'PRESENTE'" 
                            class="estado-btn btn-presente"
                            title="Presente (El estudiante asistió puntualmente)">
                            P
                          </button>"""
content = content.replace(old_p, new_p)

old_r = """                          <button 
                            (click)="a.estado = 'RETARDO'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'RETARDO'" 
                            class="estado-btn btn-retardo">
                            R
                          </button>"""
new_r = """                          <button 
                            (click)="a.estado = 'RETARDO'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'RETARDO'" 
                            class="estado-btn btn-retardo"
                            title="Retardo (El estudiante llegó tarde)">
                            R
                          </button>"""
content = content.replace(old_r, new_r)

old_f = """                          <button 
                            (click)="a.estado = 'FALTA_INJUSTIFICADA'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'FALTA_INJUSTIFICADA'" 
                            class="estado-btn btn-falta">
                            F
                          </button>"""
new_f = """                          <button 
                            (click)="a.estado = 'FALTA_INJUSTIFICADA'; a.notificarAcudiente = true" 
                            [class.active]="a.estado === 'FALTA_INJUSTIFICADA'" 
                            class="estado-btn btn-falta"
                            title="Falta Injustificada (No asistió y no tiene excusa)">
                            F
                          </button>"""
content = content.replace(old_f, new_f)

old_fj = """                          <button 
                            (click)="a.estado = 'FALTA_JUSTIFICADA'" 
                            [class.active]="a.estado === 'FALTA_JUSTIFICADA'" 
                            class="estado-btn btn-justificada">
                            FJ
                          </button>"""
new_fj = """                          <button 
                            (click)="a.estado = 'FALTA_JUSTIFICADA'" 
                            [class.active]="a.estado === 'FALTA_JUSTIFICADA'" 
                            class="estado-btn btn-justificada"
                            title="Falta Justificada (Ausencia con excusa médica o calamidad)">
                            FJ
                          </button>"""
content = content.replace(old_fj, new_fj)

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
