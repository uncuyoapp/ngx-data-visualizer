# NgxDataVisualizer

NgxDataVisualizer es una librería Angular que proporciona componentes y directivas para la visualización de datos en forma de gráficos y tablas. Está diseñada para ser flexible, reutilizable y fácil de integrar en aplicaciones Angular.

## Características Principales

- Visualización de datos mediante gráficos y tablas
- Soporte para múltiples tipos de gráficos
- Directivas personalizables para la integración de datos
- Sistema de leyendas integrado
- Estilos personalizables mediante SCSS

## Componentes Principales

### Gráficos
- `ChartDirective`: Directiva base para la renderización de gráficos
- `MultipleChartDirective`: Directiva para la visualización de múltiples gráficos
- Componentes de gráficos específicos en el directorio `chart/`

### Tablas
- `TableDirective`: Directiva para la renderización de tablas de datos
- Componentes de tabla en el directorio `table/`

### Utilidades
- `DataProvider`: Servicio para la gestión y transformación de datos
- `Legend`: Componente para la visualización de leyendas
- `Dataset`: Utilidades para el manejo de conjuntos de datos

## Instalación

```bash
npm install ngx-data-visualizer
```

## Uso Básico

### 1. Configuración Básica

#### 1.1 Creación de un Dataset

```typescript
import { Dataset, Dimension, Item } from 'ngx-data-visualizer';

// Definir dimensiones
const dimensions: Dimension[] = [
  {
    id: 1,
    name: 'año',
    nameView: 'Año',
    items: [],
  },
  {
    id: 2,
    name: 'category',
    nameView: 'Categoría',
    items: [
      { id: 1, name: 'Electrónica', selected: true, color: '#FF5733' },
      { id: 2, name: 'Ropa', selected: true, color: '#33FF57' }
    ]
  }
];

// Definir datos
const rowData = [
  { 'Año': '2023', 'Categoría': 'Electrónica', 'valor': 100 },
  { 'Año': '2023', 'Categoría': 'Ropa', 'valor': 150 },
  { 'Año': '2024', 'Categoría': 'Electrónica', 'valor': 200 },
  { 'Año': '2024', 'Categoría': 'Ropa', 'valor': 180 }
];

// Crear instancia del dataset
const dataset = new Dataset({
  dimensions,
  rowData,
  enableRollUp: true
});
```

#### 1.2 Uso de Filtros

```typescript
// Aplicar filtros
const filters = new Filters();
filters.rollUp = ['Categoría'];  // Agrupar por categoría
filters.filter = [
  { name: 'Año', items: ['2023', '2024'] }  // Filtrar por años específicos
];

try {
  dataset.applyFilters(filters);
  console.log('Filtros aplicados correctamente');
} catch (error) {
  console.error('Error al aplicar filtros:', error);
}
```

### 2. Uso Avanzado

#### 2.1 Acceso a Datos Procesados

```typescript
// Obtener datos procesados
const processedData = dataset.getData();
console.log('Datos procesados:', processedData);

// Obtener dimensiones
const availableDimensions = dataset.getDimensions();
console.log('Dimensiones disponibles:', availableDimensions.map(d => d.nameView));
```

#### 2.2 Manejo de Eventos

```typescript
// Suscribirse a actualizaciones de datos
dataset.dataUpdated.subscribe(updated => {
  if (updated) {
    console.log('Los datos han sido actualizados');
    // Actualizar la visualización aquí
  }
});
```

### 3. Ejemplo Completo

```typescript
import { Dataset, Dimension, Item, Filters } from 'ngx-data-visualizer';

// 1. Configuración inicial
const config = {
  dimensions: [
    {
      id: 1,
      name: 'año',
      nameView: 'Año',
      items: [],
      selected: false,
    }
  ],
  rowData: [
    { 'Año': '2023', 'valor': 100 },
    { 'Año': '2024', 'valor': 150 }
  ],
  enableRollUp: false
};

// 2. Crear dataset
try {
  const dataset = new Dataset(config);
  
  // 3. Configurar filtros
  const filters = new Filters();
  filters.rollUp = [];
  filters.filter = [];
  
  // 4. Aplicar filtros
  dataset.applyFilters(filters);
  
  // 5. Obtener datos procesados
  const data = dataset.getData();
  console.log('Datos para visualización:', data);
  
} catch (error) {
  console.error('Error en el flujo de datos:', error);
}
```

## Uso de Directivas

### Directiva Chart (`ChartDirective`)

La directiva `libChart` se utiliza para incrustar y configurar gráficos. Requiere un objeto `Dataset` y un objeto `ChartOptions` como entradas.

```typescript
import { ChartOptions, Dataset } from 'ngx-data-visualizer';

// Ejemplo de Dataset (como se muestra en el README actual)
const dimensions = [
  { id: 1, name: 'year', nameView: 'Año', items: [] },
  { id: 2, name: 'category', nameView: 'Categoría', items: [] }
];
const rowData = [
  { 'year': '2023', 'category': 'Electronics', 'value': 100 },
  { 'year': '2024', 'category': 'Electronics', 'value': 120 }
];
const myDataset = new Dataset({ dimensions, rowData });

// Opciones de Configuración del Gráfico (ChartOptions)
const chartOptions: ChartOptions = {
  type: 'column', // 'column', 'line', 'pie', etc.
  title: 'Ventas por Categoría',
  stacked: 'total', // o null
  xAxis: {
    title: 'Año',
    rotateLabels: 45,
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
    suffix: '€',
    format: null,
    showTotal: true
  },
  legends: {
    enabled: true,
    show: true,
    position: 'bottom'
  },
  navigator: {
    show: false,
    start: null,
    end: null
  },
  colors: ['#FF5733', '#33FF57'],
  width: null,
  height: '400px',
  filterLastYear: false,
  showYearsLegend: false,
  toPercent: false,
  measureUnit: '€',
  isPreview: false,
  disableAutoUpdate: false
};
```

**Uso en el Template Angular:**

```html
<div libChart [dataset]="myDataset" [chartOptions]="chartOptions"></div>
```

### Directiva Table (`TableDirective`)

La directiva `libTable` se utiliza para mostrar datos en formato tabular con capacidades de pivotado. Requiere un objeto `Dataset` y un objeto `PivotConfiguration` como entradas.

```typescript
import { TableConfiguration, PivotConfiguration, Dataset } from 'ngx-data-visualizer';

// Ejemplo de Dataset (como se muestra en el README actual)
const dimensions = [
  { id: 1, name: 'product', nameView: 'Producto', items: [] },
  { id: 2, name: 'region', nameView: 'Región', items: [] }
];
const rowData = [
  { 'product': 'A', 'region': 'North', 'sales': 100 },
  { 'product': 'B', 'region': 'South', 'sales': 150 }
];
const myTableDataset = new Dataset({ dimensions, rowData });

// Configuración de Pivot (PivotConfiguration)
const pivotConfig: PivotConfiguration = {
  digitsAfterDecimal: 2,
  sorters: [],
  totalRow: true,
  totalCol: true,
  cols: ['region'],
  rows: ['product'],
  suffix: ' units'
};
```

**Uso en el Template Angular:**

```html
<div libTable [dataset]="myTableDataset" [options]="pivotConfig"></div>
```

## Desarrollo

### Generar un nuevo componente

```bash
ng generate component component-name --project ngx-data-visualizer
```

### Construir la librería

```bash
ng build ngx-data-visualizer
```

## Contribución

Las contribuciones son bienvenidas. Por favor, lee nuestras guías de contribución antes de enviar un pull request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
