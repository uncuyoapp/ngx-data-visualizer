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
} from "ngx-data-visualizer";
import dashDimensions from "../../assets/data/dash-dimensions.json";
import exampleData2 from "../../assets/data/data.json";
import dimensions from "../../assets/data/dimensions.json";
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

  // Dataset 2: Datos de ejemplo con dimensiones de departamentos
  dataset2 = new Dataset({
    rowData: exampleData2,
    id: 2,
    dimensions: dimensions as Dimension[],
    enableRollUp: true,
  });

  // Configuración 1: Múltiples gráficos de columnas por año
  multichartConfig1: ChartOptions = {
    type: "column",
    title: "Distribución por Año",
    stacked: null,
    xAxis: {
      title: "Condición",
      rotateLabels: -45,
      firstLevel: 1, // Condición
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
    colors: ["#1976d2", "#388e3c", "#f57c00", "#d32f2f"],
    width: null,
    height: 300,
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
    colors: ["#2196f3", "#4caf50", "#ff9800", "#e91e63"],
    width: null,
    height: 320,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "unidades",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 3: Múltiples gráficos circulares por condición
  multichartConfig3: ChartOptions = {
    type: "pie",
    title: "Distribución por Sector",
    stacked: null,
    xAxis: {
      title: "",
      rotateLabels: null,
      firstLevel: 2, // Sector de gestión
      secondLevel: null,
    },
    yAxis: {
      title: "",
      max: null,
    },
    tooltip: {
      shared: false,
      decimals: 1,
      suffix: "%",
      format: null,
      showTotal: false,
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
    colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
    width: null,
    height: 280,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: true,
    measureUnit: "porcentaje",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 4: Múltiples gráficos apilados por sexo
  multichartConfig4: ChartOptions = {
    type: "column",
    title: "Distribución Apilada",
    stacked: "all",
    xAxis: {
      title: "Año",
      rotateLabels: null,
      firstLevel: 0, // Año
      secondLevel: null,
    },
    yAxis: {
      title: "Total Acumulado",
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
      position: "bottom",
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ["#9c27b0", "#673ab7", "#3f51b5", "#2196f3"],
    width: null,
    height: 300,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "total",
    isPreview: false,
    disableAutoUpdate: false,
  };

  @ViewChild("multichartInteractive", { read: MultipleChartDirective })
  multiChart!: MultipleChartDirective;

  constructor(
    private readonly themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // Documentación de MultipleChartDirective
  multichartOptionsDocumentation = `/**
 * La directiva libMultipleChart permite crear múltiples gráficos simultáneamente
 * utilizando una dimensión específica como criterio de separación.
 *
 * Configuración especial para múltiples gráficos:
 * - La dimensión utilizada para separar los gráficos debe tener enableMulti: true
 * - Cada gráfico individual utiliza la misma configuración ChartOptions
 * - Los datos se filtran automáticamente por cada valor de la dimensión seleccionada
 */

interface MultiChartOptions extends ChartOptions {
  /** Dimensión que se utilizará para crear múltiples gráficos */
  separationDimension?: string;
  /** Número máximo de gráficos por fila en la visualización */
  chartsPerRow?: number;
  /** Configuración del espaciado entre gráficos */
  spacing?: {
    horizontal: number;
    vertical: number;
  };
}

/**
 * Ejemplo de configuración de dimensión para múltiples gráficos:
 */
interface Dimension {
  id: number;
  name: string;
  nameView: string;
  items: Item[];
  type?: number;
  enableMulti?: boolean; // ¡IMPORTANTE! Debe estar en true para usar con libMultipleChart
  selected?: boolean;
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
  type: 'column',
  title: 'Distribución por Año',
  stacked: null,
  xAxis: {
    title: 'Condición',
    rotateLabels: -45,
    firstLevel: 1, // Condición
    secondLevel: null
  },
  yAxis: {
    title: 'Cantidad de Estudiantes',
    max: null
  },
  tooltip: {
    shared: false,
    decimals: 0,
    suffix: null,
    format: null,
    showTotal: false
  },
  legends: {
    enabled: true,
    show: true,
    position: 'bottom'
  },
  colors: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f'],
  height: 300,
  measureUnit: 'estudiantes'
};`;

  example2TypeScript = `// Configuración: Múltiples gráficos de líneas por sector
multichartConfig2: ChartOptions = {
  type: 'line',
  title: 'Evolución Temporal',
  stacked: null,
  xAxis: {
    title: 'Año',
    firstLevel: 0, // Año
    secondLevel: null
  },
  yAxis: {
    title: 'Cantidad',
    max: null
  },
  tooltip: {
    shared: true,
    decimals: 0,
    showTotal: true
  },
  legends: {
    enabled: true,
    show: true,
    position: 'right'
  },
  colors: ['#2196f3', '#4caf50', '#ff9800', '#e91e63'],
  height: 320,
  measureUnit: 'unidades'
};`;

  example3TypeScript = `// Configuración: Múltiples gráficos circulares por condición
multichartConfig3: ChartOptions = {
  type: 'pie',
  title: 'Distribución por Sector',
  stacked: null,
  xAxis: {
    title: '',
    firstLevel: 2, // Sector de gestión
    secondLevel: null
  },
  tooltip: {
    shared: false,
    decimals: 1,
    suffix: '%'
  },
  legends: {
    enabled: true,
    show: true,
    position: 'right'
  },
  colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  height: 280,
  toPercent: true,
  measureUnit: 'porcentaje'
};`;

  example4TypeScript = `// Configuración: Múltiples gráficos apilados por sexo
multichartConfig4: ChartOptions = {
  type: 'column',
  title: 'Distribución Apilada',
  stacked: 'all',
  xAxis: {
    title: 'Año',
    firstLevel: 0, // Año
    secondLevel: null
  },
  yAxis: {
    title: 'Total Acumulado',
    max: null
  },
  tooltip: {
    shared: true,
    decimals: 0,
    showTotal: true
  },
  legends: {
    enabled: true,
    show: true,
    position: 'bottom'
  },
  colors: ['#9c27b0', '#673ab7', '#3f51b5', '#2196f3'],
  height: 300,
  measureUnit: 'total'
};`;

  example5TypeScript = `// Métodos interactivos para múltiples gráficos
@ViewChild('multichartInteractive', { read: MultipleChartDirective })
multiChart!: MultipleChartDirective;

// Exportar todos los gráficos como imagen
exportAllChartsAsJPG(): void {
  console.log('Exportando todos los gráficos como JPG...');
}

// Exportar todos los gráficos como SVG
exportAllChartsAsSVG(): void {
  console.log('Exportando todos los gráficos como SVG...');
}

// Cambiar tema de todos los gráficos
changeTheme(theme: string): void {
  // Nota: El ThemeService está diseñado específicamente para tablas
  // Para múltiples gráficos, se podría implementar un servicio similar
  console.log('Cambio de tema solicitado: ' + theme);
}

// Actualizar configuración de todos los gráficos
updateAllCharts(newConfig: Partial<ChartOptions>): void {
  console.log('Actualizando configuración de todos los gráficos...');
}`;

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
    [dataset]="dataset1"
    [options]="multichartConfig2"
    [splitDimension]="dataset1.dimensions[2]">
  </libMultipleChart>
</div>`;

  example3HTML = `<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1"
    [options]="multichartConfig3"
    [splitDimension]="dataset1.dimensions[1]">
  </libMultipleChart>
</div>`;

  example4HTML = `<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1"
    [options]="multichartConfig4"
    [splitDimension]="dataset1.dimensions[3]">
  </libMultipleChart>
</div>`;

  example5HTML = `<div class="interactive-buttons">
  <button mat-raised-button color="primary" (click)="exportAllChartsAsJPG()">
    Exportar Todos como JPG
  </button>
  <button mat-raised-button color="accent" (click)="exportAllChartsAsSVG()">
    Exportar Todos como SVG
  </button>
  <button mat-raised-button color="warn" (click)="changeTheme('material')">
    Cambiar Tema (Demo)
  </button>
</div>
<div class="multichart-container">
  <libMultipleChart
    [dataset]="dataset1"
    [options]="multichartConfig4"
    [splitDimension]="dataset1.dimensions[3]"
    #multichartInteractive>
  </libMultipleChart>
</div>`;

  example6HTML = `
/**
 * Configuración avanzada para múltiples gráficos
 */
interface AdvancedMultiChartConfig {
  /** Configuración base del gráfico (hereda de ChartOptions) */
  baseConfig: ChartOptions;

  /** Configuraciones específicas por dimensión */
  dimensionConfigs?: {
    [dimensionName: string]: Partial<ChartOptions>;
  };

  /** Layout de los múltiples gráficos */
  layout: {
    /** Número de columnas en el grid */
    columns: number;
    /** Espaciado entre gráficos */
    spacing: {
      horizontal: number;
      vertical: number;
    };
    /** Configuración responsiva */
    responsive: {
      breakpoint: number;
      columns: number;
    }[];
  };

  /** Configuración de sincronización entre gráficos */
  synchronization?: {
    /** Sincronizar escalas del eje Y */
    syncYAxis: boolean;
    /** Sincronizar zoom */
    syncZoom: boolean;
    /** Sincronizar selección */
    syncSelection: boolean;
  };
}`;

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

  // Métodos interactivos para múltiples gráficos
  exportAllChartsAsJPG(): void {
    if (this.multiChart) {
      // Método hipotético para exportar todos los gráficos
      console.log("Exportando todos los gráficos como JPG...");
    }
  }

  exportAllChartsAsSVG(): void {
    if (this.multiChart) {
      // Método hipotético para exportar todos los gráficos
      console.log("Exportando todos los gráficos como SVG...");
    }
  }

  changeTheme(theme: "default" | "material" | "bootstrap"): void {
    // Nota: El ThemeService está diseñado específicamente para tablas
    // Para múltiples gráficos, se podría implementar un servicio similar
    console.log("Cambio de tema solicitado: " + theme);
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
