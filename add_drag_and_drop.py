import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

# Replace the HTML
old_html = r"""<div class="form-group mt-4 p-3 border rounded" style="background: #f8fafc; border: 1px dashed #cbd5e1;">\s*<label class="form-label-modern mb-1">📎 Adjuntar Documento \(PDF, Word, Excel\)</label>\s*<input type="file" class="form-control-modern" \(change\)="onFileSelected\(\$event\)" style="border: none; background: white; padding: 0.5rem;" accept="\.pdf,\.doc,\.docx,\.xls,\.xlsx,\.ppt,\.pptx">\s*@if \(archivoSeleccionado\(\)\) \{\s*<div class="text-sm mt-2 text-success">\s*<strong>Seleccionado:</strong> \{\{ archivoSeleccionado\(\)\?\.name \}\}\s*</div>\s*\}\s*</div>"""

new_html = """<div class="form-group mt-4 p-4 border rounded text-center drag-drop-zone"
                     [style.background]="isDragOver() ? '#f1f5f9' : '#f8fafc'"
                     [style.borderColor]="isDragOver() ? '#6366f1' : '#cbd5e1'"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     style="border: 2px dashed; transition: all 0.2s ease; cursor: pointer; border-radius: 8px;"
                     (click)="fileInput.click()">
                  <label class="form-label-modern mb-0" style="cursor: pointer; display: block;">
                    <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem;">📎</div>
                    <strong style="color: #475569;">Arrastra y suelta un documento aquí</strong><br>
                    <span style="color: #64748b; font-size: 0.85rem;">o haz clic para explorar (PDF, Word, Excel)</span>
                  </label>
                  <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none;" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx">
                  @if (archivoSeleccionado()) {
                    <div class="mt-3 p-2 text-success" style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px;">
                      <strong>✅ Seleccionado:</strong> {{ archivoSeleccionado()?.name }}
                    </div>
                  }
                </div>"""

content = re.sub(old_html, new_html, content)

# Add TS methods
methods = """  // Drag & Drop
  isDragOver = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.archivoSeleccionado.set(files[0]);
    }
  }

  // Archivos Adjuntos"""

content = content.replace("  // Archivos Adjuntos", methods)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
