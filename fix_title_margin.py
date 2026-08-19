import sys
import re

with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()

old_block = r'<div class="flex-between mb-2">\s*<strong>\{\{ post\.titulo \}\}</strong>\s*<span class="badge" \[ngClass\]="post\.tipo === \'MATERIAL\' \? \'bg-indigo\' : \'bg-success\'">\{\{ post\.tipo \}\}</span>\s*<div style="display: inline-flex; gap: 0\.5rem; margin-left: auto; padding-left: 1rem;">'

new_block = r"""<div class="mb-3" style="display: flex; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                          <strong style="font-size: 1.1rem; color: #1e293b;">{{ post.titulo }}</strong>
                          <span class="badge" [ngClass]="post.tipo === 'MATERIAL' ? 'bg-indigo' : 'bg-success'" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; margin-top: 2px;">{{ post.tipo }}</span>
                        </div>
                        <div style="display: inline-flex; gap: 0.5rem; margin-left: auto;">"""

content = re.sub(old_block, new_block, content)

with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)

