import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

content = content.replace("'AL_DIA'", 'EstadoCuenta.AL_DIA')
content = content.replace("'POR_VENCER'", 'EstadoCuenta.POR_VENCER')
content = content.replace("'EN_MORA'", 'EstadoCuenta.EN_MORA')
content = content.replace("'ANULADO'", 'EstadoCuenta.ANULADO')
content = content.replace("'PSE'", 'MedioPago.PSE')
content = content.replace("'APROBADO'", 'EstadoPago.APROBADO')
content = content.replace("'ACTIVO'", 'EstadoAcuerdo.ACTIVO')
content = content.replace("'PENDIENTE'", 'EstadoPago.PENDIENTE')
content = content.replace("'RECHAZADO'", 'EstadoPago.RECHAZADO')
content = content.replace("'CUMPLIDO'", 'EstadoAcuerdo.CUMPLIDO')
content = content.replace("'INCUMPLIDO'", 'EstadoAcuerdo.INCUMPLIDO')

# Also fix the initial state: `estado: EstadoCuenta.AL_DIA | EstadoCuenta.POR_VENCER` -> wait, I already removed interfaces!

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
