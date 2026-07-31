# 📊 ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Este proyecto ha sido desarrollado por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Consiste en un workspace de Angular que incluye:

- **`@uncuyoapp/ngx-data-visualizer`**: una librería open-source moderna diseñada para facilitar la visualización de datos en proyectos Angular mediante componentes `standalone`, accesibles, reactivos y altamente personalizables.
- **`demo`**: una aplicación interactiva de ejemplo y sistema de documentación que muestra cómo integrar y utilizar la librería en proyectos Angular reales.

---

## ✨ Características principales

- **🚀 Arquitectura 100% Standalone** - Totalmente compatible con Angular 18+ sin necesidad de NgModules.
- **⚙️ Proveedores Configurables** - Inyección modular bajo demanda con `provideDataVisualizerCharts` y `provideDataVisualizerTables`.
- **📊 Motor de Visualizaciones Potente** - Integración limpia y optimizada con ECharts y PivotTable.js.
- **🎛️ Panel de Edición con Overlays CDK y Asistentes por Pasos** - Editor flotante e interactivo re-arquitecturado sobre Angular CDK Overlays con wizard por pasos.
- **📈 Tarjeta KPI Autónoma (`DA = 0`)** - Renderizado automático de tarjeta resumen interactiva cuando no hay dimensiones activas seleccionadas.
- **💡 Tooltip Adaptativo Multicolumna** - Tooltip compartido dinámico con maquetación en múltiples columnas (`columnThreshold`, `maxColumns`), toggle de porcentaje (`showPercentage`), fila de total y agregados para gráficos de torta.
- **📡 Bus de Eventos y Auditoría en Tiempo Real** - `EventBusService` para transmisión de eventos del ciclo de vida y `AuditService` para depuración mediante DI, LocalStorage o URL params.
- **🎨 Design Tokens (Variables CSS)** - Control de estilos completo mediante CSS Custom Properties (`--viz-*`) con soporte nativo para Modo Oscuro.
- **🎨 Componentes Standalone de Íconos SVG** - Componentes de íconos SVG desacoplados (`libIconClose`, `libIconReset`, `libIconCheck`, `libIconExport`).
- **📤 Exportación Avanzada** - Soporte nativo para descarga en imágenes (PNG, JPG), hojas Excel (XLSX) y HTML.

---

## 🚀 Instalación rápida

```bash
npm install @uncuyoapp/ngx-data-visualizer echarts ngx-echarts pivottable jquery
```

---

## ⚙️ Configuración básica

### 1. Registra los proveedores en `app.config.ts`

```ts
import { ApplicationConfig } from '@angular/core';
import { 
  provideDataVisualizerCharts, 
  provideDataVisualizerTables 
} from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Registra proveedores para gráficos
    provideDataVisualizerCharts({
      defaultHeight: 400,
      debug: false
    }),
    // Registra proveedores para tablas dinámicas
    provideDataVisualizerTables({
      debug: false
    })
  ]
};
```

### 2. Importa los estilos globales en `src/styles.scss`

```scss
@import '@uncuyoapp/ngx-data-visualizer/styles';
```

### 3. Utiliza los componentes standalone en tus plantillas

```ts
import { Component } from '@angular/core';
import { 
  ChartComponent, 
  TableComponent,
  Dataset, 
  ChartOptions, 
  TableOptions 
} from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [ChartComponent, TableComponent],
  template: `
    <!-- Gráfico -->
    <libChart 
      [dataset]="dataset" 
      [(chartOptions)]="chartOptions"
      [(showEditor)]="showEditor">
    </libChart>
    
    <!-- Tabla -->
    <libTable 
      [dataset]="dataset" 
      [(tableOptions)]="tableOptions"
      [(showEditor)]="showEditor">
    </libTable>
  `
})
export class MiComponente {
  showEditor = false;

  dataset = new Dataset({
    dimensions: [
      {
        id: 1,
        name: 'categoria',
        nameView: 'Categoría',
        items: [
          { id: 1, name: 'A', selected: true },
          { id: 2, name: 'B', selected: true }
        ]
      }
    ],
    rowData: [
      { categoria: 'A', valor: 100 },
      { categoria: 'B', valor: 200 }
    ]
  });
  
  chartOptions: ChartOptions = {
    type: 'bar',
    stacked: null,
    xAxis: { title: '', rotateLabels: null, firstLevel: 1, secondLevel: null },
    yAxis: { title: 'Valores', max: null },
    tooltip: { shared: true, decimals: 0, suffix: null, format: null, showTotal: true },
    legends: { enabled: true, show: true, position: 'top' },
    navigator: { show: false, start: null, end: null },
    width: null,
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: '',
    isPreview: false,
    disableAutoUpdate: false
  };
  
  tableOptions: TableOptions = {
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
    cols: [1],
    rows: [],
    valueDisplay: 'nominal'
  };
}
```

---

## 🧩 Tecnologías y librerías utilizadas

Este proyecto está desarrollado en **Angular 18** e integra múltiples librerías de visualización y manipulación de datos. La librería `@uncuyoapp/ngx-data-visualizer` funciona como una solución integrada que simplifica el uso combinado de las siguientes dependencias clave:

### Dependencias principales
- [Angular 18+](https://angular.io/) — Framework base con APIs standalone y Signals
- [Angular CDK Overlays](https://material.angular.io/cdk/overlay/overview) — Infraestructura para el panel de edición flotante desacoplado
- [ECharts](https://echarts.apache.org/) y [ngx-echarts](https://github.com/xieziyu/ngx-echarts) — Motor de gráficos interactivos
- [PivotTable.js](https://pivottable.js.org/) — Análisis dinámico de datos tabulados
- [XLSX](https://github.com/SheetJS/sheetjs) — Exportación e importación de hojas de cálculo
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) — Descarga de archivos en el navegador

### Dependencias de utilidad
- [lodash.clonedeep](https://lodash.com/docs/4.17.15#cloneDeep) y [lodash.uniqby](https://lodash.com/docs/4.17.15#uniqBy) — Manipulación inmutable de datos
- [jQuery](https://jquery.com/) — Requerido por PivotTable.js
- [RxJS](https://rxjs.dev/) — Bus de eventos y reactividad

---

## 📁 Estructura del Proyecto

```
ngx-data-visualizer-workspace/
├── projects/
│   ├── ngx-data-visualizer/    # 📦 Librería principal
│   │   ├── src/lib/
│   │   │   ├── chart/          # Componente de gráficos y motor ECharts
│   │   │   ├── table/          # Componente de tablas dinámicas
│   │   │   ├── multiple-chart/ # Componente de gráficos múltiples
│   │   │   ├── config-editor/  # Overlays CDK y asistentes por pasos
│   │   │   ├── services/       # Dataset, EventBusService y AuditService
│   │   │   ├── icons/          # Componentes de íconos SVG standalone
│   │   │   ├── legend/         # Componente de leyenda
│   │   │   ├── providers.ts    # Proveedores de inyección de dependencias
│   │   │   └── public-api.ts   # Superficie pública exportada
│   │   └── README.md           # 📚 Documentación técnica de la librería
│   └── demo/                   # 🧪 Aplicación de demostración y laboratorio
│       ├── src/app/
│       │   ├── configuration/  # Guía de configuración
│       │   ├── chart-demo/     # Ejemplos de gráficos
│       │   ├── table-demo/     # Ejemplos de tablas
│       │   ├── dashboard/      # Dashboard completo interactivo
│       │   └── test-suite/     # Suite de pruebas de combinación
│       └── README.md
├── dist/                       # Artefactos compilados
├── package.json               # Configuración del workspace
└── README.md                  # Este archivo
```

---

## 🧩 Componentes Principales

### 📦 `@uncuyoapp/ngx-data-visualizer` - Librería Principal

La librería proporciona un conjunto de componentes `standalone` y servicios para visualización de datos:

- **Componentes Standalone**:
  - `ChartComponent` (`<libChart>`) - Gráficos individuales con soporte KPI para `DA = 0`
  - `TableComponent` (`<libTable>`) - Tablas dinámicas bidimensionales
  - `MultipleChartComponent` (`<libMultipleChart>`) - Desglose de gráficos múltiples

- **Clases y Servicios**:
  - `Dataset` - Modelo de datos reactivo
  - `EventBusService` - Bus centralizado de eventos del ciclo de vida
  - `AuditService` - Servicio de depuración y auditoría en consola
  - `ChartOptions`, `TableOptions`, `Dimension`, `RowData`, `Series`, `Goal` - Interfaces de datos tipadas

- **Proveedores DI**:
  - `provideDataVisualizerCharts(config?)` - Inyección de configuración de gráficos
  - `provideDataVisualizerTables(config?)` - Inyección de servicios de tablas

👉 **Documentación técnica detallada**: [README de la librería](projects/ngx-data-visualizer/README.md)

### 🧪 Proyecto Demo - Documentación Interactiva

Aplicación Angular completa que sirve como documentación viva, laboratorio de pruebas y ejemplos de integración:

- **Guía de configuración** - Setup paso a paso
- **Ejemplos interactivos** - Pruebas en tiempo real de cada componente
- **Laboratorio de responsividad** - Pruebas de dimensión y escalado
- **Dashboard real** - Ejemplo completo de integración

👉 **Ver ejemplos**: [README del demo](projects/demo/README.md) o visita la [**Demo Online**](https://uncuyoapp.github.io/ngx-data-visualizer/).

---

## ⚙️ Requisitos del Sistema

- **Node.js** >= 18.13.0
- **npm** >= 8.19.0
- **Angular CLI** >= 18.0.0
- **Angular** >= 18.0.0

---

## 🚀 Desarrollo Local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
cd ngx-data-visualizer
npm install
```

### 2. Comandos principales

```bash
# 🧪 Ejecutar la aplicación demo
ng serve demo

# 📦 Construir la librería
ng build ngx-data-visualizer

# 🧪 Construir la demo
ng build demo

# 🔍 Ejecutar linter
ng lint
```

---

## 📋 Roadmap

- [x] Componentes standalone para gráficos, tablas y gráficos múltiples
- [x] Panel de edición con Angular CDK Overlays y Asistente por pasos
- [x] Renderizado de tarjeta KPI para 0 dimensiones seleccionadas (`DA = 0`)
- [x] Tooltip adaptativo multicolumna con totals y porcentajes
- [x] Bus de eventos reactivo (`EventBusService`) y auditoría en consola (`AuditService`)
- [x] Tokens de diseño CSS (`--viz-*`) con soporte para Modo Oscuro
- [x] Íconos SVG standalone

---

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

---

<div align="center">

**Desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**

[🌐 Website](https://www.uncuyo.edu.ar/politicaspublicas/) • [GitHub](https://github.com/uncuyoapp/ngx-data-visualizer) • [📊 NPM](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer) • [🧪 Demo](https://uncuyoapp.github.io/ngx-data-visualizer/)

</div>