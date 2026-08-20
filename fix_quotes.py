import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Fix quote
content = content.replace('[form]="$any(becaActual() || {})\\\'', '[form]="$any(becaActual() || {})"')

# Fix imports
content = re.sub(r'import\s*\{\s*ModalBecaComponent,[\s\S]*?\} from \'./modales/modal-beca.component\';', "import { ModalBecaComponent } from './modales/modal-beca.component';", content)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
