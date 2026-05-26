# @uncuyoapp/ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Nota:** Esta es la documentación técnica de la librería. Para una guía de instalación, configuración y ejemplos de uso, consulta el [README principal](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md) o la [demo interactiva](https://uncuyoapp.github.io/ngx-data-visualizer/).

`@uncuyoapp/ngx-data-visualizer` es una librería de código abierto desarrollada por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Su objetivo es facilitar la visualización de datos en proyectos Angular, promoviendo el uso de herramientas tecnológicas para el análisis de datos públicos.

La librería proporciona un conjunto de componentes `standalone` para la visualización de datos mediante gráficos y tablas interactivas de forma limpia y encapsulada en el DOM.

---

## ✨ Características principales

- **🚀 Standalone Architecture** - Completamente compatible con Angular standalone APIs.
- **⚙️ Proveedores configurables** - Incluye solo las funcionalidades que necesitas.
- **📊 Visualizaciones potentes** - Integración con ECharts y PivotTable.js.
- **🎨 Altamente personalizable** - Temas y estilos configurables (ahora desacoplados por Variables CSS).
- **📤 Exportación múltiple** - Soporta Canvas (PNG, JPG), Excel y HTML.
- **🔧 TypeScript completo** - Interfaces tipadas para mejor experiencia de desarrollo.
- **📱 Responsive** - Optimizado para dispositivos móviles y desktop.
- **🎯 Filtros avanzados** - Sistema de filtrado y agrupación integrado.
- **🎛️ Editor panel integrado** - Permite configurar visualizaciones en tiempo real mediante overlays CDK.

---

## 📁 Estructura de la Librería

La estructura del código fuente en `projects/ngx-data-visualizer/src/lib` está organizada de manera modular:

```
/src/lib/
├── chart/               # Lógica y componente principal de gráficos (ChartComponent)
│   ├── echart/          # Renderizado nativo del lienzo de ECharts (Variables CSS)
│   └── services/        # Servicios de actualización y factoría de ECharts
├── table/               # Lógica y componente principal de tablas (TableComponent)
│   ├── services/        # Lógica de temas y exportaciones Excel
│   └── utils/           # Clases útiles para sticky headers e inicialización
├── multiple-chart/      # Vista orquestada declarativa para gráficos múltiples
├── services/            # Servicios principales de datos (Dataset, DataProvider)
├── providers.ts         # Proveedores de servicios para la inyección de dependencias
├── icons/               # Componentes de íconos SVG reutilizables
├── legend/              # Componente de leyenda para gráficos
└── types/               # Interfaces y tipos de datos globales
```

---

## 📖 Uso en Componentes

Puedes importar y declarar los componentes standalone en cualquier archivo Angular:

```ts
// my-component.component.ts
import { Component } from '@angular/core';
import { 
  ChartComponent, 
  TableComponent,
  Dataset,
  ChartOptions,
  TableOptions,
  Dimension,
  RowData
} from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    ChartComponent, // ✅ Importa los componentes unificados
    TableComponent
  ],
  template: `
    <!-- Gráfico -->
    <libChart 
         [dataset]="dataset" 
         [chartOptions]="chartOptions"
         [showEditor]="showEditor"
         (onConfigChange)="onConfigChange($event)">
    </libChart>

    <!-- Tabla -->
    <libTable 
         [dataset]="dataset" 
         [tableOptions]="tableOptions"
         [showEditor]="showEditor">
    </libTable>
  `
})
export class MyComponent {
  // Configuración de datos
  dimensions: Dimension[] = [
    {
      id: 1,
      name: 'region',
      nameView: 'Región',
      items: [
        { id: 1, name: 'Norte', selected: true },
        { id: 2, name: 'Sur', selected: true },
      ],
    }
  ];

  rowData: RowData[] = [
    { region: 'Norte', valor: 1500 },
    { region: 'Sur', valor: 1200 }
  ];

  dataset = new Dataset({
    dimensions: this.dimensions,
    rowData: this.rowData,
    enableRollUp: true,
  });

  chartOptions: ChartOptions = {
    type: 'bar',
    stacked: null,
    xAxis: { title: '', rotateLabels: null, firstLevel: 1, secondLevel: null },
    yAxis: { title: '', max: null },
    tooltip: { shared: true, decimals: null, suffix: null, format: null, showTotal: false },
    legends: { enabled: true, show: true, position: 'top' },
    navigator: { show: false, start: null, end: null },
    width: 600,
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: '',
    isPreview: false,
    disableAutoUpdate: false,
  };

  tableOptions: TableOptions = {
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
    cols: [1],
    rows: [],
  };

  onConfigChange(config: ChartOptions): void {
    console.log('Nueva configuración:', config);
  }
}
```

> 💡 **Nota de Retrocompatibilidad:** Si tu código heredado importa `ChartDirective`, `TableDirective` o `MultipleChartDirective`, estas referencias siguen funcionando perfectamente a nivel de TypeScript y marcado HTML, apuntando de forma transparente a los nuevos componentes mediante alias deprecados.

---

## 🧩 API de Componentes

Los antiguos selectores de atributos (`[libChart]`, `[libTable]`, `[libMultipleChart]`) se conservan de forma nativa junto con sus selectores de etiquetas elementales para brindar compatibilidad total en HTML.

### ChartComponent (`libChart, [libChart]`)

Componente para renderizar gráficos interactivos individuales encapsulando su lienzo en el DOM.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar. |
| `chartOptions` | `ChartOptions` | ✅ **Requerido** - Configuración del gráfico. |
| `showEditor` | `boolean` | Controla de manera declarativa la apertura y cierre del panel de configuración lateral (default: `false`). |

#### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `seriesChange` | `Series[]` | Se emite cuando cambian las series del gráfico. |
| `optionsChange` | `ChartOptions` | Se emite cuando cambia la configuración de los gráficos. |
| `onConfigChange` | `ChartOptions` | Se emite cuando se aplica una nueva configuración desde el panel de edición. |
| `close` | `void` | Se emite cuando se cierra el panel de configuración lateral. |

#### Métodos públicos

Para interactuar de forma programática con la instancia del componente mediante `@ViewChild`:

```ts
@ViewChild(ChartComponent) chartComponent!: ChartComponent;

// Redimensionar el gráfico de forma manual para responder a cambios de layouts
this.chartComponent.resize();

// Cambiar a vista porcentual
this.chartComponent.toPercentage();

// Exportar gráfico (JPG o PNG)
this.chartComponent.export('png'); // Descarga automática del Canvas

// Mostrar/ocultar línea de meta
this.chartComponent.toggleShowGoal(goalConfig);
```

---

### TableComponent (`libTable, [libTable]`)

Componente para renderizar tablas dinámicas e interactivas.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar. |
| `tableOptions` | `TableOptions` | ✅ **Requerido** - Configuración de la tabla. |
| `showEditor` | `boolean` | Controla de manera declarativa la apertura y cierre del panel de configuración lateral (default: `false`). |

#### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `optionsChange` | `TableOptions` | Se emite cuando cambia la configuración de la tabla. |
| `onConfigChange` | `TableOptions` | Se emite cuando se guarda una nueva configuración desde el editor. |
| `close` | `void` | Se emite cuando se cierra el editor lateral. |

#### Métodos públicos

```ts
@ViewChild(TableComponent) tableComponent!: TableComponent;

// Cambiar modo de visualización de valores
this.tableComponent.setValueDisplay('percentOfTotal'); // 'nominal' | 'percentOfTotal' | 'percentOfRow' | 'percentOfColumn'

// Exportar tabla
this.tableComponent.export('xlsx', 'mi-tabla'); // Descarga de archivo Excel formateado
const htmlData = this.tableComponent.export('html'); // Devuelve el marcado HTML con bordes listos
```

---

### MultipleChartComponent (`libMultipleChart, [libMultipleChart]`)

Componente orquestador declarativo para renderizar múltiples gráficos simultáneamente dividiendo los datos por dimensiones de forma automática.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar. |
| `options` | `ChartOptions` | ✅ **Requerido** - Configuración base de los gráficos. |
| `splitDimension` | `Dimension` | ✅ **Requerido** - Dimensión a partir de la cuál se generarán múltiples gráficos individuales. |

---

## 🎨 Dimensiones, Personalización y Estilos (Tamaños del Gráfico)

El sistema de dimensiones de los gráficos está diseñado mediante una arquitectura reactiva que combina **CSS Custom Properties (Variables CSS)** nativas y **Angular Host Bindings**. Esto permite un control de layout óptimo en rejillas Flexbox o CSS Grid sin romper la encapsulación de estilos de Angular.

### Las 4 Formas de Configurar el Tamaño del Gráfico

#### 1. Por medio de Opciones (`chartOptions` en TypeScript)
Es el método tradicional ideal cuando necesitas un tamaño fijo o específico para tu gráfico:
```ts
this.chartOptions = {
  // ...
  width: 600,     // Compila automáticamente a '600px'
  height: '50vh'   // Soporta cualquier unidad válida de CSS (px, %, vh, rem, etc.)
};
```
*   **Comportamiento interno:** El componente detecta que hay valores fijos definidos, inhabilita automáticamente las restricciones de altura mínima (`min-height`) del Host para evitar colisiones y aplica los tamaños fijos directamente en la inicialización nativa de ECharts.

#### 2. Comportamiento 100% Responsivo (Heredado de la Grilla/Contenedor)
Si deseas que el gráfico se expanda automáticamente para llenar el tamaño real del contenedor HTML del consumidor, deja `width` y `height` como `null` o `undefined`:
```ts
this.chartOptions = {
  width: null,
  height: null
};
```
*   **Comportamiento interno:** El componente establece su base en `100%` de ancho y alto, dejando que la hoja de estilos del consumidor (ej. un contenedor Flexbox) dicte la altura. ECharts escuchará reactivamente los cambios de pantalla del navegador y redibujará el lienzo de forma óptima.

#### 3. Variables de CSS Nativas (Custom Properties en Cascada)
Puedes inyectar las variables directamente en la etiqueta HTML o en las hojas de estilo del consumidor sin necesidad de mutar las opciones en TypeScript:

*   **En línea en el HTML:**
    ```html
    <libChart 
      [dataset]="dataset" 
      [chartOptions]="chartOptions"
      style="--viz-chart-min-height: 500px; --viz-chart-width: 80%;">
    </libChart>
    ```
*   **En tu hoja de estilos SCSS contenedora:**
    ```scss
    lib-app-echarts, libChart {
      --viz-chart-min-height: 350px;
      --viz-chart-height: 100%;
    }
    ```
*   **Propiedades soportadas por defecto:**
    *   `--viz-chart-width` (default: `var(--viz-chart-min-width, 100%)` - Si no se especifica localmente, cae en cascada sobre el ancho mínimo global o al `100%`)
    *   `--viz-chart-height` (default: `100%` - Se mantiene estrictamente fluido en base al contenedor padre para evitar desbordes accidentales)
    *   `--viz-chart-min-height` (default: `400px` - Garantiza un área inicial segura en contenedores flexibles)
    *   `--viz-chart-min-width` (default: `100%` - Garantiza ancho completo por defecto)

### 🎨 Sistema de Personalización Visual (CSS Design Tokens)

La librería cuenta con un robusto sistema de tokens de diseño centralizados basados en **CSS Custom Properties** (Variables CSS). Esto permite a los desarrolladores personalizar por completo el aspecto visual (colores de marca, modo oscuro, sombras, bordes y micro-animaciones) de toda la suite de visualización (gráficos, tablas, leyendas y editores interactivos) en cascada.

Puedes inyectar o sobreescribir estos tokens a nivel global en tu archivo de estilos principal (`styles.scss`):

```css
:root {
  /* Temas y Colores Base */
  --viz-primary: #0450ff;          /* Color de énfasis principal (botones activos, deslizadores, focos) */
  --viz-primary-contrast: #ffffff; /* Contraste para el color primario */
  --viz-bg-card: #ffffff;          /* Fondo para las tarjetas de gráficos individuales */
  --viz-bg-overlay: rgba(255, 255, 255, 0.75); /* Fondo para el panel flotante de configuración (vidrio) */
  --viz-bg-overlay-hover: rgba(255, 255, 255, 1);
  --viz-text: #333333;             /* Color de texto principal */
  --viz-text-muted: #666666;       /* Color de texto secundario/atenuado */
  --viz-border-color: #e6e6e6;     /* Color de bordes decorativos */
  --viz-focus-color: #6467f3;      /* Color para el contorno de foco y accesibilidad visible */

  /* Sombras de Alta Definición */
  --viz-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --viz-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --viz-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);

  /* Espaciado y Radios de Borde */
  --viz-border-radius: 8px;        /* Radio base para esquinas redondeadas (tarjetas, botones, inputs) */
  --viz-border-radius-pill: 50%;   /* Radio para botones redondos y tiradores deslizantes */
  --viz-grid-gap: 16px;            /* Espaciado de rejilla entre gráficos en MultipleChart */
  --viz-padding-card: 16px;        /* Espaciado interno de las tarjetas de gráficos */

  /* Animaciones Premium */
  --viz-transition-duration: 0.3s;
  --viz-transition-duration-fast: 0.2s;
  --viz-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Soporte Nativo para Modo Oscuro

Puedes cambiar todo el ecosistema de visualización a modo oscuro simplemente envolviendo la sobreescritura de las variables en una media query o clase de tema:

```css
[data-theme="dark"] {
  --viz-bg-card: #1e1e24;
  --viz-bg-overlay: rgba(30, 30, 36, 0.85);
  --viz-bg-overlay-hover: #1e1e24;
  --viz-text: #f3f4f6;
  --viz-text-muted: #9ca3af;
  --viz-border-color: #374151;
  --viz-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --viz-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

#### 4. Configuración Predeterminada Global (Módulo o Inyección)
Si deseas definir un tamaño por defecto para **todos** los gráficos de tu aplicación sin configurarlos uno a uno, registra el token `DATA_VISUALIZER_CONFIG` en tus proveedores globales:
```ts
import { DATA_VISUALIZER_CONFIG } from '@uncuyoapp/ngx-data-visualizer';

providers: [
  {
    provide: DATA_VISUALIZER_CONFIG,
    useValue: {
      defaultHeight: 500, // Todos los gráficos medirán 500px de altura mínima por defecto
      defaultWidth: '100%'
    }
  }
]
```

---

## 🚀 Optimización y Rendimiento

- **Lazy Loading automático:** Los proveedores de la librería (`provideDataVisualizerCharts` y `provideDataVisualizerTables`) importan dinámicamente dependencias pesadas de forma diferida (como ECharts y librerías de PivotTable) para mejorar drásticamente el tiempo de carga de la aplicación.
- **Detección OnPush & Signals:** Todos los componentes se ejecutan bajo la estrategia `ChangeDetectionStrategy.OnPush` y procesan los cambios de estado mediante señales reactivas (`signals` y `computed`), evitando renderizados innecesarios y garantizando una tasa de refresco ultra fluida.

---

## 📄 Licencia

MIT License. Ver [LICENSE](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/LICENSE) para detalles completos.

---

**Desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**
