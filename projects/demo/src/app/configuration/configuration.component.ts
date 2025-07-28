import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var Prism: any; // Declara Prism para que TypeScript lo reconozca

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss',
})
export class ConfigurationComponent implements AfterViewInit {

  ngAfterViewInit() {
    // Llama a Prism.highlightAll() después de que la vista se haya inicializado
    // para que Prism.js pueda encontrar y procesar los bloques de código.
    Prism.highlightAll();
  }

  importCode = 'import { Component, OnInit } from \'@angular/core\';\nimport { CommonModule } from \'@angular/common\';\nimport { FormsModule, ReactiveFormsModule } from \'@angular/forms\';\n\n// Importaciones de ngx-data-visualizer\nimport {\n  ChartDirective,\n  TableDirective,\n  MultipleChartDirective,\n  Dataset,\n  Dimension,\n  Item,\n  RowData,\n  ChartConfigurationOptions,\n  PivotConfiguration,\n  Filters,\n  Goal,\n  Series,\n  ThemeService\n} from \'ngx-data-visualizer\';\n\n@Component({selector: \'app-example\',\n  standalone: true,\n  imports: [\n    CommonModule,\n    ReactiveFormsModule,\n    FormsModule,\n    ChartDirective,\n    TableDirective,\n    MultipleChartDirective\n  ],\n  templateUrl: \'./example.component.html\',\n  styleUrl: \'./example.component.scss\'\n})\nexport class ExampleComponent implements OnInit {\n  // ... tu implementación\n}';

  datasetStructureCode = 'interface Dataset {\n  dimensions: Dimension[];\n  rowData: RowData[];\n  enableRollUp?: boolean;\n  id?: number;\n}\n\ninterface Dimension {\n  id: number;\n  name: string;\n  nameView: string;\n  type: number;\n  selected: boolean;\n  items: Item[];\n}\n\ninterface Item {\n  id: number;\n  name: string;\n  selected: boolean;\n  color?: string;\n  order?: number;\n}\n\ninterface RowData {\n  [key: string]: any;\n  value: number;\n}';

  datasetInitializationCode = 'const dimensions: Dimension[] = [\n  {\n    id: 1,\n    name: \'region\',\n    nameView: \'Región\',\n    type: 3,\n    selected: true,\n    items: [\n      { id: 1, name: \'Norte\', selected: true },\n      { id: 2, name: \'Sur\', selected: true }\n    ]\n  },\n  {\n    id: 2,\n    name: \'year\',\n    nameView: \'Año\',\n    type: 0,\n    selected: true,\n    items: [\n      { id: 1, name: \'2023\', selected: true }\n    ]\n  }\n];\n\nconst rowData: RowData[] = [\n  { region: \'Norte\', year: 2023, valor: 100 },\n  { region: \'Sur\', year: 2023, valor: 150 },\n  { region: \'Norte\', year: 2024, valor: 100 },\n  { region: \'Sur\', year: 2024, valor: 150 }\n];\n\nconst dataset = new Dataset({\n  dimensions,\n  rowData,\n  enableRollUp: true,\n  id: 1\n});';

  applyFiltersCode = '// Configurar filtros\nconst filters: Filters = {\n  filter: [],\n  rollUp: []\n};\n\n// Obtener dimensiones para rollUp (ejemplo: agrupar por dimensiones no seleccionadas)\nfilters.rollUp = dataset.dimensions\n  .filter(dimension => !dimension.selected)\n  .map(dimension => dimension.nameView);\n\n// Configurar filtros por dimensión (ejemplo: filtrar por items seleccionados)\nfilters.filter = dataset.dimensions.map(dimension => ({\n  name: dimension.nameView,\n  items: dimension.items\n    .filter(item => item.selected)\n    .map(item => item.name)\n}));\n\n// Aplicar filtros al dataset\ndataset.applyFilters(filters);';

  clearFiltersCode = '// Resetear selección de dimensiones e items a su estado original\ndataset.dimensions.forEach((dimension: Dimension) => {\n  dimension.selected = true; // O el estado por defecto que desees\n  dimension.items.forEach((item: Item) => (item.selected = true));\n});\n\n// Aplicar filtros vacíos para resetear el dataset\ndataset.applyFilters(new Filters());';

  chartOptionsCode = 'const chartOptions: ChartConfigurationOptions = {\n  type: \'column\', // \'column\', \'line\', \'pie\', etc.\n  title: \'Ventas por Categoría\',\n  stacked: \'total\', // o null\n  xAxis: {\n    title: \'Año\',\n    rotateLabels: 45,\n    firstLevel: 0,\n    secondLevel: null\n  },\n  yAxis: {\n    title: \'Ventas\',\n    max: null\n  },\n  tooltip: {\n    shared: true,\n    decimals: 2,\n    suffix: \'€\',\n    format: null,\n    showTotal: true\n  },\n  legends: {\n    enabled: true,\n    show: true,\n    position: \'bottom\'\n  },\n  navigator: {\n    show: false,\n    start: null,\n    end: null\n  },\n  colors: [\'#FF5733\', \'#33FF57\'],\n  width: null,\n  height: \'400px\',\n  filterLastYear: false,\n  showYearsLegend: false,\n  toPercent: false,\n  measureUnit: \'€\',\n  isPreview: false,\n  disableAutoUpdate: false\n};';

  chartHtmlCode = '<div libChart [dataset]="myDataset" [options]="chartOptions"></div>';

  pivotConfigCode = 'const pivotConfig: PivotConfiguration = {\n  digitsAfterDecimal: 2,\n  sorters: [],\n  totalRow: true,\n  totalCol: true,\n  cols: [\'region\'],\n  rows: [\'product\'],\n  suffix: \' units\'\n};';

  tableHtmlCode = '<div libTable [dataset]="myTableDataset" [options]="pivotConfig"></div>';
}