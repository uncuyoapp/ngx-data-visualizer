# Ejemplo de Uso de ngx-data-visualizer

Este documento muestra cómo utilizar las clases principales del módulo `ngx-data-visualizer` para manejar y visualizar datos.

## 1. Configuración Básica

### 1.1 Creación de un Dataset

```typescript
import { Dataset, Dimension, Item } from 'ngx-data-visualizer';

// Definir dimensiones
const dimensions: Dimension[] = [
  {
    id: 1,
    name: 'year',
    nameView: 'Año',
    items: [
      { id: 1, name: '2023', selected: true },
      { id: 2, name: '2024', selected: true }
    ],
    selected: true,
    showItems: true,
    enableMulti: true,
    type: 1
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

### 1.2 Uso de Filtros

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

## 2. Uso Avanzado

### 2.1 Acceso a Datos Procesados

```typescript
// Obtener datos procesados
const processedData = dataset.getData();
console.log('Datos procesados:', processedData);

// Obtener dimensiones
const availableDimensions = dataset.getDimensions();
console.log('Dimensiones disponibles:', availableDimensions.map(d => d.nameView));
```

### 2.2 Manejo de Eventos

```typescript
// Suscribirse a actualizaciones de datos
dataset.dataUpdated.subscribe(updated => {
  if (updated) {
    console.log('Los datos han sido actualizados');
    // Actualizar la visualización aquí
  }
});
```

## 3. Validación de Datos

### 3.1 Validación de Dimensiones

```typescript
// Validar dimensiones antes de crear el dataset
function validateDimensions(dimensions: Dimension[]): boolean {
  try {
    const dataset = new Dataset({ dimensions, rowData: [], enableRollUp: false });
    return true;
  } catch (error) {
    console.error('Error de validación:', error);
    return false;
  }
}
```

## 4. Ejemplo Completo

```typescript
import { Dataset, Dimension, Item, Filters } from 'ngx-data-visualizer';

// 1. Configuración inicial
const config = {
  dimensions: [
    {
      id: 1,
      name: 'year',
      nameView: 'Año',
      items: [
        { id: 1, name: '2023', selected: true },
        { id: 2, name: '2024', selected: true }
      ],
      selected: true,
      showItems: true,
      enableMulti: true
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

## 5. Consideraciones de Rendimiento

- Para conjuntos de datos grandes, considera usar `enableRollUp` para agrupar datos.
- Valida los datos antes de procesarlos para evitar errores en tiempo de ejecución.
- Usa `dataUpdated` para actualizar solo cuando sea necesario.

---

Este documento proporciona una visión general del uso del módulo. Para más detalles, consulta la documentación de la API.
