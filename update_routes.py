import sys

with open('src/app/app.routes.ts', 'r') as f:
    content = f.read()

import_str = "import { FirmaDisciplinariaComponent } from './pages/public/firma-disciplinaria.component';\n"
content = import_str + content

route_str = """  {
    path: 'public/firmar-acta',
    component: FirmaDisciplinariaComponent,
  },
"""
content = content.replace("  {\n    path: 'login',", route_str + "  {\n    path: 'login',")

with open('src/app/app.routes.ts', 'w') as f:
    f.write(content)
