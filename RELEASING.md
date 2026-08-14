# Guía de Release y Publicación — ngx-data-visualizer

Este documento describe el protocolo para incrementar la versión, empaquetar y publicar entregables de la librería **`@uncuyoapp/ngx-data-visualizer`** y su aplicación de demostración interactiva.

---

## 🏷️ 1. Estándar de Versionado Semántico (SemVer)

La librería sigue **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):

* **`MAJOR`**: Cambios incompatibles con versiones previas (breaking changes en `Dataset`, directivas `libChart`/`libTable` o firmas de métodos de proveedores).
* **`MINOR`**: Nuevos tipos de gráficos, nuevos componentes standalone, asistentes de edición o proveedores compatibles hacia atrás.
* **`PATCH`**: Corrección de bugs visuales, arreglos en cálculos de porcentajes o exportaciones.

### Sufijos de Maduración:
* **`-alpha.X`** (ej. `0.2.0-alpha.1`): Desarrollo activo interno en rama `develop`.
* **`-beta.X`** (ej. `0.2.0-beta.1`): *Feature Complete*. Se prueba en Staging y en la aplicación frontend `quipu-2`.
* **`-rc.X`** (ej. `0.2.0-rc.1`): *Release Candidate* en rama `release/vX.Y.Z`.
* **Versión Oficial** (ej. `0.2.0` o `1.0.0`): Lista para publicación en NPM y desplegada en producción.

---

## 📦 2. Procedimiento de Empaquetado y Release

Para generar una nueva versión oficial de la librería:

### Paso 1: Preparación en Rama de Release
```bash
# Desde develop actualizado
git checkout -b release/vX.Y.Z
```

### Paso 2: Bump de Versión
Actualizar la versión en `projects/ngx-data-visualizer/package.json` y en el `package.json` raíz:
```bash
# Ejemplo para versión minor
npm version minor --no-git-tag-version --prefix projects/ngx-data-visualizer
npm version minor --no-git-tag-version
```

### Paso 3: Compilación y Validación de la Librería
```bash
# Compilar el bundle de producción
ng build ngx-data-visualizer --configuration production

# Validar linting y tests
ng lint
ng test ngx-data-visualizer --watch=false --browsers=ChromeHeadless
```

### Paso 4: Commit de Release y Merge
```bash
git add .
git commit -m "chore(release): release vX.Y.Z"

# Mergear a main
git checkout main
git merge --no-ff release/vX.Y.Z
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Sincronizar de regreso a develop
git checkout develop
git merge --no-ff release/vX.Y.Z
git branch -d release/vX.Y.Z
```

### Paso 5: Publicación en NPM (Mantenedores Oficiales)
```bash
# Desde el directorio del bundle compilado
cd dist/ngx-data-visualizer
npm publish --access public
```

### Paso 6: Despliegue de la Demo en GitHub Pages
Al mergear a `main`, el workflow de GitHub Actions compila automáticamente la aplicación demo y la despliega en:
➡️ **`https://uncuyoapp.github.io/ngx-data-visualizer/`**

---

## 🔄 3. Consumo Local en `quipu-2` durante el Desarrollo

Para probar cambios locales de la librería en el frontend `quipu-2` sin publicar en NPM:

```bash
# En el directorio app-uncuyo:
ng build ngx-data-visualizer --watch

# En otra terminal, en el directorio quipu-front-2:
npm link ../app-uncuyo/dist/ngx-data-visualizer
ng serve
```

---

## 📚 4. Documentación Centralizada

Para registrar el resumen funcional de cambios en la bóveda de documentación:
* Documentar los deltas en `30 - Libreria (ngx-data-visualizer)/04 - Historico y Entregas/`.
