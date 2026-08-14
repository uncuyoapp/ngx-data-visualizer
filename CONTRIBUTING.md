# Guía de Contribución — ngx-data-visualizer

Gracias por contribuir a **`@uncuyoapp/ngx-data-visualizer`**. Este documento describe las directrices para colaborar de forma ordenada en la librería y en la aplicación demo interactiva.

---

## 🏛️ 1. Estructura del Workspace

Este repositorio es un workspace de **Angular 18+** que contiene dos proyectos:

* **`projects/ngx-data-visualizer`**: Librería standalone empaquetable para NPM (`@uncuyoapp/ngx-data-visualizer`).
* **`projects/demo`**: Aplicación de demostración, testing interactivo y documentación viva desplegada en GitHub Pages.

---

## 🌿 2. Estrategia de Ramas (Gitflow)

El proyecto utiliza **Gitflow** adaptado a lanzamientos continuos y empaquetado NPM:

### Ramas Permanentes
* **`main`**: Código estable, listo para producción y publicación a NPM. Cada merge dispara el despliegue automático de la demo a GitHub Pages y requiere un Git Tag semántico (`vX.Y.Z`).
* **`develop`**: Rama de integración continua. Base para nuevas funcionalidades y correcciones (`-alpha` / pre-release).

### Ramas Temporales
* **`feature/<nombre>`**: Nueva funcionalidad (ej. `feature/tooltip-multicolumna`, `feature/editor-kpi`). Nace y se integra a `develop`.
* **`fix/<nombre>`**: Corrección de bugs (ej. `fix/inversion-ejes-barras`, `fix/nan-fracciones`). Nace y se integra a `develop`.
* **`refactor/<nombre>`**: Mejoras técnicas internas sin cambio de comportamiento externo. Nace y se integra a `develop`.
* **`release/vX.Y.Z`**: Rama de estabilización para empaquetado, bump de versión y pruebas finales antes de mergear a `main` y sincronizar `develop`.
* **`hotfix/<nombre>`**: Corrección crítica urgente sobre `main`.

> [!CAUTION]
> **Nunca** hagas push directo a `main` ni a `develop`. Todo código debe integrarse mediante Pull Request revisado y aprobado.

---

## 📝 3. Convención de Commits (Conventional Commits)

Formato obligatorio:
$$\texttt{<tipo>(<alcance>): <descripción concisa en minúscula>}$$

### Tipos:
* `feat`: Nueva funcionalidad o componente en la librería o demo.
* `fix`: Corrección de un fallo o error visual/lógico.
* `docs`: Cambios en la documentación (`README.md`, comentarios JSDoc).
* `style`: Formato de código, indentación (sin cambios en la lógica).
* `refactor`: Reorganización de código sin añadir funcionalidades ni corregir bugs.
* `perf`: Optimizaciones de rendimiento (renderizado, loops de cálculo).
* `test`: Adición o modificación de pruebas unitarias o BDD.
* `chore`: Actualización de dependencias, scripts de build o configuración del workspace.

### Alcances (Scopes) de la Librería:
* `(chart)`: Motor gráfico ECharts, directiva `libChart`, series, ejes y leyendas.
* `(table)`: Motor de tablas dinámicas PivotTable.js, directiva `libTable`, agregadores.
* `(tooltip)`: Formateo, plantillas multicolumna y cálculo de totales en tooltips.
* `(kpi)`: Tarjeta KPI interactiva autónoma (`DA = 0`).
* `(editor)`: Asistente por pasos y panel de personalización flotante (CDK Overlays).
* `(export)`: Servicios de exportación (Excel XLSX, imágenes PNG/JPG/SVG).
* `(core)`: Clases base (`Dataset`, `ChartOptions`, `TableOptions`), bus de eventos, utilidades.
* `(demo)`: Aplicación interactiva de demostración y playground.

---

## 🛠️ 4. Flujo de Desarrollo Local

### Comandos Principales:
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar la aplicación demo local
ng serve demo

# 3. Compilar la librería (genera dist/ngx-data-visualizer)
ng build ngx-data-visualizer

# 4. Ejecutar el linter
ng lint

# 5. Ejecutar pruebas unitarias
ng test ngx-data-visualizer
```

---

## 📏 5. Estándares y Buenas Prácticas de Código

* **Angular 18+ Standalone**: Todos los componentes, directivas y pipes deben ser `standalone: true`.
* **Inyección de Dependencias Moderna**: Utilizar la función `inject()` en lugar de constructores para servicios.
* **Reactividad Eficiente**: Usar Angular Signals y estrategia `ChangeDetectionStrategy.OnPush`.
* **Tipado Estricto**: Definir interfaces claras para todas las estructuras de datos. Prohibido el uso de `any`.
* **Estilos y Design Tokens**: Usar propiedades CSS personalizadas (`--viz-*`) para permitir tematización y modo oscuro.
* **Inmutabilidad**: Tratar las opciones y datos de entrada como inmutables para garantizar detección de cambios óptima.

