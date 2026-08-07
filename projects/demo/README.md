# 🧪 Aplicación Demo de @uncuyoapp/ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)

> **Nota:** Este proyecto es la aplicación de demostración interactiva y el entorno de pruebas para la librería `@uncuyoapp/ngx-data-visualizer`. Para consultar la documentación técnica de la API de la librería, revisa el [README de la librería](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/projects/ngx-data-visualizer/README.md) o el [README del workspace](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md).

Esta aplicación sirve como **documentación viva**, sistema de prueba interactivo y muestra de integración en proyectos Angular reales.

---

## ✨ Características del Demo

- **📚 Documentación interactiva** - Guías paso a paso con código en vivo y resaltado de sintaxis.
- **🧪 Ejemplos con componentes standalone** - Implementaciones reales de `ChartComponent`, `TableComponent` y `MultipleChartComponent`.
- **🎛️ Dashboard analítico interactivo** - Integración con selector de años, tarjetas resumen y gráficos circulares optimizados.
- **🔬 Laboratorios de pruebas (Testing & Size Labs)**:
  - **Pruebas de Combinaciones (1D a 5D)**: Banco de pruebas para validar configuraciones con distintas dimensiones de datos y casos especiales como `DA = 0` (Tarjeta KPI).
  - **Laboratorio de Tamaños y Responsividad**: Validación de las 4 modalidades de dimensionamiento (TypeScript, Contenedores Flexibles, Variables CSS Inline y SCSS Externo).
- **🎛️ Panel de Edición en Vivo** - Integración directa con los Overlays CDK flotantes y asistentes por pasos de la librería.
- **📱 Diseño responsivo avanzado** - Layout moderno adaptado a escritorio y dispositivos móviles.
- **⚡ Angular 18 Standalone** - Código moderno y reactivo basado en Signals y estrategia `OnPush`.

---

## 📁 Estructura del Proyecto Demo

El código fuente en `projects/demo/src/app/` está organizado por rutas independientes:

```
projects/demo/src/app/
├── configuration/     # 📚 Guía de configuración y setup paso a paso
├── chart-demo/        # 📊 Ejemplos interactivos de ChartComponent (<libChart>)
├── table-demo/        # 📋 Ejemplos interactivos de TableComponent (<libTable>)
├── multichart-demo/   # 📈 Ejemplos interactivos de MultipleChartComponent (<libMultipleChart>)
├── dashboard/         # 🎛️ Dashboard analítico completo con selector de año y KPIs
├── full-example/      # 🔧 Integración completa de visualizaciones y filtros
├── chart-cases-test/  # 🧪 Suite de pruebas para gráficos (combinaciones 1D-5D y DA=0)
├── chart-sizes-test/  # 📏 Laboratorio de tamaños y responsividad para gráficos
├── table-cases-test/  # 🧪 Suite de pruebas para tablas dinámicas
├── table-sizes-test/  # 📏 Laboratorio de tamaños para tablas
├── home/              # 🏠 Página principal de bienvenida y navegación
├── app.component.ts   # Componente raíz de la aplicación demo
├── app.config.ts      # ⭐ Inyección de proveedores de la librería (provideDataVisualizerCharts/Tables)
└── app.routes.ts      # Configuración de rutas de Angular Router
```

---

## 🚀 Ejecución Local

Para ejecutar la aplicación demo en tu entorno local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
cd ngx-data-visualizer

# 2. Instalar dependencias del workspace
npm install

# 3. Compilar la librería (requerido previamente para resolver los imports del paquete)
ng build ngx-data-visualizer

# 4. Iniciar el servidor de desarrollo del demo
ng serve demo
```

Accede a la aplicación en **http://localhost:4200**.

---

## 🧩 Secciones y Rutas Disponibles

Una vez iniciada la aplicación, podrás navegar por las siguientes secciones:

1. **🏠 Inicio (`/`)**: Presentación general del workspace y accesos rápidos.
2. **📚 Guía de Configuración (`/configuration`)**: Instrucciones paso a paso para instalar proveedores e importar estilos globales.
3. **📊 Gráficos (`/chart-demo`)**: Demostración interactiva de `ChartComponent` con prueba del editor flotante y exportación de imágenes.
4. **📋 Tablas (`/table-demo`)**: Demostración interactiva de `TableComponent` con cambio de modos de valor (nominal, porcentajes por fila/columna/total) y exportación a Excel/HTML.
5. **📈 Múltiples Gráficos (`/multichart-demo`)**: Desglose automático de gráficos por dimensión mediante `MultipleChartComponent`.
6. **🎛️ Dashboard (`/dashboard`)**: Caso de uso real con selector de año, tarjetas resumen, gráficos circulares y grillas combinadas.
7. **🔧 Ejemplo Completo (`/full-example`)**: Integración completa con sincronización entre tabla y gráfico.
8. **🧪 Laboratorio de Pruebas**:
   - **Casos de Gráficos (`/chart-cases-test`)**: Validación de comportamientos con 0 a 5 dimensiones y visualización KPI.
   - **Tamaños de Gráficos (`/chart-sizes-test`)**: Pruebas de responsividad CSS, contenedores flex, variables CSS y tamaño por TypeScript.
   - **Casos de Tablas (`/table-cases-test`)**: Suite de pruebas para configuraciones de tablas.
   - **Tamaños de Tablas (`/table-sizes-test`)**: Pruebas de dimensionamiento de tablas.

---

## 🛠️ Comandos Útiles

```bash
# Servidor de desarrollo con apertura de navegador
ng serve demo --open

# Compilación de producción para demo
ng build demo

# Verificación de calidad de código con ESLint
ng lint demo
```

---

## 🐛 Diagnóstico y Resolución de Problemas

### "El demo muestra errores de importación de @uncuyoapp/ngx-data-visualizer"

Este error ocurre cuando la librería no se ha construido previamente en el directorio `dist/`.

**Solución**:
```bash
ng build ngx-data-visualizer
ng serve demo
```

### Reinstalación limpia en caso de problemas con depes node_modules

```bash
rm -rf node_modules package-lock.json dist
npm install
ng build ngx-data-visualizer
ng serve demo
```

---

## 📄 Licencia

MIT License. Ver [LICENSE](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/LICENSE) para más detalles.

---

<div align="center">

**🧪 Demo desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**

[🌐 Website](https://www.uncuyo.edu.ar/politicaspublicas/) • [GitHub](https://github.com/uncuyoapp/ngx-data-visualizer) • [🧪 Demo Online](https://uncuyoapp.github.io/ngx-data-visualizer/)

</div>
