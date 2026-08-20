import re

with open('src/app/pages/documental/documental.component.spec.ts', 'r') as f:
    doc = f.read()

doc = doc.replace("import { DocumentalComponent } from './documental.component';", "import { DocumentalComponent, VistaDocumental, TipoFirmaTab } from './documental.component';")
doc = doc.replace(".toBe('KANBAN')", ".toBe(VistaDocumental.KANBAN)")
doc = doc.replace(".set('FIRMAS_VAULT')", ".set(VistaDocumental.FIRMAS_VAULT)")
doc = doc.replace(".set('IMAGEN')", ".set(TipoFirmaTab.IMAGEN)")
doc = doc.replace(".toBe('TRAZO')", ".toBe(TipoFirmaTab.TRAZO)")
doc = doc.replace(".toBe('IMAGEN')", ".toBe(TipoFirmaTab.IMAGEN)")
doc = doc.replace(".set('TRD')", ".set(VistaDocumental.TRD)")

with open('src/app/pages/documental/documental.component.spec.ts', 'w') as f:
    f.write(doc)

with open('src/app/pages/lms/lms-cuestionario-creador/lms-cuestionario-creador.spec.ts', 'r') as f:
    lms = f.read()
lms = lms.replace("import { LmsCuestionarioCreador }", "import { LmsCuestionarioCreadorComponent }")
lms = lms.replace("LmsCuestionarioCreador", "LmsCuestionarioCreadorComponent")
with open('src/app/pages/lms/lms-cuestionario-creador/lms-cuestionario-creador.spec.ts', 'w') as f:
    f.write(lms)

with open('src/app/pages/lms/lms-cuestionario-toma/lms-cuestionario-toma.spec.ts', 'r') as f:
    lmst = f.read()
lmst = lmst.replace("import { LmsCuestionarioToma }", "import { LmsCuestionarioTomaComponent }")
lmst = lmst.replace("LmsCuestionarioToma", "LmsCuestionarioTomaComponent")
with open('src/app/pages/lms/lms-cuestionario-toma/lms-cuestionario-toma.spec.ts', 'w') as f:
    f.write(lmst)

