# EduCoreOS Web

> 📘 **Documentación General del Proyecto:** Consulte la arquitectura global, guía de SSOT y parámetros en el [README General de EduCoreOS](../README.md).
>
> 🔄 **Sincronización de Enums desde BD:** Ejecute `npm run sync:enums` para regenerar los enums tipados de catálogos sin tocar código a mano.

## Development server

Para iniciar el servidor de desarrollo local:

```bash
npm start
# O alternativamente:
ng serve --port 4201
```

Abre `http://localhost:4201/` en tu navegador.

## Compilación (Build)

Para compilar el proyecto Angular en modo producción:

```bash
npm run build
```

Esto compilará la aplicación con optimización completa en `dist/EduCoreOS-web/browser/`.

## Pruebas Unitarias y E2E

```bash
# Pruebas unitarias con Vitest
npm test

# Pruebas End-to-End exhaustivas con Playwright
npm run test:e2e
```

---

## Despliegue Automático (CI/CD en VPS)

El frontend web se empaqueta en una imagen Docker optimizada con Nginx Alpine y se publica automáticamente en GitHub Container Registry (GHCR) y en la VPS mediante GitHub Actions:

- **QA:** Todo `push` a las ramas `dev`, `develop` o `qa` compila la imagen `ghcr.io/anroswell/educoreos-web:qa-latest` y despliega en `~/educoreos-qa`.
- **Producción:** Todo `push` a las ramas `main` o `master` compila la imagen `ghcr.io/anroswell/educoreos-web:latest` y despliega en `~/educoreos-prod`.

### Configuración de Secretos en GitHub

En el repositorio `anRoswell/educore-os-web`, configure estos **Actions Secrets** (`Settings` -> `Secrets and variables` -> `Actions`):

| Secret           | Descripción                     | Valor Ejemplo                   |
| ---------------- | ------------------------------- | ------------------------------- |
| `VPS_HOST`       | IP o dominio de la VPS          | `123.45.67.89`                  |
| `VPS_USER`       | Usuario SSH con acceso a Docker | `ubuntu`                        |
| `VPS_SSH_KEY`    | Clave privada SSH completa      | `-----BEGIN OPENSSH PRIVATE KEY...` |
| `VPS_PASSPHRASE` | Frase de la clave (si aplica)   | `tu-passphrase-opcional`        |
| `VPS_PORT`       | Puerto SSH (opcional, usa `22`) | `22`                            |

### Configuración en la VPS

En la VPS, los directorios `~/educoreos-qa` y `~/educoreos-prod` contienen el archivo `docker-compose.yml` con el servicio `frontend`:

```yaml
frontend:
  image: ghcr.io/anroswell/educoreos-web:qa-latest # (o :latest en prod)
  container_name: educoreos_web_qa
  restart: always
  ports:
    - "4201:80"
  depends_on:
    - backend
  networks:
    - educoreos_qa_net
```

Cada vez que el workflow se ejecuta, se autentica vía SSH, inicia sesión en GHCR con el token del workflow, descarga la última versión del frontend (`docker compose pull frontend`) y actualiza el contenedor sin interrupciones (`docker compose up -d --remove-orphans frontend`).
