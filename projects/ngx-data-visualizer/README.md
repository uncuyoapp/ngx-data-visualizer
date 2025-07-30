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

```ts
const chartOptions = {
  type: 'column',
  title: 'Ventas por año',
  xAxis: { title: 'Año' },
  yAxis: { title: 'Ventas', suffix: ' USD' },
  tooltip: { decimals: 2 },
  colors: ['#1f77b4', '#ff7f0e']
};
```

```ts
const tableOptions = {
  cols: ['año'],
  rows: ['categoría'],
  digitsAfterDecimal: 0,
  suffix: ' unidades',
  totalRow: true,
  totalCol: true
};
```

### Integración en templates

```html
<div libChart [dataset]="dataset" [chartOptions]="chartOptions"></div>
<div libTable [dataset]="dataset" [tableOptions]="tableOptions"></div>
```

## 🧩 Componentes principales

### Gráficos
- `ChartDirective`: Directiva base para la renderización de gráficos
- `MultipleChartDirective`: Directiva para la visualización de múltiples gráficos
- Componentes de gráficos específicos en el directorio `chart/`

### Tablas
- `TableDirective`: Directiva para la renderización de tablas de datos
- Componentes de tabla en el directorio `table/`

### Utilidades
- `Dataset`: Utilidades para el manejo de conjuntos de datos

## 🛠️ Build de la librería

```bash
ng build ngx-data-visualizer
```

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la MIT License.

---

Desarrollado con ❤️ por el [Área de Políticas Públicas]([htts](https://www.uncuyo.edu.ar/politicaspublicas/)) - Universidad Nacional de Cuyo
