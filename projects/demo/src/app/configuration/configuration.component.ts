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

  viewChildCode = `@ViewChild(ChartDirective) chartDirective: ChartDirective;`;

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
  Goal, // interface para definir una meta en un gráfico
  TableSorter, // interface para ordenamiento en tablas
  FiltersConfig // interface para aplicar filtros a los datos
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
 * Clase que representa un conjunto de datos para visualización.
 * Actúa como una fachada que simplifica la interacción con el DataProvider.
 */
class Dataset {
  /** Identificador opcional para el conjunto de datos. */
  public readonly id?: number;
  /** Array de objetos Dimension que describen los datos. */
  public readonly dimensions: Dimension[];
  /** Flag para habilitar o deshabilitar la funcionalidad de roll-up. */
  public readonly enableRollUp: boolean;
  /** Los datos crudos (sin procesar) del conjunto de datos. */
  public readonly rowData: RowData[];
  /** (Avanzado) Instancia del motor de procesamiento de datos subyacente. */
  public readonly dataProvider: DataProvider;
  /** Un 'Subject' de RxJS que emite 'true' cuando los datos se actualizan. */
  public readonly dataUpdated = new Subject<boolean>();

  /**
   * Aplica una configuración de filtros y/o roll-up al DataProvider.
   * @param config - Objeto con la configuración de filtros a aplicar.
   */
  public applyFilters(config: FiltersConfig): void { /* ... */ }

  /**
   * Devuelve una copia de los datos crudos originales.
   * @returns Un array de RowData.
   */
  public getRawData(): RowData[] { /* ... */ }

  /**
   * Devuelve los datos procesados actuales del DataProvider (después de filtros y roll-up).
   * @returns Un array de RowData procesado.
   */
  public getCurrentData(): RowData[] { /* ... */ }

  /**
   * Devuelve una copia de todas las dimensiones definidas en el Dataset.
   * @returns Un array de Dimension.
   */
  public getAllDimensions(): Dimension[] { /* ... */ }

  /**
   * Devuelve las dimensiones que están activas (no agrupadas por rollUp).
   * @returns Un array de Dimension activas.
   */
  public getActiveDimensions(): Dimension[] { /* ... */ }

  /**
   * Obtiene la clave de datos ('key') asociada a un ID de dimensión.
   * @param dimensionId - El ID de la dimensión.
   * @returns La 'key' (string) correspondiente o undefined.
   */
  public getDimensionKey(dimensionId: number): string | undefined { /* ... */ }

  /**
   * Obtiene todos los valores únicos para una dimensión específica.
   * @param dimensionId - El ID de la dimensión a consultar.
   * @returns Un array de valores únicos para la dimensión.
   */
  public getDimensionValues(dimensionId: number): (string | number)[] { /* ... */ }
}

/**
 * Interfaz que representa una dimensión en el conjunto de datos
 */
interface Dimension {
  id: number;
  name: string;
  nameView: string;
  items: Item[];
  type?: number;
  enableMulti?: boolean;
  selected?: boolean;
}

/**
 * Interfaz que representa un ítem dentro de una dimensión
 */
interface Item {
  id: number;
  name: string;
  color?: string;
  order?: number;
  selected: boolean;
}

/**
 * Interfaz base que representa una fila de datos genérica.
 */
interface RowData {
  [key: string]: string | number | null;
}

/**
 * Configuración para un filtro de dimensión. Permite usar el id o el nombre de la dimensión.
 */
interface DimensionFilterConfig {
  name: string | number;
  items: (string | number)[];
}

/**
 * Objeto para la configuración de filtros y agrupaciones (roll-up).
 */
interface FiltersConfig {
  rollUp?: (string | number)[];
  filter?: DimensionFilterConfig[];
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

  applyFiltersCode = `// Crear un objeto de configuración de filtros
const filtersConfig: FiltersConfig = {
  // 1. Agrupar (rollUp) por la dimensión con id 1 ('Región').
  //    Esto colapsará la dimensión 'Región', sumando sus valores.
  rollUp: [1],

  // 2. Filtrar la dimensión con id 2 ('Año') para mostrar solo el item '2024'.
  filter: [
    {
      name: 2, // ID de la dimensión 'Año'
      items: ['2024']
    }
  ]
};

// Aplicar los filtros al dataset.
// El componente visual se actualizará automáticamente.
dataset.applyFilters(filtersConfig);`;

  clearFiltersCode = `// Para limpiar todos los filtros y agrupaciones,
// simplemente llama a applyFilters con un objeto vacío.
dataset.applyFilters({});`;
}
