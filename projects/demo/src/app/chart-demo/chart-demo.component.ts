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
  ChartDirective,
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
  selector: "app-chart-demo",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartDirective,
    MatTabsModule,
    MatButtonModule,
  ],
  templateUrl: "./chart-demo.component.html",
  styleUrls: ["./chart-demo.component.scss"],
})
export class ChartDemoComponent implements AfterViewInit {
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

  // Configuración básica: Gráfico de columnas
  chartConfig1: ChartOptions = {
    type: "column",
    title: "Estudiantes por Año y Condición",
    stacked: null,
    xAxis: {
      title: "Año",
      rotateLabels: null,
      firstLevel: 0, // Año
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
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "estudiantes",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 2: Gráfico de líneas con múltiples series
  chartConfig2: ChartOptions = {
    type: "line",
    title: "Evolución Temporal por Sector de Gestión",
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
    height: 450,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "unidades",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 3: Gráfico de barras apiladas
  chartConfig3: ChartOptions = {
    type: "column",
    title: "Distribución por Condición (Apilado)",
    stacked: "Condición",
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
      shared: false,
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
    colors: ["#e91e63", "#9c27b0", "#673ab7", "#3f51b5"],
    width: null,
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "total",
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Configuración 4: Gráfico columnas con doble eje x
  chartConfig4: ChartOptions = {
    type: "column",
    title: "Estudiantes por año y sector",
    stacked: "all",
    xAxis: {
      title: "Año",
      rotateLabels: null,
      firstLevel: 0, // Año
      secondLevel: 54,
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
    width: null,
    height: 400,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: "total",
    isPreview: false,
    disableAutoUpdate: false,
  };

  @ViewChild("chartInteractive", { read: ChartDirective })
  chart!: ChartDirective;

  // Código TypeScript para mostrar en las tabs
  example1TypeScript = `// Dataset con datos de ejemplo y dimensiones
dataset1 = new Dataset({
  rowData: exampleData,
  id: 1,
  dimensions: dashDimensions as Dimension[],
  enableRollUp: true,
});

// Configuración básica: Gráfico de columnas
chartConfig1: ChartOptions = {
  type: 'column',
  title: 'Estudiantes por Año y Condición',
  stacked: null,
  xAxis: {
    title: 'Año',
    rotateLabels: null,
    firstLevel: 0, // Año
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
  height: 400,
  measureUnit: 'estudiantes'
};`;

  example2TypeScript = `// Configuración: Gráfico de líneas con múltiples series
chartConfig2: ChartOptions = {
  type: 'line',
  title: 'Evolución Temporal por Sector de Gestión',
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
  colors: ['#2196f3', '#4caf50', '#ff9800'],
  height: 450,
  measureUnit: 'unidades'
};`;

  example3TypeScript = `// Configuración: Gráfico de barras apiladas
chartConfig3: ChartOptions = {
  type: 'column',
  title: 'Distribución por Condición (Apilado)',
  stacked: 'condicion',
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
  colors: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
  height: 400,
  measureUnit: 'total'
};`;

  example4TypeScript = `// Configuración: Gráfico circular (pie)
chartConfig4: ChartOptions = {
  type: 'pie',
  title: 'Distribución por Sector de Gestión',
  stacked: null,
  xAxis: {
    title: '',
    firstLevel: 1, // Sector de gestión
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
  height: 400,
  toPercent: true,
  measureUnit: 'porcentaje'
};`;

  example5TypeScript = `// Métodos interactivos para el gráfico
@ViewChild('chartInteractive', { read: ChartDirective }) chart!: ChartDirective;

// Cambiar a modo porcentaje
togglePercentage(): void {
  this.chart.toPercentage();
}

// Exportar gráfico como SVG
exportAsSVG(): void {
  const svg = this.chart.export('svg');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'grafico.svg';
  link.click();
  URL.revokeObjectURL(url);
}

// Exportar gráfico como JPG
exportAsJPG(): void {
  const jpg = this.chart.export('jpg');
  const link = document.createElement('a');
  link.href = jpg;
  link.download = 'grafico.jpg';
  link.click();
}`;

  // Código HTML para mostrar en las tabs
  example1HTML = `<div class="chart-container">
  <div libChart [dataset]="dataset1" [chartOptions]="chartConfig1"></div>
</div>`;

  example2HTML = `<div class="chart-container">
  <div libChart [dataset]="dataset1" [chartOptions]="chartConfig2"></div>
</div>`;

  example3HTML = `<div class="chart-container">
  <div libChart [dataset]="dataset1" [chartOptions]="chartConfig3"></div>
</div>`;

  example4HTML = `<div class="chart-container">
  <div libChart [dataset]="dataset1" [chartOptions]="chartConfig4"></div>
</div>`;

  example5HTML = `<div class="interactive-buttons">
  <button mat-raised-button color="primary" (click)="togglePercentage()">
    Alternar Porcentaje
  </button>
  <button mat-raised-button color="accent" (click)="exportAsSVG()">
    Exportar SVG
  </button>
  <button mat-raised-button color="warn" (click)="exportAsJPG()">
    Exportar JPG
  </button>
</div>
<div class="chart-container">
  <div libChart [dataset]="dataset1" [chartOptions]="chartConfig3" #chartInteractive></div>
</div>`;

  example6HTML = `
interface ChartOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;

  /** Título del gráfico */
  title?: string;

  /** Indica si el gráfico está apilado y el nombre del grupo */
  stacked: string | null;

  /** Configuración del eje X */
  xAxis: {
    title: string,
    rotateLabels: number | null,
    firstLevel: number,
    secondLevel: number | null
  };

  /** Configuración del eje Y */
  yAxis: {
    title: string,
    max: number | null
  };

  /** Configuración del tooltip */
  tooltip: {
    shared: boolean,
    decimals: number | null,
    suffix: string | null,
    format: string | null,
    showTotal: boolean
  };

  /** Configuración de las leyendas */
  legends: {
    enabled: boolean,
    show: boolean,
    position: string
  };

  /** Array de colores personalizados */
  colors?: string[];

  /** Dimensiones del gráfico */
  width: number | null;
  height: number | string | null;

  /** Indica si los valores se muestran en porcentaje */
  toPercent: boolean;

  /** Unidad de medida para los valores */
  measureUnit: string;
}`;

  constructor(
    private readonly themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // Documentación de ChartOptions
  chartOptionsDocumentation = `/**
 * Interfaz que define las opciones de configuración para un gráfico
 */
interface ChartOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;
  /** Título del gráfico */
  title?: string;
  /** Indica si el gráfico está apilado y el valor debe corresponder al nombre de una de las dimensiones del conjunto de datos */
  stacked: string | null;
  /** Configuración del eje X */
  xAxis: {
    /** Título del eje X */
    title: string,
    /** Ángulo de rotación de las etiquetas en grados */
    rotateLabels: number | null,
    /** Nivel de agrupación primario (id de una de las dimensiones del conjunto de datos) */
    firstLevel: number,
    /** Nivel de agrupación secundario (id de una de las dimensiones del conjunto de datos) (opcional) */
    secondLevel: number | null
  },
  /** Configuración del eje Y */
  yAxis: {
    /** Título del eje Y */
    title: string,
    /** Valor máximo del eje Y */
    max: number | null
  },
  /** Configuración del tooltip */
  tooltip: {
    /** Indica si el tooltip es compartido entre series */
    shared: boolean,
    /** Número de decimales a mostrar */
    decimals: number | null,
    /** Sufijo para los valores */
    suffix: string | null,
    /** Formato personalizado para los valores */
    format: string | null,
    /** Indica si se muestra el total en el tooltip */
    showTotal: boolean
  },
  /** Configuración de las leyendas */
  legends: {
    /** Indica si las leyendas están habilitadas */
    enabled: boolean,
    /** Indica si se muestran las leyendas */
    show: boolean,
    /** Posición de las leyendas */
    position: string
  },
  /** Configuración del navegador */
  navigator: {
    /** Indica si se muestra el navegador */
    show: boolean,
    /** Valor inicial del navegador */
    start: number | null,
    /** Valor final del navegador */
    end: number | null
  },
  /** Array de colores personalizados para las series */
  colors?: string[],
  /** Ancho del gráfico */
  width: number | null,
  /** Alto del gráfico */
  height: number | string | null,
  /** Indica si se filtra el último año */
  filterLastYear: boolean,
  /** Indica si se muestra la leyenda de años */
  showYearsLegend: boolean,
  /** Indica si los valores se muestran en porcentaje */
  toPercent: boolean,
  /** Unidad de medida para los valores */
  measureUnit: string;
  /** Indica si el gráfico está en modo vista previa */
  isPreview: boolean;
  /** Indica si se deshabilita la actualización automática */
  disableAutoUpdate: boolean;
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

  // Métodos interactivos para el gráfico
  togglePercentage(): void {
    this.chart.toPercentage();
  }

  // Métodos de navegación
  navigateToConfiguration(): void {
    this.router.navigate(["/configuration"]);
  }

  navigateToTableDemo(): void {
    this.router.navigate(["/table-demo"]);
  }

  navigateToMultichartDemo(): void {
    this.router.navigate(["/multichart-demo"]);
  }
}
