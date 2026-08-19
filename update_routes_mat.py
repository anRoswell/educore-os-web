import sys

with open('src/app/app.routes.ts', 'r') as f:
    content = f.read()

import_str = "import { FirmaMatriculaComponent } from './pages/public/firma-matricula.component';\n"
content = import_str + content

route_str = """  {
    path: 'public/firmar-matricula',
    component: FirmaMatriculaComponent,
  },
"""
content = content.replace("  {\n    path: 'login',", route_str + "  {\n    path: 'login',")

with open('src/app/app.routes.ts', 'w') as f:
    f.write(content)
