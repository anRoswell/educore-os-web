import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

signals = """  readonly isSaving = signal(false);

  // Edit Mode & Confirm Modals
  editandoAulaId = signal<string | null>(null);
  editandoPublicacionId = signal<string | null>(null);
  showConfirmModal = signal(false);
  confirmModalConfig = signal({ title: '', message: '', confirmText: 'Confirmar', onConfirm: () => {} });"""

content = re.sub(r'  readonly isSaving = signal\(false\);', signals, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
