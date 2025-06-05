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
    selected: false,
    showItems: false
  },
  {
    id: 2,
    name: 'category',
    nameView: 'Categoría',
    items: [
      { id: 1, name: 'Electrónica', selected: true, color: '#FF5733' },
      { id: 2, name: 'Ropa', selected: true, color: '#33FF57' }
    ],
    selected: true,
    showItems: true,
    enableMulti: true
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
      showItems: false
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
