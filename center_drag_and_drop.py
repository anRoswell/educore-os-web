import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_label = r'<label class="form-label-modern mb-0" style="cursor: pointer; display: block;">\s*<div style="font-size: 2rem; color: #94a3b8; margin-bottom: 0\.5rem;">📎</div>\s*<strong style="color: #475569;">Arrastra y suelta un documento aquí</strong><br>\s*<span style="color: #64748b; font-size: 0\.85rem;">o haz clic para explorar \(PDF, Word, Excel\)</span>\s*</label>'

new_label = """<label class="form-label-modern mb-0" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%;">
                    <div style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.5rem;">📎</div>
                    <strong style="color: #475569; font-size: 1.1rem;">Arrastra y suelta un documento aquí</strong>
                    <span style="color: #64748b; font-size: 0.9rem; margin-top: 0.25rem;">o haz clic para explorar (PDF, Word, Excel)</span>
                  </label>"""

content = re.sub(old_label, new_label, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
