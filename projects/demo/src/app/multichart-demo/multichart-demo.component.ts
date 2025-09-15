import { CommonModule } from "@angular/common";
import {
  Component,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { MatButtonModule } from "@angular/material/button";
import {
  Dataset,
  Dimension,
  MultipleChartDirective,
  ChartOptions,
  ThemeService,
  FiltersConfig,
} from "ngx-data-visualizer";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import dashDimensions from "../../assets/data/dash-dimensions.json";
import exampleData from "../../assets/data/example-data-2.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Prism: any; // Declara Prism para que TypeScript lo reconozca

@Component({
  selector: "app-multichart-demo",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MultipleChartDirective,
    MatTabsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: "./multichart-demo.component.html",
  styleUrls: ["./multichart-demo.component.scss"],
})
export class MultichartDemoComponent implements AfterViewInit {
  // Dataset 1: Datos de ejemplo con dimensiones del dashboard
  dataset1 = new Dataset({
    rowData: exampleData,
    id: 1,
    dimensions: dashDimensions as Dimension[],
    enableRollUp: true,
  });

  // Dataset 1 con filtros aplicados para el ejemplo 2
  dataset1Rolled = new Dataset({
    rowData: exampleData,
    id: 1,
    dimensions: dashDimensions as Dimension[],
    enableRollUp: true,
  });

  filters: FiltersConfig = {
    rollUp: ["Sexo"],
    filter: [],
  };

  // Configuración 1: Múltiples gráficos de columnas por año
  multichartConfig1: ChartOptions = {
    type: "column",
    title: "Distribución por Año",
    stacked: "Sexo",
    xAxis: {
      title: "Condición",
      rotateLabels: 0,
      firstLevel: 117, // Condición
      secondLevel: null,
    },
    yAxis: {
      title: "Cantidad de Estudiantes",
      max: null,
    },
    tooltip: {
      shared: false,
      decimals: 0,
      suffix: null,
      format: null,
      showTotal: false,
    },
    legends: {
      enabled: true,
      show: true,
      position: "bottom",
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ["#1976d2", "#388e3c"],
    height: null,
    width: null,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "estudiantes",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 2: Múltiples gráficos de líneas por sector
  multichartConfig2: ChartOptions = {
    type: "line",
    title: "Evolución Temporal",
    stacked: null,
    xAxis: {
      title: "Año",
      rotateLabels: null,
      firstLevel: 0, // Año
      secondLevel: null,
    },
    yAxis: {
      title: "Cantidad",
      max: null,
    },
    tooltip: {
      shared: true,
      decimals: 0,
      suffix: null,
      format: null,
      showTotal: true,
    },
    legends: {
      enabled: true,
      show: true,
      position: "right",
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ["#2196f3", "#4caf50", "#ff9800"],
    width: null,
    height: null,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "unidades",
    isPreview: false,
    disableAutoUpdate: false,
  };

  @ViewChild("multichartInteractive", { read: MultipleChartDirective })
  multiChart!: MultipleChartDirective;

  // Variables para funcionalidad interactiva
  selectedDimensionId: number = 0; // Año por defecto
  selectedDimension: Dimension = this.dataset1.dimensions[3]; // Año por defecto

  // Dimensiones disponibles para el selector (solo las que tienen enableMulti)
  availableDimensions: Dimension[] = [];

  constructor(
    private readonly themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    this.dataset1Rolled.applyFilters(this.filters);
    this.initializeAvailableDimensions();
  }

  private initializeAvailableDimensions(): void {
    // Filtrar dimensiones que tienen más de un elemento (para que tenga sentido crear múltiples gráficos)
    this.availableDimensions = this.dataset1.dimensions.filter(
      (dim) => dim.items && dim.items.length > 1,
    );

    // Establecer la dimensión inicial
    this.selectedDimension =
      this.dataset1.dimensions.find(
        (dim) => dim.id === this.selectedDimensionId,
      ) || this.dataset1.dimensions[3];
  }

  // Función para cambiar la dimensión seleccionada
  onDimensionChange(dimensionId: number): void {
    this.selectedDimensionId = dimensionId;
    const newDimension = this.dataset1.dimensions.find(
      (dim) => dim.id === dimensionId,
    );
    if (newDimension) {
      this.selectedDimension = newDimension;
    }
  }

  // Documentación real de MultipleChartDirective
  multichartOptionsDocumentation = `/**
 * La directiva libMultipleChart genera múltiples gráficos automáticamente
 * basándose en los elementos seleccionados de una dimensión específica.
 *
 * COMPORTAMIENTOS AUTOMÁTICOS:
 * - Cada ítem con 'selected: true' en la dimensión genera un gráfico independiente
 * - Los datos se filtran automáticamente por cada ítem de la dimensión
 * - Cada gráfico recibe el nombre del ítem como título automáticamente
 * - Las leyendas se ocultan automáticamente (legends.show = false)
 * - La MISMA configuración ChartOptions se aplica a TODOS los gráficos
 *
 * ENTRADAS REQUERIDAS:
 * - [dataset]: Dataset con los datos a visualizar
 * - [options]: ChartOptions estándar (igual que libChart)
 * - [splitDimension]: Dimension por la cual dividir los gráficos
 *
 * CONFIGURACIÓN DE LA DIMENSIÓN:
 * La dimensión debe tener ítems con 'selected: true' para generar gráficos.
 * No se requiere ninguna propiedad especial adicional.
 */

interface Dimension {
  id: number;
  name: string;
  nameView: string;
  items: Item[];
  type?: number;
  selected?: boolean;
}

interface Item {
  id: number;
  name: string;
  color?: string;
  order?: number;
  selected: boolean; // ¡IMPORTANTE! Solo los ítems con selected: true generan gráficos
}`;

  // Código TypeScript para mostrar en las tabs
  example1TypeScript = `// Dataset con datos de ejemplo y dimensiones
dataset1 = new Dataset({
  rowData: exampleData,
  id: 1,
  dimensions: dashDimensions as Dimension[],
  enableRollUp: true,
});

// Configuración: Múltiples gráficos de columnas por año
multichartConfig1: ChartOptions = {
  type: "column",
  title: "Distribución por Año",
  stacked: "Sexo",
  xAxis: {
    title: "Condición",
    rotateLabels: 0,
    firstLevel: 117, // Condición
    secondLevel: null,
  },
  yAxis: {
    title: "Cantidad de Estudiantes",
    max: null,
  },
  tooltip: {
    shared: false,
    decimals: 0,
    suffix: null,
    format: null,
    showTotal: false,
  },
  legends: {
    enabled: true,
    show: true,
    position: "bottom",
  },
  navigator: {
    show: false,
    start: null,
    end: null,
  },
  colors: ["#1976d2", "#388e3c"],
  width: null,
  height: 300,
  filterLastYear: false,
  showYearsLegend: false,
  toPercent: false,
  measureUnit: "estudiantes",
  isPreview: false,
  disableAutoUpdate: false,
};`;

  example2TypeScript = `// Configuración: Múltiples gráficos de líneas por sector

  dataset1Rolled = new Dataset({
    rowData: exampleData,
    id: 1,
    dimensions: dashDimensions as Dimension[],
    enableRollUp: true,
  });

  filters: Filters = {
    rollUp: ["Sexo"],
    filter: [],
  };

  this.dataset1Rolled.applyFilters(this.filters);

  multichartConfig2: ChartOptions = {
    type: "line",
    title: "Evolución Temporal",
    stacked: null,
    xAxis: {
      title: "Año",
      rotateLabels: null,
      firstLevel: 0, // Año
      secondLevel: null,
    },
    yAxis: {
      title: "Cantidad",
      max: null,
    },
    tooltip: {
      shared: true,
      decimals: 0,
      suffix: null,
      format: null,
      showTotal: true,
    },
    legends: {
      enabled: true,
      show: true,
      position: "right",
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ["#2196f3", "#4caf50", "#ff9800"],
    width: null,
    height: 320,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "unidades",
    isPreview: false,
    disableAutoUpdate: false,
  };`;

  example3TypeScript = `// Variables para funcionalidad interactiva
selectedDimensionId: number = 0; // Año por defecto
selectedDimension: Dimension = this.dataset1.dimensions[3]; // Año por defecto

// Dimensiones disponibles para el selector (solo las que tienen enableMulti)
availableDimensions: Dimension[] = [];

// Inicialización de dimensiones disponibles
private initializeAvailableDimensions(): void {
  // Filtrar dimensiones que tienen más de un elemento (para que tenga sentido crear múltiples gráficos)
  this.availableDimensions = this.dataset1.dimensions.filter(
    dim => dim.items && dim.items.length > 1
  );

  // Establecer la dimensión inicial
  this.selectedDimension = this.dataset1.dimensions.find(dim => dim.id === this.selectedDimensionId) || this.dataset1.dimensions[3];
}

// Función para cambiar la dimensión seleccionada
onDimensionChange(dimensionId: number): void {
  this.selectedDimensionId = dimensionId;
  const newDimension = this.dataset1.dimensions.find(dim => dim.id === dimensionId);
  if (newDimension) {
    this.selectedDimension = newDimension;
  }
}

@ViewChild('multichartInteractive', { read: MultipleChartDirective })
multiChart!: MultipleChartDirective;`;

  // Código HTML para mostrar en las tabs
  example1HTML = `<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1"
    [options]="multichartConfig1"
    [splitDimension]="dataset1.dimensions[0]">
  </libMultipleChart>
</div>`;

  example2HTML = `<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1Rolled"
    [options]="multichartConfig2"
    [splitDimension]="dataset1.dimensions[2]">
  </libMultipleChart>
</div>`;

  example3HTML = `<div class="interactive-controls">
  <mat-form-field appearance="outline" style="min-width: 200px;">
    <mat-label>Dimensión para separar gráficos</mat-label>
    <mat-select
      [value]="selectedDimensionId"
      (selectionChange)="onDimensionChange($event.value)">
      <mat-option *ngFor="let dimension of availableDimensions" [value]="dimension.id">
        {{dimension.nameView}}
      </mat-option>
    </mat-select>
  </mat-form-field>
</div>
<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1"
    [options]="multichartConfig1"
    [splitDimension]="selectedDimension"
    #multichartInteractive>
  </libMultipleChart>
</div>`;

  ngAfterViewInit(): void {
    // Timeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.highlightCode();
    }, 100);
  }

  onTabChange(): void {
    // Pequeño delay para asegurar que el contenido del tab se haya renderizado
    setTimeout(() => {
      this.highlightCode();
    }, 50);
  }

  private highlightCode(): void {
    if (typeof Prism !== "undefined") {
      // Re-procesar todos los bloques de código
      Prism.highlightAll();
    }
  }

  // Métodos de navegación
  navigateToConfiguration(): void {
    this.router.navigate(["/configuration"]);
  }

  navigateToChartDemo(): void {
    this.router.navigate(["/chart-demo"]);
  }

  navigateToTableDemo(): void {
    this.router.navigate(["/table-demo"]);
  }
}
