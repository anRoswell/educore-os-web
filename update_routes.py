import sys

with open('src/app/app.routes.ts', 'r') as f:
    content = f.read()

# Add import
import_statement = "import { AsistenciaComponent } from './pages/asistencia/asistencia.component';\n"
content = import_statement + content

# Add route
old_route = """      {
        path: 'lms',
        component: LmsComponent,
      },"""

new_route = """      {
        path: 'lms',
        component: LmsComponent,
      },
      {
        path: 'asistencia',
        component: AsistenciaComponent,
      },"""

content = content.replace(old_route, new_route)

with open('src/app/app.routes.ts', 'w') as f:
    f.write(content)

