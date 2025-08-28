// Importaciones de Angular
import { CommonModule } from "@angular/common";
import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Importaciones de la librería ngx-data-visualizer
import {
  ChartOptions, // Configuración para gráficos
  ChartDirective, // Directiva para componente de gráfico
  Dataset, // Clase principal para manejo de datos
  Dimension, // Modelo para dimensiones del dataset
  Filters, // Modelo para filtros aplicados
  Goal, // Modelo para metas/objetivos en gráficos
  Item, // Modelo para items individuales de dimensiones
  MultipleChartDirective, // Directiva para múltiples gráficos
  TableOptions, // Configuración para tablas
  RowData, // Modelo para filas de datos
  Series, // Modelo para series de gráficos
  TableDirective, // Directiva para componente de tabla
  ThemeService, // Servicio para manejo de temas
} from "ngx-data-visualizer";

// Importación de datos estáticos desde archivos JSON
import optionsChart from "../../assets/data/chart-options.json"; // Configuración del gráfico
import data from "../../assets/data/data.json"; // Datos principales
import dimensionsData from "../../assets/data/dimensions.json"; // Configuración de dimensiones
import goal from "../../assets/data/goal.json"; // Datos de metas
import optionsTable from "../../assets/data/table-options.json"; // Configuración de la tabla

/**
 * FullExampleComponent - Componente de demostración completa de ngx-data-visualizer
 *
 * Este componente muestra todas las funcionalidades principales de la librería:
 * - Visualización de gráficos simples y múltiples
 * - Tablas de datos interactivas
 * - Sistema de filtros por dimensiones
 * - Panel lateral deslizante con controles
 * - Exportación de datos y gráficos
 * - Aplicación de temas
 */
@Component({
  selector: "app-full-example",
  standalone: true,
  imports: [
    CommonModule, // Directivas básicas de Angular
    ReactiveFormsModule, // Para formularios reactivos
    FormsModule, // Para binding bidireccional [(ngModel)]
    ChartDirective, // Componente de gráfico de la librería
    TableDirective, // Componente de tabla de la librería
    MultipleChartDirective, // Componente de múltiples gráficos
  ],
  templateUrl: "./full-example.component.html",
  styleUrl: "./full-example.component.scss",
})
export class FullExampleComponent implements OnInit, AfterViewInit {
  // ============================================
  // PROPIEDADES PRINCIPALES DEL DATASET
  // ============================================

  /** Dataset principal que contiene todos los datos y configuraciones */
  dataset!: Dataset;

  /** Configuración visual para el gráfico principal */
  chartOptions: ChartOptions = optionsChart as ChartOptions;

  /** Configuración alternativa para gráficos (si se necesita) */
  chartOptions2: ChartOptions = {
    ...optionsChart,
  } as ChartOptions;

  /** Configuración para la tabla de datos */
  tableOptions: TableOptions = {
    ...optionsTable,
    valueDisplay: "nominal",
  } as TableOptions;

  /** Configuración de meta/objetivo para mostrar en gráficos */
  goal: Goal = goal as Goal;

  // ============================================
  // REFERENCIAS A COMPONENTES
  // ============================================

  /** Referencia al componente de gráfico principal */
  chartOne!: ChartDirective;

  // ============================================
  // PROPIEDADES DE ESTADO Y CONFIGURACIÓN
  // ============================================

  /** Lista de años disponibles en los datos */
  years!: string[];

  /** Flag para resaltar todos los elementos (no implementado) */
  highlighAll = false;

  /** Series actuales del gráfico */
  series!: Series[];

  /** Flag para vista en porcentajes */
  toPercentage = true;

  /** Estado del toggle de vista porcentual */
  isPercentViewActive = false;

  /** Estado del toggle de mostrar meta */
  isGoalVisible = false;

  /** Dimensión utilizada para dividir en múltiples gráficos */
  splitDimension!: Dimension;

  // ============================================
  // SERVICIOS INYECTADOS
  // ============================================

  /** Servicio para manejo de temas de la librería */
  themeService: ThemeService = inject(ThemeService);

  /** Detector de cambios para actualizaciones manuales */
  private cdr = inject(ChangeDetectorRef);

  // ============================================
  // CONTROL DEL PANEL LATERAL
  // ============================================

  /** Controla si el panel lateral está abierto o cerrado */
  isSidePanelOpen = false;

  /**
   * Controla el estado de colapso de cada dimensión
   * Key: ID de dimensión (string), Value: true si está colapsada
   */
  collapsedDimensions: { [key: string]: boolean } = {};

  // ============================================
  // REFERENCIAS A ELEMENTOS DEL DOM
  // ============================================

  /** Referencias a todos los checkboxes "Todos" para manejo del estado indeterminado */
  @ViewChildren("allCheckbox") allCheckboxes!: QueryList<ElementRef>;

  /**
   * Inicialización del componente
   * Se ejecuta después de la construcción del componente
   */
  ngOnInit(): void {
    // Establecer tema por defecto de la librería
    this.themeService.setTheme("default");

    // Cargar datos desde archivos JSON
    const dimensions = dimensionsData as Dimension[];
    const rowData = data as RowData[];

    // Crear el dataset principal con configuración
    this.dataset = new Dataset({
      dimensions, // Dimensiones disponibles para filtrar
      enableRollUp: true, // Habilitar agrupamiento automático
      id: 1, // ID único del dataset
      rowData, // Datos en formato de filas
    });

    // Configurar dimensión para múltiples gráficos (primera dimensión)
    this.splitDimension = dimensions[0];

    // Obtener lista de años disponibles en los datos
    this.years = this.dataset.dataProvider.getItems("Año");

    // Configurar opciones específicas del gráfico
    this.chartOptions.stacked = "Departamentos"; // Apilar por departamentos
    this.chartOptions.xAxis.secondLevel = 3; // Nivel de agrupación en eje X

    // Inicializar todas las dimensiones como colapsadas por defecto
    this.dataset.dimensions.forEach((dimension) => {
      this.collapsedDimensions[dimension.id.toString()] = true;
    });
  }

  /**
   * Se ejecuta después de inicializar la vista
   * Necesario para acceder a elementos del DOM referenciados con @ViewChildren
   */
  ngAfterViewInit() {
    this.updateIndeterminateStates();
  }

  /**
   * Actualiza el estado indeterminado de todos los checkboxes "Todos"
   * El estado indeterminado se muestra cuando algunos (pero no todos) los items están seleccionados
   */
  updateIndeterminateStates() {
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.allCheckboxes.forEach((checkbox, index) => {
        const dimension = this.dataset.dimensions[index];
        if (dimension) {
          const allSelected = this.areAllItemsSelected(dimension);
          const someSelected = this.areSomeItemsSelected(dimension);
          // Estado indeterminado: algunos seleccionados pero no todos
          checkbox.nativeElement.indeterminate = someSelected && !allSelected;
        }
      });
    });
  }

  // ============================================
  // MÉTODOS DE FILTRADO Y AGRUPAMIENTO
  // ============================================

  /**
   * Aplica los filtros actuales al dataset
   * Se ejecuta cuando cambia cualquier checkbox de dimensión o item
   */
  filter() {
    const filters: Filters = {
      filter: [], // Filtros por items específicos
      rollUp: [], // Dimensiones a agrupar (rollup)
    };

    // Obtener las dimensiones que NO están seleccionadas para aplicar rollUp
    // RollUp agrupa/resume datos eliminando la granularidad de esas dimensiones
    filters.rollUp = this.dataset.dimensions
      .filter((dimension) => !dimension.selected)
      .map((dimension) => dimension.nameView);

    // Crear filtros para cada dimensión basados en los items seleccionados
    // Solo se incluyen en el resultado los items marcados como seleccionados
    filters.filter = this.dataset.dimensions.map((dimension) => ({
      name: dimension.nameView,
      items: dimension.items
        .filter((item) => item.selected) // Solo items marcados
        .map((item) => item.name), // Extraer nombres de items
    }));

    // Aplicar los filtros construidos al dataset
    // Esto actualiza automáticamente todos los componentes que usan el dataset
    this.dataset.applyFilters(filters);
  }

  // ============================================
  // MÉTODOS DE ACCIONES SOBRE VISUALIZACIONES
  // ============================================

  /**
   * Alterna entre vista porcentual y vista nominal
   * @param chartDirective Referencia al componente de gráfico
   */
  togglePercentView(chartDirective: ChartDirective) {
    this.isPercentViewActive = !this.isPercentViewActive;
    chartDirective.toPercentage();
  }

  /**
   * Restablece todos los filtros a su estado inicial
   * Selecciona todas las dimensiones y todos sus items
   */
  clearFilters() {
    // Marcar todas las dimensiones como seleccionadas
    this.dataset.dimensions.forEach((dimension: Dimension) => {
      dimension.selected = true;
      // Marcar todos los items de cada dimensión como seleccionados
      dimension.items.forEach((item: Item) => (item.selected = true));
    });

    // Aplicar filtros vacíos (sin restricciones)
    this.dataset.applyFilters(new Filters());

    // Actualizar estados indeterminados de checkboxes
    this.updateIndeterminateStates();
  }

  /**
   * Callback que se ejecuta cuando cambian las series del gráfico
   * @param series Nuevas series generadas por el gráfico
   */
  onSeriesChange(series: Series[]) {
    this.series = series;
  }

  /**
   * Exporta el gráfico como imagen
   * @param chartDirective Referencia al componente de gráfico
   */
  exportChart(chartDirective: ChartDirective) {
    chartDirective.export("jpg"); // Formato JPG por defecto
  }

  /**
   * Exporta los datos de la tabla como archivo Excel
   * @param tableDirective Referencia al componente de tabla
   */
  exportTable(tableDirective: TableDirective) {
    tableDirective.export("xlsx"); // Formato Excel
  }

  /**
   * Muestra u oculta la línea de meta en el gráfico
   * @param chartDirective Referencia al componente de gráfico
   */
  toggleGoal(chartDirective: ChartDirective) {
    this.isGoalVisible = !this.isGoalVisible;
    chartDirective.toggleShowGoal(this.goal);
  }

  // ============================================
  // MÉTODOS DE CONTROL DE COLAPSABLES
  // ============================================

  /**
   * Alterna el estado de colapso de una dimensión (expandir/colapsar items)
   * @param dimension Dimensión a expandir o colapsar
   */
  toggleDimensionItems(dimension: Dimension) {
    this.collapsedDimensions[dimension.id.toString()] =
      !this.collapsedDimensions[dimension.id.toString()];
  }

  /**
   * Verifica si una dimensión está colapsada
   * @param dimensionId ID de la dimensión a verificar
   * @returns true si está colapsada, false si está expandida
   */
  isDimensionCollapsed(dimensionId: string): boolean {
    return this.collapsedDimensions[dimensionId] || false;
  }

  // ============================================
  // MÉTODOS DE CONTROL DE SELECCIÓN
  // ============================================

  /**
   * Selecciona o deselecciona todos los items de una dimensión
   * Se ejecuta cuando se hace clic en el checkbox "Todos"
   * @param dimension Dimensión objetivo
   * @param selectAll true para seleccionar todos, false para deseleccionar todos
   */
  toggleAllItems(dimension: Dimension, selectAll: boolean) {
    dimension.items.forEach((item: Item) => {
      item.selected = selectAll;
    });
    // Aplicar filtros inmediatamente después del cambio
    this.filter();
    // Actualizar estados indeterminados
    this.updateIndeterminateStates();
  }

  /**
   * Verifica si todos los items de una dimensión están seleccionados
   * @param dimension Dimensión a verificar
   * @returns true si todos los items están seleccionados
   */
  areAllItemsSelected(dimension: Dimension): boolean {
    return (
      dimension.items.length > 0 &&
      dimension.items.every((item) => item.selected)
    );
  }

  /**
   * Verifica si al menos un item de una dimensión está seleccionado
   * @param dimension Dimensión a verificar
   * @returns true si al menos un item está seleccionado
   */
  areSomeItemsSelected(dimension: Dimension): boolean {
    return dimension.items.some((item) => item.selected);
  }

  /**
   * Maneja el cambio de estado de una dimensión completa
   * Incluye validación para asegurar que al menos una dimensión esté seleccionada
   * @param dimension Dimensión que cambió de estado
   */
  onDimensionChange(dimension: Dimension) {
    // Contar cuántas dimensiones están actualmente seleccionadas
    const selectedDimensions = this.dataset.dimensions.filter(
      (d) => d.selected,
    );

    // Validación: debe haber al menos una dimensión seleccionada
    if (selectedDimensions.length === 0) {
      // Si no hay ninguna seleccionada, forzar la selección de esta dimensión
      dimension.selected = true;
      return;
    }

    // Si la validación pasa, aplicar filtros
    this.filter();
  }

  /**
   * Maneja el cambio de estado de un item individual
   * Se ejecuta cuando se marca/desmarca un item específico
   */
  onItemChange() {
    // Aplicar filtros después del cambio
    this.filter();
    // Actualizar estados indeterminados de checkboxes "Todos"
    this.updateIndeterminateStates();
  }

  // ============================================
  // MÉTODOS DE CONTROL DEL PANEL LATERAL
  // ============================================

  /**
   * Alterna la visibilidad del panel lateral (abrir/cerrar)
   */
  toggleSidePanel() {
    this.isSidePanelOpen = !this.isSidePanelOpen;
  }

  /**
   * Cierra el panel lateral
   * Se usa específicamente para el botón de cerrar (X)
   */
  closeSidePanel() {
    this.isSidePanelOpen = false;
  }

  /**
   * Cambia la dimensión utilizada para generar gráficos múltiples
   * @param dimensionId ID de la nueva dimensión seleccionada
   */
  onSplitDimensionChange(dimensionId: string) {
    const selectedDimension = this.dataset.dimensions.find(
      (dim) => dim.id.toString() === dimensionId,
    );
    if (selectedDimension) {
      this.splitDimension = selectedDimension;
    }
  }

  /**
   * Maneja clicks en el documento para cerrar el panel cuando se hace click fuera
   * @param event Evento de click del documento
   */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event) {
    if (!this.isSidePanelOpen) {
      return;
    }

    const target = event.target as HTMLElement;

    // Verificar si el click fue en el botón flotante o sus elementos hijos
    if (target.closest(".floating-menu-button")) {
      return;
    }

    // Verificar si el click fue fuera del panel
    if (!target.closest(".side-menu")) {
      this.closeSidePanel();
    }
  }
}
