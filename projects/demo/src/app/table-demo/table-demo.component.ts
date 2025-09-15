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
  TableDirective,
  TableOptions,
  ThemeService,
} from "ngx-data-visualizer";
import dashDimensions from "../../assets/data/dash-dimensions.json";
import exampleData2 from "../../assets/data/data.json";
import dimensions from "../../assets/data/dimensions.json";
import exampleData from "../../assets/data/example-data-2.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Prism: any; // Declara Prism para que TypeScript lo reconozca

@Component({
  selector: "app-table-demo",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableDirective,
    MatTabsModule,
    MatButtonModule,
  ],
  templateUrl: "./table-demo.component.html",
  styleUrls: ["./table-demo.component.scss"],
})
export class TableDemoComponent implements AfterViewInit {
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

  // Configuración básica con una columna y múltiples filas
  tableConfig1: TableOptions = {
    cols: ["Año"],
    rows: ["Condición", "Sexo", "Sector de gestión"],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
  };

  // Ejemplo 2: Configuración con múltiples columnas y una fila. Agregando sexo.
  tableConfig2: TableOptions = {
    cols: ["Sector de gestión", "Condición"],
    rows: ["Año"],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
  };

  // Configuración para ejemplo de porcentajes
  tableConfig4: TableOptions = {
    cols: ["Año"],
    rows: ["Condición", "Sexo"],
    digitsAfterDecimal: 2,
    sorters: [],
    totalRow: true,
    totalCol: true,
    valueDisplay: "nominal", // Valor inicial
  };

  // Estado actual del modo de visualización
  currentValueDisplay:
    | "nominal"
    | "percentOfTotal"
    | "percentOfRow"
    | "percentOfColumn" = "nominal";

  // Ejemplo 3: Configuración con ordenamiento personalizado
  tableConfig3: TableOptions = {
    cols: ["Sector de gestión", "Condición"],
    rows: ["Año"],
    digitsAfterDecimal: 0,
    totalRow: true,
    totalCol: true,
    sorters: [
      {
        name: 117, // Usando el ID de la dimensión 'Condición'
        items: [
          { name: "Nuevo inscripto", order: 0 },
          { name: "Estudiante", order: 1 },
          { name: "Egresado", order: 2 },
        ],
      },
    ],
  };

  @ViewChild("tableTheme", { read: TableDirective }) table!: TableDirective;
  @ViewChild("tablePercentages", { read: TableDirective })
  tablePercentages!: TableDirective;

  // Código TypeScript para mostrar en las tabs
  example1TypeScript = `// Dataset con datos de ejemplo y dimensiones
dataset1 = new Dataset({
  rowData: exampleData,
  id: 1,
  dimensions: dashDimensions as Dimension[],
  enableRollUp: true,
});

// Configuración básica con una columna y múltiples filas
tableConfig1: TableOptions = {
  cols: ["Año"],
  rows: ["Condición", "Sexo", "Sector de gestión"],
  digitsAfterDecimal: 0,
  sorters: [],
  totalRow: true,
  totalCol: true,
};`;

  example2TypeScript = `// Configuración con múltiples columnas y una fila
tableConfig2: TableOptions = {
  cols: ['Sector de gestión', 'Condición'],
  rows: ['Año'],
  digitsAfterDecimal: 0,
  sorters: [],
  totalRow: true,
  totalCol: true,
};`;

  example3TypeScript = `// Configuración con ordenamiento personalizado
tableConfig3: TableOptions = {
  cols: ['Sector de gestión', 'Condición'],
  rows: ['Año'],
  digitsAfterDecimal: 0,
  totalRow: true,
  totalCol: true,
  sorters: [
    {
      name: 117, // Usando el ID de la dimensión 'Condición'
      items: [
        { name: 'Nuevo inscripto', order: 0 },
        { name: 'Estudiante', order: 1 },
        { name: 'Egresado', order: 2 },
      ],
    },
  ],
};`;

  example4TypeScript = `// Configuración para visualización de porcentajes
tableConfig4: TableOptions = {
  cols: ["Año"],
  rows: ["Condición", "Sexo"],
  digitsAfterDecimal: 2,
  sorters: [],
  totalRow: true,
  totalCol: true,
  valueDisplay: "nominal", // Valor inicial
};

// Estado actual del modo de visualización
currentValueDisplay:
  | "nominal"
  | "percentOfTotal"
  | "percentOfRow"
  | "percentOfColumn" = "nominal";

@ViewChild("tablePercentages", { read: TableDirective })
tablePercentages!: TableDirective;

// Métodos para cambiar el modo de visualización de porcentajes
setNominalView(): void {
  this.currentValueDisplay = "nominal";
  this.tablePercentages.setValueDisplay("nominal");
}

setPercentOfTotalView(): void {
  this.currentValueDisplay = "percentOfTotal";
  this.tablePercentages.setValueDisplay("percentOfTotal");
}

setPercentOfRowView(): void {
  this.currentValueDisplay = "percentOfRow";
  this.tablePercentages.setValueDisplay("percentOfRow");
}

setPercentOfColumnView(): void {
  this.currentValueDisplay = "percentOfColumn";
  this.tablePercentages.setValueDisplay("percentOfColumn");
}`;

  example6TypeScript = `// Métodos para cambiar el tema de la tabla
@ViewChild('tableTheme', { read: TableDirective }) table!: TableDirective;

constructor(private readonly themeService: ThemeService) {}

setDefaultTheme(): void {
  this.themeService.setTheme('default', this.table);
}

setMaterialTheme(): void {
  this.themeService.setTheme('material', this.table);
}

setBootstrapTheme(): void {
  this.themeService.setTheme('bootstrap', this.table);
}

// Ejemplo de personalización parcial del tema
updateThemeWithCustomColors(): void {
  this.themeService.updateTheme(
    {
      tableDataBg: '#d3d3d3',
      tableLabelBg: '#0ec244',
    },
    this.table,
  );
}`;

  // Código HTML para mostrar en las tabs
  example1HTML = `<div class="table-container" style="height: 500px;">
  <libTable [dataset]="dataset1" [tableOptions]="tableConfig1"></libTable>
</div>`;

  example2HTML = `<div class="table-container">
  <libTable [dataset]="dataset1" [tableOptions]="tableConfig2"></libTable>
</div>`;

  example3HTML = `<div class="table-container">
  <libTable [dataset]="dataset1" [tableOptions]="tableConfig3"></libTable>
</div>`;

  example4HTML = `<div class="percentage-buttons">
  <button
    mat-raised-button
    [color]="currentValueDisplay === 'nominal' ? 'primary' : 'basic'"
    (click)="setNominalView()">
    Valores Nominales
  </button>
  <button
    mat-raised-button
    [color]="currentValueDisplay === 'percentOfTotal' ? 'primary' : 'basic'"
    (click)="setPercentOfTotalView()">
    % del Total
  </button>
  <button
    mat-raised-button
    [color]="currentValueDisplay === 'percentOfRow' ? 'primary' : 'basic'"
    (click)="setPercentOfRowView()">
    % de Fila
  </button>
  <button
    mat-raised-button
    [color]="currentValueDisplay === 'percentOfColumn' ? 'primary' : 'basic'"
    (click)="setPercentOfColumnView()">
    % de Columna
  </button>
</div>
<div class="table-container">
  <libTable [dataset]="dataset1" [tableOptions]="tableConfig4" #tablePercentages></libTable>
</div>`;

  example6HTML = `<div class="theme-buttons">
  <button mat-raised-button color="primary" (click)="setDefaultTheme()">Tema por Defecto</button>
  <button mat-raised-button color="accent" (click)="setMaterialTheme()">Tema Material</button>
  <button mat-raised-button color="warn" (click)="setBootstrapTheme()">Tema Bootstrap</button>
  <button mat-raised-button (click)="updateThemeWithCustomColors()">Personalizar Tema</button>
</div>
<div class="table-container">
  <libTable [dataset]="dataset1" [tableOptions]="tableConfig3" #tableTheme></libTable>
</div>`;

  example7HTML = `
interface TableTheme {
  /** Color de fondo al pasar el mouse sobre una celda */
  tableHover: string;
  /** Color de contraste para el hover */
  tableHoverContrast: string;
  /** Color de fondo para los datos */
  tableDataBg: string;
  /** Color de fondo para las etiquetas */
  tableLabelBg: string;
  /** Color de fondo para las etiquetas de eje */
  axisLabelBg: string;

  /** Color de texto base para toda la tabla */
  textColor: string;
  /** Color de texto para los datos */
  dataTextColor: string;
  /** Color de texto para las etiquetas */
  labelTextColor: string;

  /** Tamaño de fuente base */
  fontSize: string;
  /** Tamaño de fuente para los encabezados */
  headerFontSize: string;
  /** Altura de línea */
  lineHeight: string;

  /** Configuración de padding para diferentes elementos */
  padding: {
    cell: string;
    label: string;
  };

  /** Configuración de bordes generales */
  border: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes para etiquetas */
  labelBorder: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes para datos */
  dataBorder: {
    color: string;
    width: string;
    style: string;
  };

  /** Configuración de bordes hover para etiquetas */
  labelHoverBorder: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes hover para datos */
  dataHoverBorder: {
    color: string;
    width: string;
    style: string;
  };

  /** Color de fondo hover para etiquetas */
  labelHover: string;
  /** Color de contraste hover para etiquetas */
  labelHoverContrast: string;
  /** Color de fondo hover para datos */
  dataHover: string;
  /** Color de contraste hover para datos */
  dataHoverContrast: string;
  /** Color de fondo hover para encabezados */
  headerHover: string;
  /** Color de contraste hover para encabezados */
  headerHoverContrast: string;

  /** Configuración de sombras */
  boxShadow: string;
  /** Espaciado entre bordes de celdas */
  borderSpacing: string;
  /** Tipo de colapso de bordes */
  borderCollapse: string;

  /** Border radius para etiquetas */
  labelBorderRadius: string;
  /** Border radius para datos */
  dataBorderRadius: string;

  /** Alineación del texto para los datos del tbody */
  dataTextAlign: "left" | "right" | "center" | "justify" | "inherit";
}`;

  constructor(
    private readonly themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // Documentación de TableOptions
  tableOptionsDocumentation = `/**
  * Interfaz para la configuración de una tabla
  */
interface TableOptions {
  /** Número de decimales a mostrar */
  digitsAfterDecimal: number;
  /** Configuración de ordenamiento para cada dimensión */
  sorters: TableSorter[];
  /** Indica si se debe mostrar la fila de totales */
  totalRow: boolean;
  /** Indica si se debe mostrar la columna de totales */
  totalCol: boolean;
  /** Lista de nombres o IDs de columnas */
  cols: (string | number)[];
  /** Lista de nombres o IDs de filas */
  rows: (string | number)[];
  /** Sufijo opcional para los valores numéricos */
  suffix?: string;
  /** Define el modo de visualización de los valores en la tabla */
  valueDisplay?:
    | "nominal"
    | "percentOfTotal"
    | "percentOfRow"
    | "percentOfColumn";
}

/**
* Interfaz para la configuración del ordenamiento de dimensiones
*/
interface TableSorter {
  /** Nombre o ID de la dimensión a ordenar */
  name: string | number;
  /** Lista de ítems con su orden específico */
  items: {
    /** Nombre del ítem */
    name: string;
    /** Orden del ítem */
    order: number;
  }[];
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

  // Métodos para cambiar el tema de la tabla principal
  setDefaultTheme(): void {
    this.themeService.setTheme("default", this.table);
  }

  setMaterialTheme(): void {
    this.themeService.setTheme("material", this.table);
  }

  setBootstrapTheme(): void {
    this.themeService.setTheme("bootstrap", this.table);
  }

  // Ejemplo de personalización parcial del tema
  updateThemeWithCustomColors(): void {
    this.themeService.updateTheme(
      {
        tableDataBg: "#d3d3d3",
        tableLabelBg: "#0ec244",
      },
      this.table,
    );
  }

  // Métodos para cambiar el modo de visualización de porcentajes
  setNominalView(): void {
    this.currentValueDisplay = "nominal";
    this.tablePercentages.setValueDisplay("nominal");
  }

  setPercentOfTotalView(): void {
    this.currentValueDisplay = "percentOfTotal";
    this.tablePercentages.setValueDisplay("percentOfTotal");
  }

  setPercentOfRowView(): void {
    this.currentValueDisplay = "percentOfRow";
    this.tablePercentages.setValueDisplay("percentOfRow");
  }

  setPercentOfColumnView(): void {
    this.currentValueDisplay = "percentOfColumn";
    this.tablePercentages.setValueDisplay("percentOfColumn");
  }

  // Métodos de navegación
  navigateToConfiguration(): void {
    this.router.navigate(["/configuration"]);
  }

  navigateToChartDemo(): void {
    this.router.navigate(["/chart-demo"]);
  }

  navigateToMultichartDemo(): void {
    this.router.navigate(["/multichart-demo"]);
  }
}
