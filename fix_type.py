with open('src/app/pages/lms/lms.component.ts', 'r') as f:
    content = f.read()
import re
content = re.sub(r'nuevaPublicacion\s*=\s*\{[^\}]*\};', "nuevaPublicacion: any = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };", content)
content = re.sub(r'this\.nuevaPublicacion\s*=\s*\{[^\}]*\};', "this.nuevaPublicacion = { titulo: '', contenido: '', url_adjunta: '', tipo: 'MATERIAL', archivoAdjuntoUrl: '', archivoAdjuntoNombre: '' };", content)
with open('src/app/pages/lms/lms.component.ts', 'w') as f:
    f.write(content)
