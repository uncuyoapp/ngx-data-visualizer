# NgxDataVisualizer

[![npm version](https://badge.fury.io/js/ngx-data-visualizer.svg)](https://www.npmjs.com/package/ngx-data-visualizer)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NgxDataVisualizer es una librería Angular moderna que proporciona directivas standalone para la visualización de datos mediante gráficos y tablas interactivas. Está diseñada para ser flexible, reutilizable y fácil de integrar en aplicaciones Angular modernas.

## ✨ Características principales

- **🚀 Standalone Architecture** - Completamente compatible con Angular standalone APIs
- **⚙️ Proveedores configurables** - Incluye solo las funcionalidades que necesitas
- **📊 Visualizaciones potentes** - Integración con ECharts y PivotTable.js
- **🎨 Altamente personalizable** - Temas y estilos configurables
- **📤 Exportación múltiple** - Soporta SVG, PNG, JPG, Excel y HTML
- **🔧 TypeScript completo** - Interfaces tipadas para mejor experiencia de desarrollo
- **📱 Responsive** - Optimizado para dispositivos móviles y desktop
- **🎯 Filtros avanzados** - Sistema de filtrado y agrupación integrado

## 📦 Instalación

### Instalación básica

```bash
npm install ngx-data-visualizer
```

### Dependencias automáticas

Las versiones modernas de npm (v7+) instalan automáticamente las dependencias requeridas. Si necesitas instalarlas manualmente:

```bash
npm install echarts ngx-echarts pivottable jquery
```

### Dependencias de tipos (opcional pero recomendado)

```bash
npm install --save-dev @types/jquery
```

## ⚙️ Configuración

### Requisitos previos

- **Angular**: >=18.0.0
- **Node.js**: >=18.13.0
- **TypeScript**: >=5.0.0

### 1. Configurar proveedores

En el archivo de configuración principal de tu aplicación (`app.config.ts`), debes agregar los proveedores según las funcionalidades que vayas a utilizar:

#### Para usar solo Gráficos

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDataVisualizerCharts } from 'ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Otros providers...
    provideDataVisualizerCharts(), // ✅ Habilita funcionalidad de gráficos
  ]
};
```

#### Para usar solo Tablas

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDataVisualizerTables } from 'ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Otros providers...
    provideDataVisualizerTables(), // ✅ Habilita funcionalidad de tablas
  ]
};
```

#### Para usar Gráficos y Tablas

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { 
  provideDataVisualizerCharts,
  provideDataVisualizerTables 
} from 'ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Otros providers...
    provideDataVisualizerCharts(), // ✅ Para gráficos
    provideDataVisualizerTables(), // ✅ Para tablas
  ]
};
```

### 2. Usar en componentes

Una vez configurados los proveedores, puedes usar las directivas en cualquier componente standalone:

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
} from 'ngx-data-visualizer';

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
  dataset = new Dataset({
    dimensions: this.dimensions,
    rowData: this.rowData,
    enableRollUp: true
  });

  chartOptions: ChartOptions = {
    chartType: 'bar',
    title: 'Ventas por Región',
    height: 400
  };

  tableOptions: TableOptions = {
    cols: [1],
    rows: [2]
  };

  private dimensions: Dimension[] = [
    {
      id: 1,
      name: 'region',
      nameView: 'Región',
      items: [
        { id: 1, name: 'Norte', selected: true },
        { id: 2, name: 'Sur', selected: true },
        { id: 3, name: 'Este', selected: true },
        { id: 4, name: 'Oeste', selected: true }
      ]
    },
    {
      id: 2,
      name: 'periodo',
      nameView: 'Período',
      items: [
        { id: 10, name: '2023', selected: true },
        { id: 11, name: '2024', selected: true }
      ]
    }
  ];

  private rowData: RowData[] = [
    { region: 'Norte', periodo: '2023', value: 1500},
    { region: 'Sur', periodo: '2023', value: 1200 },
    { region: 'Este', periodo: '2024', value: 1800 },
    { region: 'Oeste', periodo: '2024', value: 1600 }
  ];

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
| `chartCreated` | `Chart` | Se emite cuando se crea la instancia del gráfico |
| `chartUpdated` | `void` | Se emite después de actualizar el gráfico |

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
import { Dataset, Dimension, RowData } from 'ngx-data-visualizer';

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

Configuración completa para gráficos:

```ts
const chartOptions: ChartOptions = {
  
};
```

### TableOptions

Configuración para tablas:

```ts
const tableOptions: TableOptions = {

};
```

## 🎨 Filtros y Agrupaciones

### Aplicar filtros

```ts
import { FiltersConfig } from 'ngx-data-visualizer';

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

```ts
// Los proveedores ya implementan lazy loading automático
provideDataVisualizerCharts(); // ECharts se carga solo cuando se necesita
```

### Tree Shaking

La librería está optimizada para tree shaking. Solo importa lo que necesitas:

```ts
// ✅ Bueno - Solo importa lo necesario
import { ChartDirective, Dataset } from 'ngx-data-visualizer';

// ❌ Evita - Importa todo
import * as NgxDataVisualizer from 'ngx-data-visualizer';
```

### Gestión de memoria

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

## 🔍 Troubleshooting

### Errores comunes

**Error: "No provider for NGX_ECHARTS_CONFIG"**
```ts
// ✅ Solución: Agregar el provider de gráficos
import { provideDataVisualizerCharts } from 'ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDataVisualizerCharts() // ← Agregar esto
  ]
};
```

**Error: "jQuery is not defined"**
```bash
# ✅ Solución: Instalar jQuery
npm install jquery @types/jquery
```

**Error: "Cannot resolve echarts"**
```bash
# ✅ Solución: Instalar ECharts
npm install echarts ngx-echarts
```

### Debugging

```ts
// Habilitar logs de desarrollo
const dataset = new Dataset({
  dimensions,
  rowData,
  debug: true // ← Habilita logs detallados
});
```

## 📚 Ejemplos Adicionales

Para ejemplos completos y casos de uso avanzados, consulta:

- **Demo interactiva**: Ejecuta `ng serve demo` en el repositorio
- **Documentación online**: [Ver ejemplos en vivo](#)
- **Repositorio**: [GitHub - uncuyoapp/ngx-data-visualizer](https://github.com/uncuyoapp/ngx-data-visualizer)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md) para detalles.

## 📄 Licencia

MIT License. Ver [LICENSE](../../LICENSE) para detalles completos.

---

**Desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**