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
  constructor(private router: Router) { }

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

  viewChildCode = `@ViewChild(ChartComponent) chartComponent: ChartComponent;`;

  importCode = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones de @uncuyoapp/ngx-data-visualizer
import {
  ChartComponent,          // Componente standalone para renderizado de gráficos
  TableComponent,          // Componente standalone para renderizado de tablas
  MultipleChartComponent,  // Componente standalone para gráficos múltiples
  Dataset,                 // Modelo de datos reactivo
  Dimension,               // Interfaz para las dimensiones de datos
  Item,                    // Interfaz para ítems de dimensiones
  RowData,                 // Interfaz de fila de datos
  ChartOptions,            // Opciones de configuración de gráficos
  TableOptions,            // Opciones de configuración de tablas
  Series,                  // Interfaz para series de datos
  Goal,                    // Interfaz para definir metas/objetivos
  EventBusService,         // Bus reactivo de eventos del ciclo de vida
  VisualizerEventType      // Enum de tipos de eventos emitidos
} from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-ejemplo',
  standalone: true,
  imports: [
    CommonModule,
    ChartComponent,
    TableComponent,
    MultipleChartComponent
  ],
  templateUrl: './ejemplo.component.html'
})
export class EjemploComponent implements OnInit {
  // ... tu implementación
}`;

  providerConfigCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideDataVisualizerCharts,
  provideDataVisualizerTables
} from '@uncuyoapp/ngx-data-visualizer';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    // ✅ Proveedores de ngx-data-visualizer
    provideDataVisualizerCharts(), // Para funcionalidad de gráficos
    provideDataVisualizerTables(), // Para funcionalidad de tablas

    // Otros providers...
  ],
};`;

  providerOptionsExampleCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDataVisualizerCharts } from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Configuración global de gráficos opcional
    provideDataVisualizerCharts({
      defaultColors: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f'], // Colores por defecto para series
      defaultHeight: 400, // Alto predeterminado del gráfico (número o string como '400px')
      defaultWidth: '100%', // Ancho predeterminado del gráfico
      debug: true // Habilita logs de depuración para gráficos en consola ([Chart]*)
    })
  ]
};`;

  providerTableOptionsExampleCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideDataVisualizerTables } from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Configuración global de tablas opcional
    provideDataVisualizerTables({
      debug: true // Habilita logs de depuración para tablas en consola ([Table]*)
    })
  ]
};`;

  eventBusExampleCode = `import { Component, inject, OnInit } from '@angular/core';
import { EventBusService, VisualizerEventType } from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-analytics-logger',
  standalone: true,
  template: \`<p>Escuchando eventos del bus reactivo...</p>\`
})
export class AnalyticsLoggerComponent implements OnInit {
  private readonly eventBus = inject(EventBusService);

  ngOnInit(): void {
    // Escuchar evento específico de renderizado de gráfico completado
    this.eventBus.on(VisualizerEventType.CHART_RENDER_COMPLETE).subscribe(event => {
      console.log(\`Gráfico renderizado con éxito. ID instancia: \${event.instanceId}\`);
    });

    // Escuchar la totalidad del flujo de eventos
    this.eventBus.events$.subscribe(event => {
      console.log('Bus Event:', event.type, event.payload);
    });
  }
}`;

  auditExampleCode = `// 1. Vía Inyección de Dependencias en app.config.ts
provideDataVisualizerCharts({ debug: true })

// 2. Vía LocalStorage en el navegador (ejecutar en consola JS)
localStorage.setItem('ngx-viz-debug', '*');       // Audita todos los eventos
localStorage.setItem('ngx-viz-debug', '[Chart]*'); // Audita solo eventos de gráficos

// 3. Vía URL Query Parameters
// https://tu-aplicacion.com/?ngx-viz-debug=*`;

  designTokensExampleCode = `// en src/styles.scss
:root {
  --viz-primary: #0450ff;          /* Color de énfasis principal */
  --viz-primary-contrast: #ffffff; /* Contraste para el color primario */
  --viz-bg-card: #ffffff;          /* Fondo para tarjetas de gráficos */
  --viz-bg-overlay: rgba(255, 255, 255, 0.85); /* Fondo para overlays CDK */
  --viz-text: #333333;             /* Texto principal */
  --viz-text-muted: #666666;       /* Texto secundario */
  --viz-border-color: #e6e6e6;     /* Color de bordes */
  --viz-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Soporte para Modo Oscuro */
[data-theme="dark"] {
  --viz-bg-card: #1e1e24;
  --viz-bg-overlay: rgba(30, 30, 36, 0.90);
  --viz-text: #f3f4f6;
  --viz-text-muted: #9ca3af;
  --viz-border-color: #374151;
}`;

  installationCode = `# Instalar la librería y sus dependencias
npm install @uncuyoapp/ngx-data-visualizer echarts ngx-echarts pivottable jquery

# Tipos para desarrollo (opcional pero recomendado)
npm install --save-dev @types/jquery`;

  scssImportCode = `// en src/styles.scss
@import '@uncuyoapp/ngx-data-visualizer/styles';`;

  onlyChartsCode = `// Solo para gráficos
import { provideDataVisualizerCharts } from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDataVisualizerCharts(), // ✅ Solo gráficos
    // Otros providers...
  ]
};`;

  onlyTablesCode = `// Solo para tablas
import { provideDataVisualizerTables } from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDataVisualizerTables(), // ✅ Solo tablas
    // Otros providers...
  ]
};`;

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
  /** Indica si el conjunto de datos representa valores porcentuales (desactiva roll-up). */
  public readonly isPercent: boolean;
  /** Los datos crudos (sin procesar) del conjunto de datos. */
  public readonly rowData: RowData[];
  /** (Avanzado) Instancia del motor de procesamiento de datos subyacente. */
  public readonly dataProvider: DataProvider;
  /** Un 'Subject' de RxJS que emite 'true' cuando los datos se actualizan. */
  public readonly dataUpdated = new Subject<boolean>();

  /**
   * Crea una instancia de Dataset.
   */
  constructor(config: {
    id?: number;
    dimensions: Dimension[];
    enableRollUp?: boolean;
    isPercent?: boolean;
    rowData: RowData[];
  }) { /* ... */ }

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
  selected?: boolean;
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
