# NgxDataVisualizer

NgxDataVisualizer es una librería Angular que proporciona componentes y directivas para la visualización de datos en forma de gráficos y tablas. Está diseñada para ser flexible, reutilizable y fácil de integrar en aplicaciones Angular.

## ✨ Características principales

- Visualización de datos mediante `ngx-echarts` y `PivotTable.js`
- Directivas standalone para fácil integración
- Sistema de leyendas y tooltips integrado
- Soporte para gráficos simples y múltiples
- Estilos personalizables mediante SCSS y temas

## 📦 Instalación

```bash
npm install ngx-data-visualizer
```

> ⚠️ Requiere Angular >= 17 con soporte para componentes standalone.

## ⚙️ Uso básico

### Dataset

```ts
import { Dataset, Dimension } from 'ngx-data-visualizer';

const dimensions: Dimension[] = [
  { id: 1, name: 'año', nameView: 'Año', items: [] },
  { id: 2, name: 'categoría', nameView: 'Categoría', items: [] }
];

const rowData = [
  { 'año': '2023', 'categoría': 'Electrónica', 'valor': 100 },
  { 'año': '2024', 'categoría': 'Electrónica', 'valor': 150 }
];

const dataset = new Dataset({ dimensions, rowData });
```

### Opciones de configuración

#### Configuración de gráficos (ChartOptions)

```ts
import { ChartOptions } from 'ngx-data-visualizer';

const chartOptions: ChartOptions = {
  type: 'column',
  title: 'Ventas por año',
  stacked: null,
  xAxis: { 
    title: 'Año',
    rotateLabels: null,
    firstLevel: 0,
    secondLevel: null
  },
  yAxis: { 
    title: 'Ventas',
    max: null
  },
  tooltip: { 
    shared: true,
    decimals: 2,
    suffix: ' USD',
    format: null,
    showTotal: false
  },
  legends: {
    enabled: true,
    show: true,
    position: 'right'
  },
  navigator: {
    show: false,
    start: null,
    end: null
  },
  colors: ['#1f77b4', '#ff7f0e'],
  width: null,
  height: null,
  filterLastYear: false,
  showYearsLegend: false,
  toPercent: false,
  measureUnit: 'USD',
  isPreview: false,
  disableAutoUpdate: false
};
```

#### Configuración de tablas (TableOptions)

```ts
import { TableOptions } from 'ngx-data-visualizer';

const tableOptions: TableOptions = {
  cols: ['año'],
  rows: ['categoría'],
  digitsAfterDecimal: 2,
  suffix: ' unidades',
  totalRow: true,
  totalCol: true,
  sorters: [],
  valueDisplay: 'nominal'
};
```

### Integración en templates

```html
<div libChart [dataset]="dataset" [chartOptions]="chartOptions"></div>
<div libTable [dataset]="dataset" [tableOptions]="tableOptions"></div>
```

## 🧩 Componentes principales

### Directivas
- `ChartDirective`: Directiva standalone para la renderización de gráficos individuales
- `MultipleChartDirective`: Directiva standalone para la visualización de múltiples gráficos
- `TableDirective`: Directiva standalone para la renderización de tablas de datos

### Interfaces principales
- `ChartOptions`: Configuración completa para gráficos (en `data.types.ts`)
- `TableOptions`: Configuración para tablas de datos
- `Dataset`: Clase para el manejo de conjuntos de datos
- `Dimension`: Interfaz para definir dimensiones de datos
- `ChartLibraryOptions`: Opciones específicas de la librería de gráficos
- `ChartError`: Clase de error personalizada para operaciones de gráficos

### Componentes internos
- Componentes de gráficos ECharts en el directorio `chart/echart/`
- Componentes de tabla en el directorio `table/`
- Componentes de iconos e interfaz de usuario

## 🛠️ Build de la librería

```bash
ng build ngx-data-visualizer
```

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la MIT License.

---

Desarrollado con ❤️ por el [Área de Políticas Públicas]([htts](https://www.uncuyo.edu.ar/politicaspublicas/)) - Universidad Nacional de Cuyo
