import { CommonModule } from "@angular/common";
import { AfterViewInit, Component } from "@angular/core";
import { Router } from "@angular/router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Prism: any; // Declara Prism para que TypeScript lo reconozca

@Component({
  selector: "app-configuration",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./configuration.component.html",
  styleUrl: "./configuration.component.scss",
})
export class ConfigurationComponent implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit() {
    // Usamos Prism para formatear las secciones de código para que se vean bonitas.
    Prism.highlightAll();
  }

  navigateToChartDemo(): void {
    this.router.navigate(["/chart-demo"]);
  }

  navigateToTableDemo(): void {
    this.router.navigate(["/table-demo"]);
  }

  navigateToMultichartDemo(): void {
    this.router.navigate(["/multichart-demo"]);
  }

  importCode = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Importaciones de ngx-data-visualizer
import {
  ChartDirective, // directiva para renderizado de gráficos
  TableDirective, // directiva para renderizado de tablas
  MultipleChartDirective, // directiva para renderizado de múltiples gráficos
  Dataset, // clase para definicion del conjunto de datos
  Dimension, // interface para las dimensiones de los datos
  Item, // interface para los items de las dimensiones
  RowData, // interface de fila de datos
  ChartOptions, // opciones de configuración de gráfico
  TableOptions, // opciones de configuración de tablas
  Filters // interface para aplicar filtrado a los datos
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
 class ExampleComponent implements OnInit {
  // ... tu implementación
}`;

  datasetStructureCode = `
/**
 * Clase que representa un conjunto de datos para visualización
 * Proporciona métodos para manejar y filtrar datos
 */
 class Dataset {
  /** Identificador único opcional del dataset */
  public readonly id?: number;
  /** Dimensiones disponibles en el dataset */
  public readonly dimensions: Dimension[];
  /** Indica si está habilitada la agrupación (roll up) de datos */
  public readonly enableRollUp: boolean;
  /** Datos en formato de filas */
  public readonly rowData: RowData[];
  /** Proveedor de datos para operaciones de filtrado y consulta */
  public readonly dataProvider: DataProvider;
  /** Subject que emite cuando los datos son actualizados */
  public readonly dataUpdated = new Subject<boolean>();
  /** Serie temporal asociada al dataset (opcional) */
  private readonly timeSeries?: TimeSeries;

  /**
   * Aplica filtros al conjunto de datos
   * @param filters - Filtros a aplicar
   * @throws {Error} Si los filtros no son válidos
   * @example
   * dataset.applyFilters({
   *   rollUp: ['categoria'],
   *   filter: [
   *     { name: 'año', items: [2023, 2024] }
   *   ]
   * });
   */
  public applyFilters(filters: Filters): void {
    this.dataProvider.filters = filters;
    this.dataUpdated.next(true);
  }

  /**
   * Obtiene los datos actuales del dataset
   * @returns Una copia de los datos actuales
   * @example
   * const currentData = dataset.getData();
   * console.log('Datos actuales:', currentData);
   */
  public getData(): RowData[] {
    return this.rowData.map(row => ({ ...row }));
  }

  /**
   * Obtiene las dimensiones actuales del dataset
   * @returns Una copia de las dimensiones actuales
   * @example
   * const dimensions = dataset.getDimensions();
   * console.log('Dimensiones:', dimensions.map(d => d.nameView));
   */
  public getDimensions(): Dimension[] {
    return this.dimensions.map(dim => ({ ...dim }));
  }
}

/**
 * Interfaz que representa una dimensión en el conjunto de datos
 */
 interface Dimension {
  /** Identificador único de la dimensión */
  id: number;
  /** Nombre interno de la dimensión */
  name: string;
  /** Nombre para mostrar de la dimensión */
  nameView: string;
  /** Elementos que componen la dimensión */
  items: Item[];
  /** Tipo de dimensión (opcional) */
  type?: number;
  /** Indica si la dimensión puede desagregarse en múltiples gráficos (opcional) */
  enableMulti?: boolean;
  /** Indica si la dimensión está seleccionada (opcional) */
  selected?: boolean;
}

/**
 * Interfaz que representa un ítem dentro de una dimensión
 */
 interface Item {
  /** Identificador único del ítem */
  id: number;
  /** Nombre del ítem */
  name: string;
  /** Color asociado al ítem (opcional) */
  color?: string;
  /** Orden de visualización del ítem (opcional) */
  order?: number;
  /** Indica si el ítem está seleccionado */
  selected: boolean;
}

/**
 * Interfaz base que representa una fila de datos genérica.
 * Cada clave en el objeto representa una columna y su valor puede ser de cualquier tipo DataValue.
 */
 interface RowData {
  [key: string]: DataValue;
}

/**
 * Tipo que define los valores permitidos en una fila de datos.
 * Representa todos los tipos de datos que pueden ser almacenados en una celda.
 */
 type DataValue = string | number | null;

/**
 * Clase que representa los filtros aplicables a un conjunto de datos
 */
 class Filters {
  /** Nombres de dimensiones a agrupar */
  public rollUp: string[] = [];
  /** Filtros de dimensión a aplicar */
  public filter: DimensionFilter[] = [];
}

/**
 * Interfaz que representa un filtro para una dimensión específica
 */
 interface DimensionFilter {
  /** Nombre de la dimensión a filtrar */
  name: string;
  /** Valores seleccionados para el filtro */
  items: Array<string | number>;
}
`;

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
      { id: 20, name: '2023', selected: true },
      { id: 21, name: '2024', selected: true },
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
}
