# @uncuyoapp/ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Nota:** Esta es la documentación técnica de la librería. Para una guía de instalación, configuración y ejemplos de uso, consulta el [README principal](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md) o la [demo interactiva](https://uncuyoapp.github.io/ngx-data-visualizer/).

`@uncuyoapp/ngx-data-visualizer` es una librería de código abierto desarrollada por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Su objetivo es facilitar la visualización de datos en proyectos Angular, promoviendo el uso de herramientas tecnológicas para el análisis de datos públicos.

La librería proporciona un conjunto de directivas `standalone` para la visualización de datos mediante gráficos y tablas interactivas.

## ✨ Características principales

- **🚀 Standalone Architecture** - Completamente compatible con Angular standalone APIs
- **⚙️ Proveedores configurables** - Incluye solo las funcionalidades que necesitas
- **📊 Visualizaciones potentes** - Integración con ECharts y PivotTable.js
- **🎨 Altamente personalizable** - Temas y estilos configurables
- **📤 Exportación múltiple** - Soporta SVG, PNG, JPG, Excel y HTML
- **🔧 TypeScript completo** - Interfaces tipadas para mejor experiencia de desarrollo
- **📱 Responsive** - Optimizado para dispositivos móviles y desktop
- **🎯 Filtros avanzados** - Sistema de filtrado y agrupación integrado

## 📁 Estructura de la Librería

La estructura del código fuente en `projects/ngx-data-visualizer/src/lib` está organizada por funcionalidad:

```
/src/lib/
├── chart/               # Lógica principal para gráficos (ChartComponent)
├── table/               # Lógica principal para tablas (TableComponent)
├── multiple-chart/      # Componente para múltiples gráficos
├── directives/          # Directivas standalone (chart, table, multiple-chart)
├── services/            # Servicios principales (Dataset, DataProvider)
├── providers.ts         # Proveedores de servicios para la inyección de dependencias
├── icons/               # Componentes de íconos SVG
├── legend/              # Componente de leyenda para gráficos
└── types/               # Interfaces y tipos de datos globales
```

## 📖 Uso en Componentes

Una vez instalada y configurada según el [README principal](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md), puedes usar las directivas en cualquier componente standalone:

```ts
// my-component.component.ts
import { Component } from '@angular/core';
import { 
  ChartDirective, 
  TableDirective,
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
    ChartDirective, // ✅ Importa las directivas que necesites
    TableDirective
  ],
  template: `
    <!-- Gráfico -->
    <div libChart 
         [dataset]="dataset" 
         [chartOptions]="chartOptions"
         (seriesChange)="onSeriesChange($event)">
    </div>

    <!-- Tabla -->
    <div libTable 
         [dataset]="dataset" 
         [tableOptions]="tableOptions">
    </div>
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
        { id: 3, name: 'Este', selected: true },
        { id: 4, name: 'Oeste', selected: true },
      ],
    },
    {
      id: 2,
      name: 'periodo',
      nameView: 'Período',
      items: [
        { id: 10, name: '2023', selected: true },
        { id: 11, name: '2024', selected: true },
      ],
    },
  ];

  rowData: RowData[] = [
    { region: 'Norte', periodo: '2023', valor: 1500 },
    { region: 'Sur', periodo: '2023', valor: 1200 },
    { region: 'Este', periodo: '2023', valor: 1800 },
    { region: 'Oeste', periodo: '2023', valor: 1600 },
    { region: 'Norte', periodo: '2024', valor: 1400 },
    { region: 'Sur', periodo: '2024', valor: 1100 },
    { region: 'Este', periodo: '2024', valor: 1900 },
    { region: 'Oeste', periodo: '2024', valor: 1700 },
  ];

  dataset = new Dataset({
    dimensions: this.dimensions,
    rowData: this.rowData,
    enableRollUp: true,
  });

  chartOptions: ChartOptions = {
    type: 'bar',
    stacked: 'region',
    xAxis: {
      title: '',
      rotateLabels: null,
      firstLevel: 2,
      secondLevel: null,
    },
    yAxis: {
      title: '',
      max: null,
    },
    tooltip: {
      shared: true,
      decimals: null,
      suffix: null,
      format: null,
      showTotal: false,
    },
    legends: {
      enabled: false,
      show: false,
      position: '',
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
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
    totalRow: false,
    totalCol: false,
    cols: [1],
    rows: [2],
  };

  onSeriesChange(series: any[]): void {
    console.log('Series actualizadas:', series);
  }
}
```

## 🧩 API de Directivas

### ChartDirective

Directiva para renderizar gráficos individuales.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar |
| `chartOptions` | `ChartOptions` | ✅ **Requerido** - Configuración del gráfico |

#### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `seriesChange` | `Series[]` | Se emite cuando cambian las series del gráfico |

#### Métodos públicos

```ts
@ViewChild(ChartDirective) chartDirective!: ChartDirective;

// Cambiar a vista porcentual
this.chartDirective.toPercentage();

// Exportar gráfico
const svgData = this.chartDirective.export('svg');
this.chartDirective.export('jpg'); // Descarga automática

// Mostrar/ocultar línea de meta
this.chartDirective.toggleShowGoal(goalConfig);
```

### TableDirective

Directiva para renderizar tablas dinámicas e interactivas.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar |
| `tableOptions` | `TableOptions` | ✅ **Requerido** - Configuración de la tabla |

#### Métodos públicos

```ts
@ViewChild(TableDirective) tableDirective!: TableDirective;

// Cambiar modo de visualización
this.tableDirective.setValueDisplay('percentOfTotal');
this.tableDirective.setValueDisplay('percentOfRow');
this.tableDirective.setValueDisplay('percentOfColumn');
this.tableDirective.setValueDisplay('nominal');

// Exportar tabla
this.tableDirective.export('xlsx', 'mi-tabla');
const htmlData = this.tableDirective.export('html');
```

### MultipleChartDirective

Directiva para renderizar múltiples gráficos simultáneamente.

#### Inputs

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataset` | `Dataset` | ✅ **Requerido** - Conjunto de datos a visualizar |
| `options` | `ChartOptions` | ✅ **Requerido** - Configuración base de los gráficos |
| `splitDimension` | `Dimension` | ✅ **Requerido** - Dimensión a partir de la cuál se generarán múltiples |

## 📊 Configuración de Datos

### Dataset

La clase `Dataset` es el núcleo de la visualización de datos. Gestiona los datos, dimensiones y filtros.

```ts
import { Dataset, Dimension, RowData } from '@uncuyoapp/ngx-data-visualizer';

const dataset = new Dataset({
  id: 1,                    // Opcional - Identificador único
  dimensions: dimensions,   // ✅ Requerido - Definición de dimensiones
  rowData: rowData,        // ✅ Requerido - Datos en formato tabular
  enableRollUp: true       // Opcional - Habilita agrupaciones
});
```

### Dimension

Define las categorías de datos disponibles:

```ts
const dimension: Dimension = {
  id: 1,                    // Identificador único
  name: 'region',          // Clave en los datos
  nameView: 'Región',      // Nombre para mostrar
  selected: true,          // Si está seleccionada por defecto
  enableMulti: true,       // Permite desagregar en multiples gráficos
  items: [                 // Valores posibles
    {
      id: 1,
      name: 'Norte',
      selected: true,
      color: '#ff0000',    // Color opcional
      order: 1             // Orden opcional
    }
  ]
};
```

### ChartOptions

Configuración completa para gráficos.

```ts
interface ChartOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;
  /** Título del gráfico */
  title?: string;
  /** Indica si el gráfico está apilado y el valor debe corresponder al nombre de una de las dimensiones del conjunto de datos */
  stacked: string | null;
  /** Configuración del eje X */
  xAxis: {
    /** Título del eje X */
    title: string,
    /** Ángulo de rotación de las etiquetas en grados */
    rotateLabels: number | null,
    /** Nivel de agrupación primario (id de una de las dimensiones del conjunto de datos) */
    firstLevel: number,
    /** Nivel de agrupación secundario (id de una de las dimensiones del conjunto de datos) (opcional) */
    secondLevel: number | null
  },
  /** Configuración del eje Y */
  yAxis: {
    /** Título del eje Y */
    title: string,
    /** Valor máximo del eje Y */
    max: number | null
  },
  /** Configuración del tooltip */
  tooltip: {
    /** Indica si el tooltip es compartido entre series */
    shared: boolean,
    /** Número de decimales a mostrar */
    decimals: number | null,
    /** Sufijo para los valores */
    suffix: string | null,
    /** Formato personalizado para los valores */
    format: string | null,
    /** Indica si se muestra el total en el tooltip */
    showTotal: boolean
  },
  /** Configuración de las leyendas */
  legends: {
    /** Indica si las leyendas están habilitadas */
    enabled: boolean,
    /** Indica si se muestran las leyendas */
    show: boolean,
    /** Posición de las leyendas */
    position: string
  },
  /** Configuración del navegador */
  navigator: {
    /** Indica si se muestra el navegador */
    show: boolean,
    /** Valor inicial del navegador */
    start: number | null,
    /** Valor final del navegador */
    end: number | null
  },
  /** Array de colores personalizados para las series */
  colors?: string[],
  /** Ancho del gráfico */
  width: number | null,
  /** Alto del gráfico */
  height: number | string | null,
  /** Indica si se filtra el último año */
  filterLastYear: boolean,
  /** Indica si se muestra la leyenda de años */
  showYearsLegend: boolean,
  /** Indica si los valores se muestran en porcentaje */
  toPercent: boolean,
  /** Unidad de medida para los valores */
  measureUnit: string;
  /** Indica si el gráfico está en modo vista previa */
  isPreview: boolean;
  /** Indica si se deshabilita la actualización automática */
  disableAutoUpdate: boolean;
}
```

### TableOptions

Configuración para tablas.

```ts
interface TableOptions {
  /** Número de decimales a mostrar */
  digitsAfterDecimal: number;
  /** Configuración de ordenamiento para cada dimensión */
  sorters: TableSorter[];
  /** Indica si se debe mostrar la fila de totales */
  totalRow: boolean;
  /** Indica si se debe mostrar la columna de totales */
  totalCol: boolean;
  /** Lista de nombres o IDs de columnas */
  cols: (string | number)[];
  /** Lista de nombres o IDs de filas */
  rows: (string | number)[];
  /** Sufijo opcional para los valores numéricos */
  suffix?: string;
  /** Define el modo de visualización de los valores en la tabla */
  valueDisplay?:
    | "nominal"
    | "percentOfTotal"
    | "percentOfRow"
    | "percentOfColumn";
}

/**
* Interfaz para la configuración del ordenamiento de dimensiones
*/
interface TableSorter {
  /** Nombre o ID de la dimensión a ordenar */
  name: string | number;
  /** Lista de ítems con su orden específico */
  items: {
    /** Nombre del ítem */
    name: string;
    /** Orden del ítem */
    order: number;
  }[];
}
```

## 🎨 Filtros y Agrupaciones

### Aplicar filtros

```ts
import { FiltersConfig } from '@uncuyoapp/ngx-data-visualizer';

// Configuración de filtros
const filtersConfig: FiltersConfig = {
  // Agrupar por dimensiones (rollUp)
  rollUp: [1], // Agrupa por la dimensión con id 1
  
  // Filtrar valores específicos
  filter: [
    {
      name: 2,              // ID de dimensión
      items: ['2024']       // Valores a incluir
    }
  ]
};

// Aplicar al dataset
dataset.applyFilters(filtersConfig);

// Limpiar todos los filtros
dataset.applyFilters({});
```

### Escuchar cambios

```ts
// Suscribirse a cambios en los datos
dataset.dataUpdated.subscribe(() => {
  console.log('Datos actualizados');
  console.log(dataset.getCurrentData());
});
```


## 📤 Exportación de Datos

### Gráficos

```ts
// SVG (vector, escalable)
const svgData = chartDirective.export('svg');

// JPG (imagen, descarga automática)
chartDirective.export('jpg');
```

### Tablas

```ts
// Excel (descarga automática)
tableDirective.export('xlsx', 'mi-reporte');

// HTML (retorna string)
const htmlTable = tableDirective.export('html');
```

## 🚀 Optimización y Rendimiento

### Lazy Loading

Los proveedores de la librería (`provideDataVisualizerCharts` y `provideDataVisualizerTables`) ya implementan carga diferida (lazy loading) de forma automática para dependencias pesadas como ECharts y PivotTable.js.

### Tree Shaking

La librería está optimizada para tree shaking. Para asegurar un tamaño de bundle mínimo, importa solo los componentes y clases que necesites.

```ts
// ✅ Bueno - Solo importa lo necesario
import { ChartDirective, Dataset } from '@uncuyoapp/ngx-data-visualizer';

// ❌ Evita - Importa todo el namespace
import * as NgxDataVisualizer from '@uncuyoapp/ngx-data-visualizer';
```

### Gestión de memoria

Es una buena práctica desuscribirse de los observables para evitar fugas de memoria.

```ts
export class MyComponent implements OnDestroy {
  private subscription?: Subscription;
  
  ngOnInit(): void {
    this.subscription = this.dataset.dataUpdated.subscribe(/* ... */);
  }
  
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
```

## 📚 Ejemplos Adicionales

Para ejemplos completos y casos de uso avanzados, consulta:

- **Demo interactiva**: [Ver ejemplos en vivo](https://uncuyoapp.github.io/ngx-data-visualizer/)
- **Guía de instalación**: [README principal](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md)
- **Repositorio**: [GitHub - @uncuyoapp/ngx-data-visualizer](https://github.com/uncuyoapp/ngx-data-visualizer)


## 📄 Licencia

MIT License. Ver [LICENSE](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/LICENSE) para detalles completos.

---

**Desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**
