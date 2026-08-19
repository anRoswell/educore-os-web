import sys

with open('src/app/core/services/auth.service.ts', 'r') as f:
    content = f.read()

# Modify loginDemo signature
content = content.replace("loginDemo(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR', colegioIndex: number = 0)", "loginDemo(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE', colegioIndex: number = 0)")

# Add ESTUDIANTE data
old_code = """    } else if (role === 'COORDINADOR') {
      nombre = 'Marta';
      apellido = 'Rojas';
      email = `coordinacion@${col.slug}.edu.co`;
    }"""
new_code = """    } else if (role === 'COORDINADOR') {
      nombre = 'Marta';
      apellido = 'Rojas';
      email = `coordinacion@${col.slug}.edu.co`;
    } else if (role === 'ESTUDIANTE') {
      nombre = 'Felipe';
      apellido = 'García';
      email = `felipe.garcia@estudiantes.${col.slug}.edu.co`;
    }"""

content = content.replace(old_code, new_code)

with open('src/app/core/services/auth.service.ts', 'w') as f:
    f.write(content)
