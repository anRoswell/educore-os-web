with open('src/app/pages/lms/lms-cuestionario-toma/lms-cuestionario-toma.spec.ts', 'r') as f:
    text = f.read()

text = text.replace("LmsCuestionarioTomaComponentComponent", "LmsCuestionarioTomaComponent")
text = text.replace("import { describe, it, expect, beforeEach } from 'vitest';\n\nimport { LmsCuestionarioTomaComponent } from", "import { describe, it, expect, beforeEach } from 'vitest';\nimport { LmsCuestionarioTomaComponent } from")

with open('src/app/pages/lms/lms-cuestionario-toma/lms-cuestionario-toma.spec.ts', 'w') as f:
    f.write(text)
