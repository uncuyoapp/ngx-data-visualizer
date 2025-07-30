import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Prism: any; // Declara Prism para que TypeScript lo reconozca

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss',
})
export class ConfigurationComponent implements AfterViewInit {

  ngAfterViewInit() {
    // Usamos Prism para formatear las secciones de código para que se vean bonitas.
    Prism.highlightAll();
  }

  importCode = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Importaciones de ngx-data-visualizer
import {
  ChartDirective,
  TableDirective,
  MultipleChartDirective,
  Dataset,
  Dimension,
  Item,
  RowData,
  ChartOptions,
  TableOptions,
  Filters,
  Goal,
  Series,
  ThemeService
} from 'ngx-data-visualizer';

@Component({selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ChartDirective,
    TableDirective,
    MultipleChartDirective
  ],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent implements OnInit {
  // ... tu implementación
}`;

  datasetStructureCode = `interface Dataset {
  dimensions: Dimension[];
  rowData: RowData[];
  enableRollUp?: boolean;
  id?: number;
}

interface Dimension {
  id: number;
  name: string;
  nameView: string;
  selected: boolean;
  items: Item[];
}

interface Item {
  id: number;
  name: string;
  selected: boolean;
  color?: string;
  order?: number;
}

interface RowData {
  [key: string]: any;
  value: number;
}`;

  datasetInitializationCode = `const dimensions: Dimension[] = [
  {
    id: 1,
    name: 'region',
    nameView: 'Región',
    selected: true,
    items: [
      { id: 1, name: 'Norte', selected: true },
      { id: 2, name: 'Sur', selected: true }
    ]
  },
  {
    id: 2,
    name: 'year',
    nameView: 'Año',
    selected: true,
    items: [
      { id: 1, name: '2023', selected: true }
    ]
  }
];

const rowData: RowData[] = [
  { region: 'Norte', year: 2023, valor: 100 },
  { region: 'Sur', year: 2023, valor: 150 },
  { region: 'Norte', year: 2024, valor: 100 },
  { region: 'Sur', year: 2024, valor: 150 }
];

const dataset = new Dataset({
  dimensions,
  rowData,
  enableRollUp: true,
  id: 1
});`;

  applyFiltersCode = `// Configurar filtros
const filters: Filters = {
  filter: [],
  rollUp: []
};

// Obtener dimensiones para rollUp (ejemplo: agrupar por dimensiones no seleccionadas)
filters.rollUp = dataset.dimensions
  .filter(dimension => !dimension.selected)
  .map(dimension => dimension.nameView);

// Configurar filtros por dimensión (ejemplo: filtrar por items seleccionados)
filters.filter = dataset.dimensions.map(dimension => ({
  name: dimension.nameView,
  items: dimension.items
    .filter(item => item.selected)
    .map(item => item.name)
}));

// Aplicar filtros al dataset
dataset.applyFilters(filters);`;

  clearFiltersCode = `// Resetear selección de dimensiones e items a su estado original
dataset.dimensions.forEach((dimension: Dimension) => {
  dimension.selected = true; // O el estado por defecto que desees
  dimension.items.forEach((item: Item) => (item.selected = true));
});

// Aplicar filtros vacíos para resetear el dataset
dataset.applyFilters(new Filters());`;

  chartOptionsCode = `const chartOptions: ChartOptions = {
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
};`;

  chartHtmlCode = `<libChart [dataset]="myDataset" [chartOptions]="chartOptions"></libChart>`;

  tableOptionsCode = `const tableOptions: TableOptions = {
  digitsAfterDecimal: 2,
  sorters: [],
  totalRow: true,
  totalCol: true,
  cols: ['region'],
  rows: ['product'],
  suffix: ' units'
};`;

  tableHtmlCode = `<libTable [dataset]="myTableDataset" [tableOptions]="tableOptions"></libTable>`;
}