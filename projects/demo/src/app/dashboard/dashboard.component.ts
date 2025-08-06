import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import cloneDeep from "lodash.clonedeep";
import {
  ChartOptions,
  ChartDirective,
  Dataset,
  Dimension,
  TableOptions,
  RowData,
  TableDirective,
} from "ngx-data-visualizer";
import optionsChart from "../../assets/data/chart-options-dash.json";
import dimensionsData from "../../assets/data/dash-dimensions.json";
import data from "../../assets/data/example-data-2.json";
import optionsTable from "../../assets/data/table-options-dash.json";

/**
 * DashboardComponent - Dashboard con layout responsivo y side-menu
 *
 * Configuraciones originales del dashboard mantenidas:
 * - 4 gráficos con configuraciones específicas
 * - 1 tabla principal
 * - Sistema de filtros básico
 * - Side-menu para filtros avanzados
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    ChartDirective,
    TableDirective,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // ============================================
  // DATASETS Y CONFIGURACIONES ORIGINALES
  // ============================================

  /** Datasets para cada gráfico */
  datasetOne!: Dataset;
  datasetTwo!: Dataset;
  datasetThree!: Dataset;
  datasetFour!: Dataset;

  /** Configuraciones de gráficos (manteniendo las originales) */
  chartOptionsOne: ChartOptions = JSON.parse(
    JSON.stringify(optionsChart),
  ) as ChartOptions;
  chartOptionsTwo: ChartOptions = JSON.parse(
    JSON.stringify(optionsChart),
  ) as ChartOptions;
  chartOptionsThree: ChartOptions = JSON.parse(
    JSON.stringify(optionsChart),
  ) as ChartOptions;
  chartOptionsFour: ChartOptions = JSON.parse(
    JSON.stringify(optionsChart),
  ) as ChartOptions;

  /** Configuración de tabla */
  tableOptions: TableOptions = { ...optionsTable } as TableOptions;

  /** Dimensiones para filtros */
  dimensions: Dimension[] = dimensionsData as Dimension[];

  // ============================================
  // CONTROL DEL PANEL LATERAL
  // ============================================

  /** Controla si el panel lateral está abierto */
  isSidePanelOpen = false;

  /** Controla el estado de colapso de cada dimensión en el side-menu */
  collapsedDimensions: { [key: string]: boolean } = {};

  /** Referencias a los checkboxes "Todos" del side-menu */
  @ViewChildren("allCheckbox") allCheckboxes!: QueryList<ElementRef>;

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  ngOnInit(): void {
    const dimensions = dimensionsData as Dimension[];
    const rowData = data as RowData[];

    // Configuración del gráfico 1 (pie chart por sectores)
    this.chartOptionsOne.filterLastYear = true;
    this.chartOptionsOne.type = "pie";
    this.chartOptionsOne.xAxis.firstLevel = 117;

    this.datasetOne = new Dataset({
      dimensions,
      enableRollUp: true,
      rowData,
      id: 1,
    });
    this.datasetOne.dataProvider.filters = {
      filter: [],
      rollUp: ["Sector de gestión", "Sexo"],
    };

    // Configuración del gráfico 2 (pie chart por condición)
    this.chartOptionsTwo.filterLastYear = true;
    this.chartOptionsTwo.type = "pie";
    this.chartOptionsTwo.xAxis.firstLevel = 54;

    this.datasetTwo = new Dataset({
      dimensions,
      enableRollUp: true,
      rowData,
      id: 2,
    });
    this.datasetTwo.dataProvider.filters = {
      filter: [],
      rollUp: ["Sexo", "Condición"],
    };

    // Configuración del gráfico 3 (pie chart por departamentos)
    this.chartOptionsThree.filterLastYear = true;
    this.chartOptionsThree.type = "pie";
    this.chartOptionsThree.xAxis.firstLevel = 12;
    this.chartOptionsThree.tooltip.shared = false;

    this.datasetThree = new Dataset({
      dimensions,
      enableRollUp: true,
      rowData,
      id: 3,
    });
    this.datasetThree.dataProvider.filters = {
      filter: [],
      rollUp: ["Sector de gestión", "Condición"],
    };

    // Configuración del gráfico 4 (gráfico principal)
    this.chartOptionsFour.xAxis.secondLevel = 12;
    this.chartOptionsFour.stacked = "Condición";
    this.chartOptionsFour.tooltip.shared = true;

    this.datasetFour = new Dataset({
      dimensions,
      enableRollUp: true,
      rowData,
      id: 4,
    });
    this.datasetFour.dataProvider.filters = {
      filter: [],
      rollUp: ["Sector de gestión"],
    };

    // Inicializar dimensiones como colapsadas en el side-menu
    this.dimensions.forEach((dimension) => {
      this.collapsedDimensions[dimension.id.toString()] = true;
    });
  }

  ngAfterViewInit(): void {
    this.updateIndeterminateStates();
  }

  // ============================================
  // FILTROS PRINCIPALES (BARRA SUPERIOR)
  // ============================================

  /**
   * Función de filtrado original - se ejecuta cuando cambian los checkboxes de la barra superior
   */
  filter(): void {
    const filter = this.dimensions.map((dimension) => ({
      name: dimension.nameView,
      items: dimension.items
        .filter((item) => item.selected)
        .map((item) => item.name),
    }));

    // Aplicar filtros a todos los datasets manteniendo la lógica original
    const datasetFilterOne = this.datasetOne.dataProvider.filters;
    datasetFilterOne.filter = [...cloneDeep(filter)];
    this.datasetOne.applyFilters(datasetFilterOne);

    const datasetFilterTwo = this.datasetTwo.dataProvider.filters;
    datasetFilterTwo.filter = [...cloneDeep(filter)];
    this.datasetTwo.applyFilters(datasetFilterTwo);

    const datasetFilterThree = this.datasetThree.dataProvider.filters;
    datasetFilterThree.filter = [...cloneDeep(filter)];
    this.datasetThree.applyFilters(datasetFilterThree);

    const datasetFilterFour = this.datasetFour.dataProvider.filters;
    datasetFilterFour.filter = [...cloneDeep(filter)];
    this.datasetFour.applyFilters(datasetFilterFour);
  }

  // ============================================
  // CONTROL DEL PANEL LATERAL
  // ============================================

  /**
   * Alterna la visibilidad del panel lateral
   */
  toggleSidePanel(): void {
    this.isSidePanelOpen = !this.isSidePanelOpen;
  }

  /**
   * Cierra el panel lateral
   */
  closeSidePanel(): void {
    this.isSidePanelOpen = false;
  }

  /**
   * Cierra el panel si se hace click fuera de él
   */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (!this.isSidePanelOpen) {
      return;
    }

    const target = event.target as HTMLElement;

    // No cerrar si se hace click en el botón flotante
    if (target.closest(".floating-menu-button")) {
      return;
    }

    // Cerrar si el click es fuera del panel
    if (!target.closest(".side-menu")) {
      this.closeSidePanel();
    }
  }

  // ============================================
  // FILTROS AVANZADOS (SIDE-MENU)
  // ============================================

  /**
   * Maneja el cambio de selección en una dimensión del side-menu
   */
  onDimensionChange(): void {
    this.filter(); // Reutilizar la función de filtrado principal
  }

  /**
   * Maneja el cambio de selección en un item específico del side-menu
   */
  onItemChange(): void {
    this.updateIndeterminateStates();
    this.filter();
  }

  /**
   * Alterna la selección de todos los items de una dimensión en el side-menu
   */
  toggleAllItems(dimension: Dimension, checked: boolean): void {
    dimension.items.forEach((item) => {
      item.selected = checked;
    });
    this.filter();
  }

  /**
   * Verifica si todos los items de una dimensión están seleccionados
   */
  areAllItemsSelected(dimension: Dimension): boolean {
    return dimension.items.every((item) => item.selected);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.dimensions.forEach((dimension) => {
      dimension.selected = true;
      dimension.items.forEach((item) => {
        item.selected = true;
      });
    });

    this.updateIndeterminateStates();
    this.filter();
  }

  /**
   * Actualiza el estado indeterminado de los checkboxes "Todos"
   */
  updateIndeterminateStates(): void {
    setTimeout(() => {
      this.allCheckboxes.forEach((checkbox, index) => {
        if (index < this.dimensions.length) {
          const dimension = this.dimensions[index];
          const selectedCount = dimension.items.filter(
            (item) => item.selected,
          ).length;
          const totalCount = dimension.items.length;

          const isIndeterminate =
            selectedCount > 0 && selectedCount < totalCount;
          checkbox.nativeElement.indeterminate = isIndeterminate;
        }
      });
    });
  }

  // ============================================
  // CONTROL DE DIMENSIONES COLAPSABLES
  // ============================================

  /**
   * Alterna el estado colapsado de una dimensión en el side-menu
   */
  toggleDimensionItems(dimension: Dimension): void {
    const dimensionId = dimension.id.toString();
    this.collapsedDimensions[dimensionId] =
      !this.collapsedDimensions[dimensionId];
  }

  /**
   * Verifica si una dimensión está colapsada en el side-menu
   */
  isDimensionCollapsed(dimensionId: string): boolean {
    return this.collapsedDimensions[dimensionId] || false;
  }

  // ============================================
  // RESPONSIVE DESIGN
  // ============================================

  /**
   * Maneja cambios de tamaño de ventana
   */
  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event): void {
    const target = event.target as Window;
    const width = target.innerWidth;

    // En pantallas móviles, opcional: cerrar panel automáticamente
    if (width < 768 && this.isSidePanelOpen) {
      // this.closeSidePanel(); // Descomenta si quieres que se cierre automáticamente
    }
  }
}
