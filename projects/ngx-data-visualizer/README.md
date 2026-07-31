# @uncuyoapp/ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Nota:** Esta es la documentación técnica oficial de la librería `@uncuyoapp/ngx-data-visualizer`. Para guías de integración y la suite interactiva de ejemplos, consulta la [demo interactiva](https://uncuyoapp.github.io/ngx-data-visualizer/) o el [README principal del workspace](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md).

`@uncuyoapp/ngx-data-visualizer` es una librería de código abierto desarrollada por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Su objetivo es simplificar la creación de visualizaciones de datos en aplicaciones Angular mediante un conjunto de componentes `standalone`, accesibles, reactivos y desacoplados del DOM.

---

## ✨ Características principales

- **🚀 Arquitectura 100% Standalone** - Diseñada para Angular 18+ sin necesidad de NgModules.
- **⚙️ Inyección Modular de Proveedores** - Inclusión bajo demanda con `provideDataVisualizerCharts` y `provideDataVisualizerTables`.
- **📊 Motor de Visualizaciones Potente** - Integración transparente y optimizada con ECharts y PivotTable.js.
- **🎛️ Panel de Edición con Overlays CDK y Asistentes por Pasos** - Editor flotante e interactivo re-arquitecturado sobre Angular CDK Overlays con wizard interactivo por pasos.
- **📈 Tarjeta KPI Autónoma para 0 Dimensiones (`DA = 0`)** - Renderizado automático de tarjeta resumen interactiva cuando no hay dimensiones activas.
- **💡 Tooltip Adaptativo Multicolumna** - Tooltip compartido dinámico con maquetación en múltiples columnas (`columnThreshold`, `maxColumns`), toggle de porcentaje (`showPercentage`), fila de total y métricas de torta agregadas.
- **✂️ Truncamiento Nativo y Optimización de Ejes** - Truncamiento dinámico en ECharts para títulos y etiquetas de ejes (`xAxis.rotateLabels`, `xAxis.disableAutoTitle`).
- **🎯 Series de Referencia y Líneas de Meta** - Soporte nativo para clasificar series de referencia (`isReferenceSeries`) e integrar metas globales (`Goal`).
- **📡 Bus de Eventos y Auditoría en Tiempo Real** - `EventBusService` para transmisión reactiva de eventos del ciclo de vida y `AuditService` para depuración mediante DI, LocalStorage o URL params.
- **🎨 Sistema de Design Tokens (Variables CSS)** - Control visual total mediante CSS Custom Properties (`--viz-*`) con soporte nativo para Modo Oscuro.
- **🎨 Componentes Standalone de Íconos SVG** - Componentes de íconos SVG reutilizables y desacoplados (`libIconClose`, `libIconReset`, `libIconCheck`, `libIconExport`).
- **📤 Exportación Multiformato** - Exportación nativa a imágenes (PNG, JPG), hojas de cálculo Excel (XLSX) y marcado HTML.

---

## 📁 Estructura de la Librería

La estructura del código fuente dentro de `projects/ngx-data-visualizer/src/lib` se organiza de manera modular y desacoplada:

```
projects/ngx-data-visualizer/src/lib/
├── chart/               # Componente principal (ChartComponent) y motor ECharts
│   ├── echart/          # Lienzo nativo, variables CSS y truncamiento
│   └── services/        # LayoutManager, TooltipManager, EchartsFactoryService
├── table/               # Componente principal (TableComponent) y tablas dinámicas
│   ├── services/        # Lógica de temas (ThemeService) y exportaciones
│   └── utils/           # Servicios de integración con jQuery y PivotTable.js
├── multiple-chart/      # Componente orquestador declarativo (MultipleChartComponent)
├── config-editor/       # Overlays CDK y asistentes por pasos (ConfigEditorOverlayService)
├── services/            # Servicios transversales
│   ├── dataset.ts       # Modelo de datos reactivo (Dataset)
│   ├── event-bus.service.ts # Bus de eventos reactivo
│   └── audit.service.ts # Servicio de auditoría y depuración en consola
├── providers.ts         # Funciones de configuración y proveedores DI
├── icons/               # Componentes standalone de íconos SVG
├── legend/              # Componentes de leyenda para gráficos
└── types/               # Tipos de datos TypeScript (data.types, visualizer-event.types)
```

---

## 🚀 Instalación y Configuración de Proveedores

### 1. Instalación de la librería y dependencias peer

```bash
npm install @uncuyoapp/ngx-data-visualizer echarts ngx-echarts pivottable jquery
```

### 2. Registro de Proveedores en la Aplicación

Registra los proveedores necesarios en `app.config.ts` (o en la configuración del nivel deseado):

```ts
import { ApplicationConfig } from "@angular/core";
import { provideDataVisualizerCharts, provideDataVisualizerTables } from "@uncuyoapp/ngx-data-visualizer";

export const appConfig: ApplicationConfig = {
  providers: [
    // Registra los proveedores de gráficos con configuración global opcional
    provideDataVisualizerCharts({
      defaultColors: ["#0450ff", "#00b894", "#fdcb6e", "#e17055", "#d63031"],
      defaultHeight: 400,
      defaultWidth: "100%",
      debug: false, // Activa la auditoría de gráficos en consola ([Chart]*)
    }),

    // Registra los proveedores necesarios para las tablas dinámicas
    provideDataVisualizerTables({
      debug: false, // Activa la auditoría de tablas en consola ([Table]*)
    }),
  ],
};
```

---

## 📖 Uso en Componentes (Standalone)

Importa los componentes standalone directamente en los metadatos de tus componentes Angular:

```ts
import { Component } from "@angular/core";
import { ChartComponent, TableComponent, MultipleChartComponent, Dataset, ChartOptions, TableOptions, Dimension, RowData } from "@uncuyoapp/ngx-data-visualizer";

@Component({
  selector: "app-mi-visualizacion",
  standalone: true,
  imports: [
    ChartComponent, // Selector <libChart> o [libChart]
    TableComponent, // Selector <libTable> o [libTable]
    MultipleChartComponent, // Selector <libMultipleChart>
  ],
  template: `
    <!-- Gráfico Individual -->
    <libChart [dataset]="dataset" [(chartOptions)]="chartOptions" [(showEditor)]="showEditor"> </libChart>

    <!-- Tabla Dinámica -->
    <libTable [dataset]="dataset" [(tableOptions)]="tableOptions" [(showEditor)]="showEditor"> </libTable>
  `,
})
export class MiVisualizacionComponent {
  showEditor = false;

  dimensions: Dimension[] = [
    {
      id: 1,
      name: "region",
      nameView: "Región",
      items: [
        { id: 1, name: "Norte", selected: true },
        { id: 2, name: "Sur", selected: true },
      ],
    },
  ];

  rowData: RowData[] = [
    { region: "Norte", valor: 1500 },
    { region: "Sur", valor: 1200 },
  ];

  dataset = new Dataset({
    dimensions: this.dimensions,
    rowData: this.rowData,
    enableRollUp: true,
  });

  chartOptions: ChartOptions = {
    type: "bar",
    stacked: null,
    xAxis: { title: "", rotateLabels: null, firstLevel: 1, secondLevel: null },
    yAxis: { title: "Ventas", max: null },
    tooltip: {
      shared: true,
      decimals: 2,
      suffix: " U",
      format: null,
      showTotal: true,
      showPercentage: false,
      columnThreshold: 8,
      maxColumns: 3,
    },
    legends: { enabled: true, show: true, position: "top" },
    navigator: { show: false, start: null, end: null },
    width: null, // Responsivo 100%
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "U",
    isPreview: false,
    disableAutoUpdate: false,
  };

  tableOptions: TableOptions = {
    digitsAfterDecimal: 2,
    sorters: [],
    totalRow: true,
    totalCol: true,
    cols: [1],
    rows: [],
    valueDisplay: "nominal",
  };
}
```

> 💡 **Nota de Retrocompatibilidad:** Los aliases heredados `ChartDirective`, `TableDirective` y `MultipleChartDirective` se mantienen disponibles en la API pública para no romper proyectos existentes.

---

## 🧩 API Detallada de Componentes

### 📊 ChartComponent (`libChart`, `[libChart]`)

Encapsula el lienzo de visualización de gráficos interactivos, la tarjeta KPI para casos especiales y el panel lateral de edición.

#### Inputs

| Propiedad      | Tipo           | Por defecto   | Descripción                                                                                                            |
| -------------- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `dataset`      | `Dataset`      | **Requerido** | Instancia del modelo de datos reactivo (`input.required`).                                                             |
| `chartOptions` | `ChartOptions` | **Requerido** | Configuración estructural y estética del gráfico (`input.required`).                                                   |
| `showEditor`   | `boolean`      | `false`       | Controla la apertura y cierre del panel flotante de edición (`model<boolean>`). Enlace bidireccional `[(showEditor)]`. |
| `showLegends`  | `boolean`      | `true`        | Controla la visibilidad de las leyendas nativas en el gráfico (`input<boolean>`).                                      |

#### Outputs

| Evento               | Tipo           | Descripción                                                                                               |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `chartOptionsChange` | `ChartOptions` | Se emite cuando cambia la configuración del gráfico, habilitando enlace bidireccional `[(chartOptions)]`. |
| `seriesChange`       | `Series[]`     | Se emite cuando se recalculan las series de datos del gráfico.                                            |
| `showEditorChange`   | `boolean`      | Se emite al alternar el estado del panel flotante de edición (soportado por `model`).                     |

#### Métodos Públicos (`@ViewChild`)

```ts
@ViewChild(ChartComponent) chartComponent!: ChartComponent;

// Redimensiona manualmente el gráfico (por ejemplo, al alternar paneles de layout)
this.chartComponent.resize();

// Alterna de forma programática el modo porcentual (0-100%)
this.chartComponent.toPercentage();

// Descarga el lienzo actual como imagen
this.chartComponent.export('png'); // 'png' | 'jpg'

// Muestra u oculta de forma dinámica una línea de meta u objetivo
this.chartComponent.toggleShowGoal(goalConfig);
```

#### 💡 Comportamiento de Tarjeta KPI para `DA = 0`

Cuando se desmarcan todos los ítems de las dimensiones o no hay dimensiones activas seleccionadas (`DA = 0`), `ChartComponent` conmuta automáticamente a un modo **Tarjeta KPI**. En este modo se muestra un valor agregado destacado, con su unidad de medida y un estado neutro elegante sin colapsar el lienzo de ECharts.

---

### 📋 TableComponent (`libTable`, `[libTable]`)

Renderiza tablas dinámicas bidimensionales interactivas basadas en PivotTable.js.

#### Inputs

| Propiedad      | Tipo           | Por defecto   | Descripción                                                                                                   |
| -------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `dataset`      | `Dataset`      | **Requerido** | Instancia del conjunto de datos (`input.required`).                                                           |
| `tableOptions` | `TableOptions` | **Requerido** | Opciones de configuración de filas, columnas y totales (`input.required`).                                    |
| `showEditor`   | `boolean`      | `false`       | Controla la apertura y cierre del panel de edición (`model<boolean>`). Enlace bidireccional `[(showEditor)]`. |

#### Outputs

| Evento               | Tipo           | Descripción                                                                                            |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `tableOptionsChange` | `TableOptions` | Se emite al cambiar la configuración de la tabla, habilitando enlace bidireccional `[(tableOptions)]`. |
| `showEditorChange`   | `boolean`      | Se emite al alternar el estado del panel de edición (soportado por `model`).                           |

#### Métodos Públicos (`@ViewChild`)

```ts
@ViewChild(TableComponent) tableComponent!: TableComponent;

// Cambia la modalidad de presentación de valores en las celdas
this.tableComponent.setValueDisplay('percentOfTotal');
// Opciones: 'nominal' | 'percentOfTotal' | 'percentOfRow' | 'percentOfColumn'

// Exporta la tabla activa a Excel o HTML
this.tableComponent.export('xlsx', 'reporte-ventas'); // Descarga .xlsx
const htmlContent = this.tableComponent.export('html'); // Retorna string con marcado HTML
```

---

### 🔀 MultipleChartComponent (`libMultipleChart`, `[libMultipleChart]`)

Componente declarativo para desglose multivariado. Divide el conjunto de datos en una rejilla de gráficos independientes según una dimensión dada.

#### Inputs

| Propiedad           | Tipo           | Por defecto   | Descripción                                                                   |
| ------------------- | -------------- | ------------- | ----------------------------------------------------------------------------- |
| `dataset`           | `Dataset`      | **Requerido** | Conjunto de datos base (`input.required`).                                    |
| `options`           | `ChartOptions` | **Requerido** | Opciones de configuración compartidas por los gráficos (`input.required`).    |
| `splitDimension`    | `Dimension`    | **Requerido** | Dimensión por la cual se desagrega la grilla (`input.required`).              |
| `disableAutoUpdate` | `boolean`      | `false`       | Permite deshabilitar la actualización automática de datos (`input<boolean>`). |

---

## 🎛️ Panel de Edición y Asistentes por Pasos (`ConfigEditorOverlayService`)

La arquitectura del panel de edición de gráficos y tablas fue completamente re-diseñada sobre **Angular CDK Overlays** mediante el servicio `ConfigEditorOverlayService`.

### Características clave del editor:

- **Asistente interactivo por pasos (Step Wizard)**: Guía al usuario de manera intuitiva a través de la selección de tipos de gráfico, asignación de ejes, formateo de tooltips y personalización de leyendas.
- **Gestión reactiva de memoria**: Utiliza la API `takeUntilDestroyed` de Angular para prevenir fugas de memoria en suscripciones del editor.
- **Aislamiento visual**: Se despliega en una capa overlay flotante desacoplada con backdrop difuminado que respeta los eventos de ratón en el lienzo subyacente.

---

## 📐 Tipos de Datos y Configuraciones Completa

### `ChartOptions`

```ts
export interface ChartOptions {
  /** Tipo de gráfico principal */
  type: "column" | "line" | "pie" | "bar" | "area" | "spline" | "areaspline";
  /** Título principal del gráfico */
  title?: string;
  /** Modo de apilamiento: ID de dimensión, 'all' para apilar todo, o null */
  stacked: number | "all" | null;
  /** Configuración del eje X */
  xAxis: {
    /** Rotación de las etiquetas en grados (ej: 45, 90) o null */
    rotateLabels: number | null;
    /** Nivel de dimensión asignado como primer nivel */
    firstLevel: number;
    /** Nivel de dimensión asignado como segundo nivel o null */
    secondLevel: number | null;
    /** Deshabilita la generación automática del título del eje X */
    disableAutoTitle?: boolean;
  };
  /** Configuración del eje Y */
  yAxis: {
    /** Título descriptivo del eje vertical */
    title: string;
    /** Valor máximo manual o null para cálculo automático */
    max: number | null;
  };
  /** Configuración de tooltips */
  tooltip: {
    /** Compartir tooltip entre series */
    shared: boolean;
    /** Cantidad de decimales en los valores */
    decimals: number | null;
    /** Sufijo textual (ej: '%', ' USD') */
    suffix: string | null;
    /** Formato personalizado usando placeholders */
    format: string | null;
    /** Muestra la fila del total en el tooltip compartido */
    showTotal: boolean;
    /** Muestra el porcentaje relativo en el tooltip */
    showPercentage?: boolean;
    /** Umbral de cantidad de series para pasar a maquetación multicolumna */
    columnThreshold?: number;
    /** Máximo de columnas permitidas en el tooltip (default: 3) */
    maxColumns?: number;
  };
  /** Configuración de leyendas */
  legends: {
    enabled: boolean;
    show: boolean;
    position: "top" | "right" | "bottom" | "left" | string;
  };
  /** Configuración del navegador / Zoom */
  navigator: {
    show: boolean;
    start: number | null;
    end: number | null;
  };
  /** Paleta de colores personalizada */
  colors?: string[];
  /** Ancho en píxeles (o null para responsivo 100%) */
  width: number | null;
  /** Alto en píxeles, porcentaje u otra unidad CSS (o null) */
  height: number | string | null;
  /** Filtra automáticamente los datos al último año disponible */
  filterLastYear: boolean;
  /** Muestra leyenda especial para comparativa anual */
  showYearsLegend: boolean;
  /** Muestra valores convertidos a porcentaje */
  toPercent: boolean;
  /** Unidad de medida textual de la variable */
  measureUnit: string;
  /** Modo vista previa reducida */
  isPreview: boolean;
  /** Inhabilita la actualización automática al cambiar el dataset */
  disableAutoUpdate: boolean;
}
```

### `TableOptions`

```ts
export interface TableOptions {
  /** Decimales para los valores tabulados */
  digitsAfterDecimal: number;
  /** Reglas de ordenamiento para dimensiones */
  sorters: TableSorter[];
  /** Muestra fila de totales generales */
  totalRow: boolean;
  /** Muestra columna de totales generales */
  totalCol: boolean;
  /** Dimensiones asignadas a columnas */
  cols: (string | number)[];
  /** Dimensiones asignadas a filas */
  rows: (string | number)[];
  /** Sufijo textual para celdas */
  suffix?: string;
  /** Modo de cálculo del valor de celda */
  valueDisplay?: "nominal" | "percentOfTotal" | "percentOfRow" | "percentOfColumn";
  /** Deshabilita la actualización automática */
  disableAutoUpdate?: boolean;
}
```

### `Series`

```ts
export interface Series {
  color: string;
  visible: boolean;
  type?: string;
  name: string;
  data: Array<number | [number, number] | { value: number }>;
  smooth?: boolean;
  stacking?: string;
  chartType?: string;
  symbol?: string;
  symbolSize?: number;
  lineStyle?: { width?: number; type?: string };
  /** Identifica si la serie corresponde a una línea de meta o referencia global */
  isReferenceSeries?: boolean;
}
```

### `Dataset`

Clase fachada reactiva que administra la estructura de datos, dimensiones y filtrado/agrupación (_roll-up_):

```ts
export class Dataset {
  public readonly id?: number;
  public readonly dimensions: Dimension[];
  public readonly enableRollUp: boolean;
  public readonly isPercent: boolean;
  public readonly rowData: RowData[];
  public readonly dataProvider: DataProvider;
  public readonly dataUpdated: Subject<boolean>;

  constructor(config: { id?: number; dimensions: Dimension[]; enableRollUp?: boolean; isPercent?: boolean; rowData: RowData[] });

  /** Aplica configuración de filtros y/o roll-up */
  public applyFilters(config: FiltersConfig): void;
  /** Obtiene copia de los datos crudos originales */
  public getRawData(): RowData[];
  /** Obtiene los datos procesados actuales (tras filtros y roll-up) */
  public getCurrentData(): RowData[];
  /** Obtiene todas las dimensiones definidas */
  public getAllDimensions(): Dimension[];
  /** Obtiene las dimensiones actualmente activas (no colapsadas) */
  public getActiveDimensions(): Dimension[];
  /** Obtiene la clave de datos ('key') asociada al ID de dimensión */
  public getDimensionKey(dimensionId: number): string | undefined;
  /** Obtiene valores únicos para una dimensión por su ID */
  public getDimensionValues(dimensionId: number): (string | number)[];
}
```

---

## 📡 Sistema de Eventos y Auditoría (`EventBusService` & `AuditService`)

La librería incluye una infraestructura reactiva centralizada para monitorear, auditar e integrar los eventos del ciclo de vida de los componentes con herramientas externas de analítica o logs.

### Uso de `EventBusService`

Puedes inyectar `EventBusService` en cualquier servicio o componente para escuchar eventos con tipado estricto:

```ts
import { Component, inject, OnInit } from '@angular/core';
import { EventBusService, VisualizerEventType } from '@uncuyoapp/ngx-data-visualizer';

@Component({ ... })
export class AnalyticsLoggerComponent implements OnInit {
  private readonly eventBus = inject(EventBusService);

  ngOnInit(): void {
    // Escucha un evento específico con payload tipado automáticamente
    this.eventBus.on(VisualizerEventType.CHART_RENDER_COMPLETE).subscribe((event) => {
      console.log(`[Gráfico Renderizado] Instancia ID: ${event.instanceId}`);
    });

    // Escucha la totalidad del stream de eventos
    this.eventBus.events$.subscribe((event) => {
      console.log('Evento emitido:', event.type, event);
    });
  }
}
```

### Depuración con `AuditService`

El servicio `AuditService` permite auditar eventos formateados en la consola del navegador. Se puede activar mediante tres vías:

1. **Configuración en Proveedores (DI)**:
   ```ts
   provideDataVisualizerCharts({ debug: true });
   ```
2. **LocalStorage**:
   Establece la clave `ngx-viz-debug` en `localStorage`:
   ```js
   localStorage.setItem("ngx-viz-debug", "*"); // Audita todos los eventos
   localStorage.setItem("ngx-viz-debug", "[Chart]*"); // Audita solo eventos de gráficos
   ```
3. **URL Query Parameters**:
   Añade el parámetro a la URL de la aplicación: `https://mi-app.com/?ngx-viz-debug=*`.

---

## 🎨 Dimensiones, Personalización y Estilos (Design Tokens)

El sistema de estilos utiliza una arquitectura basada en **CSS Custom Properties** (Variables CSS) que permite personalizar la apariencia visual y adaptar temas sin romper la encapsulación de los componentes Angular.

### Las 4 Formas de Configurar el Tamaño del Gráfico

1. **Por `chartOptions`**: Asigna `width` o `height` como números o cadenas CSS (`height: '50vh'`).
2. **Layout Responsivo 100%**: Asigna `width: null` y `height: null`. El gráfico se expandirá al 100% de su contenedor padre mediante `ResizeObserver`.
3. **Variables CSS en Línea / SCSS**:
   ```css
   libChart {
     --viz-chart-min-height: 450px;
     --viz-chart-width: 100%;
   }
   ```
4. **Configuración Global por Inyección (`DATA_VISUALIZER_CONFIG`)**:
   ```ts
   provideDataVisualizerCharts({ defaultHeight: 500 });
   ```

### 🎨 Design Tokens CSS Soportados

Puedes sobreescribir estos tokens a nivel global en tu hoja de estilos principal (`styles.scss`):

```css
:root {
  /* Colores de marca y estado */
  --viz-primary: #0450ff; /* Color de énfasis principal */
  --viz-primary-contrast: #ffffff; /* Contraste para texto sobre color primario */
  --viz-bg-card: #ffffff; /* Fondo para las tarjetas de gráficos */
  --viz-bg-overlay: rgba(255, 255, 255, 0.85); /* Fondo para overlays CDK */
  --viz-text: #333333; /* Texto principal */
  --viz-text-muted: #666666; /* Texto secundario / atenuado */
  --viz-border-color: #e6e6e6; /* Color de bordes */
  --viz-focus-color: #6467f3; /* Anillo de enfoque (accesibilidad) */

  /* Sombras y bordes */
  --viz-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --viz-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --viz-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
  --viz-border-radius: 8px;

  /* Transiciones */
  --viz-transition-duration: 0.3s;
  --viz-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ejemplo de Modo Oscuro */
[data-theme="dark"] {
  --viz-bg-card: #1e1e24;
  --viz-bg-overlay: rgba(30, 30, 36, 0.9);
  --viz-text: #f3f4f6;
  --viz-text-muted: #9ca3af;
  --viz-border-color: #374151;
}
```

---

## ⚡ Optimización y Rendimiento

- **Carga Diferida (Lazy Loading)**: Dependencias pesadas como ECharts y módulos de PivotTable se importan dinámicamente de manera asíncrona mediante `useFactory`.
- **Estrategia OnPush & Signals**: Todos los componentes utilizan `ChangeDetectionStrategy.OnPush` y gestionan su estado interno con `Signals` y `Computed`, minimizando re-renders innecesarios.
- **Desacoplamiento de Resize**: Las dimensiones físicas se gestionan de forma nativa mediante el `ResizeObserver` de `ngx-echarts` con debounce, previniendo reconstrucciones lógicas del dataset durante el cambio de tamaño del viewport.

---

## 📄 Licencia

Distribución bajo Licencia MIT. Consulta el archivo [LICENSE](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/LICENSE) para más detalles.

---

**Desarrollado por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) — Universidad Nacional de Cuyo**
