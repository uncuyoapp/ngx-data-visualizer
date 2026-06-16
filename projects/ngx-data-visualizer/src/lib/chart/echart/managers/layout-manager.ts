import { EChartsOption } from "echarts";
import { ChartOptions } from "../../../types/data.types";
import { ChartData } from "../../utils/chart-data";

/**
 * Representa los márgenes (márgenes/espaciados) de la cuadrícula (grid) en píxeles.
 */
export interface Margins {
  /** Margen superior en píxeles. */
  top: number;
  /** Margen inferior en píxeles. */
  bottom: number;
  /** Margen izquierdo en píxeles. */
  left: number;
  /** Margen derecho en píxeles. */
  right: number;
}

/**
 * Configuración detallada de todos los espaciados, alturas y offsets del layout del gráfico.
 * Permite cambiar el comportamiento espacial del gráfico de manera sencilla y centralizada.
 */
export interface LayoutConfig {
  /** Márgenes base que tendrá el gráfico si no se activa ningún componente extra. */
  baseMargins: Margins;
  /** Espaciado adicional requerido en la parte superior cuando se muestra el título. */
  titleSpacing: number;
  /** Espaciados adicionales a aplicar según la posición en la que se renderice la leyenda. */
  legendSpacing: {
    /** Espacio extra superior si la leyenda se ubica arriba. */
    top: number;
    /** Espacio extra inferior si la leyenda se ubica abajo. */
    bottom: number;
    /** Espacio extra izquierdo si la leyenda se ubica a la izquierda. */
    left: number;
    /** Espacio extra derecho si la leyenda se ubica a la derecha. */
    right: number;
  };
  /** Altura en píxeles que ocupa el navegador (dataZoom / slider). */
  navigatorHeight: number;
  /** Espacio extra requerido en la parte inferior al habilitar el navegador. */
  navigatorSpacing: number;
  /** Parámetros de espaciado asociados a los ejes, títulos y rotaciones. */
  axisSpacing: {
    /** Espacio extra inferior si las etiquetas de categoría se encuentran inclinadas/rotadas. */
    rotatedLabels: number;
    /** Espacio extra inferior si se utiliza doble eje vertical (Cartesiano estándar). */
    dualAxisVertical: number;
    /** Espacio extra izquierdo si se utiliza doble eje horizontal (gráfico de barras). */
    dualAxisHorizontal: number;
    /** Espacio extra inferior si el eje X (no barra) posee título. */
    xAxisTitle: number;
    /** Espacio extra izquierdo si el eje Y (no barra) posee título. */
    yAxisTitle: number;
    /** Espacio extra izquierdo si el eje X (como categoría en barras horizontales) posee título. */
    xAxisTitleBar: number;
    /** Espacio extra inferior si el eje Y (como valor en barras horizontales) posee título. */
    yAxisTitleBar: number;
  };
}

/**
 * Configuración por defecto de las dimensiones y espaciados de diseño.
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  baseMargins: {
    top: 20,
    bottom: 45,
    left: 35,
    right: 20,
  },
  titleSpacing: 35,
  legendSpacing: {
    top: 30,
    bottom: 30,
    left: 85,
    right: 85,
  },
  navigatorHeight: 20,
  navigatorSpacing: 25,
  axisSpacing: {
    rotatedLabels: 20,
    dualAxisVertical: 45,
    dualAxisHorizontal: 45,
    xAxisTitle: 15,
    yAxisTitle: 15,
    xAxisTitleBar: 20,
    yAxisTitleBar: 15,
  },
};

/**
 * Clase encargada de administrar el diseño y posicionamiento de los componentes
 * de un gráfico ECharts (grid, legend, dataZoom/navigator, title) para evitar superposiciones.
 * Utiliza una aproximación modularizada donde cada componente visual computa su propio
 * impacto sobre las dimensiones del grid.
 */
export class LayoutManager {
  /**
   * Instancia de la configuración de layout utilizada por el gestor.
   */
  private readonly config: LayoutConfig;

  /**
   * Inicializa una nueva instancia de LayoutManager.
   * @param config Configuración opcional para sobreescribir los valores de layout por defecto.
   */
  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = {
      ...DEFAULT_LAYOUT_CONFIG,
      ...config,
      baseMargins: {
        ...DEFAULT_LAYOUT_CONFIG.baseMargins,
        ...(config.baseMargins || {}),
      },
      legendSpacing: {
        ...DEFAULT_LAYOUT_CONFIG.legendSpacing,
        ...(config.legendSpacing || {}),
      },
      axisSpacing: {
        ...DEFAULT_LAYOUT_CONFIG.axisSpacing,
        ...(config.axisSpacing || {}),
      },
    };
  }

  /**
   * Calcula y configura dinámicamente la distribución espacial del gráfico.
   * Modifica las opciones de ECharts recibidas en `libraryOptions`.
   * 
   * @param libraryOptions Opciones de ECharts a modificar.
   * @param options Opciones de visualización definidas por el usuario.
   * @param chartData Datos del gráfico para determinar niveles de eje y categorías.
   */
  public configureLayout(
    libraryOptions: EChartsOption,
    options: ChartOptions,
    chartData: ChartData
  ): void {
    if (!libraryOptions) return;

    // Obtener la referencia de la grid existente o inicializarla por defecto
    const grid = this.getOrCreateGrid(libraryOptions);
    grid.containLabel = true;

    // Inicializar márgenes con los valores base
    const margins: Margins = { ...this.config.baseMargins };
    const isBarChart = options.type === "bar";

    // 1. Evaluar e integrar el título del gráfico
    const hasTitle = this.applyTitleLayout(margins, options);

    // 2. Evaluar e integrar la leyenda del gráfico
    const hasLegend = this.applyLegendLayout(margins, libraryOptions, options, hasTitle);

    // 3. Evaluar e integrar el navegador de datos (dataZoom slider)
    this.applyNavigatorLayout(margins, libraryOptions, options, hasLegend);

    // 4. Evaluar e integrar las etiquetas, rotaciones y títulos de los ejes
    this.applyAxisLayout(margins, options, chartData, isBarChart);

    // 5. Asignar los márgenes calculados de vuelta al objeto de ECharts
    this.applyGridMargins(grid, margins, libraryOptions);
  }

  /**
   * Obtiene la primera grid de las opciones de ECharts o inicializa una por defecto.
   * @param libraryOptions Opciones de ECharts.
   * @private
   */
  private getOrCreateGrid(libraryOptions: EChartsOption): any {
    if (Array.isArray(libraryOptions.grid)) {
      if (libraryOptions.grid.length === 0) {
        libraryOptions.grid.push({ left: 0, right: 0, containLabel: true });
      }
      return libraryOptions.grid[0];
    }
    libraryOptions.grid = libraryOptions.grid || { left: 0, right: 0, containLabel: true };
    return libraryOptions.grid;
  }

  /**
   * Analiza la presencia del título y ajusta el margen superior.
   * @param margins Estructura de márgenes acumulativa.
   * @param options Opciones del gráfico.
   * @returns true si el gráfico posee un título visible, false en caso contrario.
   * @private
   */
  private applyTitleLayout(margins: Margins, options: ChartOptions): boolean {
    const hasTitle = typeof options.title === "string" && options.title.trim().length > 0;
    if (hasTitle) {
      margins.top += this.config.titleSpacing;
    }
    return hasTitle;
  }

  /**
   * Configura la posición de la leyenda nativa de ECharts y ajusta las márgenes de la grid.
   * @param margins Estructura de márgenes acumulativa.
   * @param libraryOptions Opciones de ECharts.
   * @param options Opciones del gráfico.
   * @param hasTitle Bandera que indica si el gráfico tiene un título.
   * @returns true si la leyenda está activa y visible, false en caso contrario.
   * @private
   */
  private applyLegendLayout(
    margins: Margins,
    libraryOptions: EChartsOption,
    options: ChartOptions,
    hasTitle: boolean
  ): boolean {
    const hasLegend = options.legends?.enabled && options.legends?.show;

    if (!hasLegend) {
      if (libraryOptions.legend) {
        (libraryOptions.legend as any).show = false;
      }
      return false;
    }

    // Instanciar o recuperar el nodo de leyenda nativo
    libraryOptions.legend = (libraryOptions.legend || {}) as any;
    const legend = libraryOptions.legend as any;
    legend.show = true;

    const position = (options.legends.position || "bottom").toLowerCase();

    switch (position) {
      case "top":
        legend.left = "center";
        legend.top = hasTitle ? this.config.titleSpacing + 10 : 10;
        legend.orient = "horizontal";
        margins.top += this.config.legendSpacing.top;
        break;

      case "left":
        legend.left = 10;
        legend.top = "middle";
        legend.orient = "vertical";
        margins.left += this.config.legendSpacing.left;
        break;

      case "right":
        legend.right = 10;
        legend.top = "middle";
        legend.orient = "vertical";
        margins.right += this.config.legendSpacing.right;
        break;

      case "bottom":
      default:
        // Por defecto fallback a bottom
        legend.left = "center";
        legend.bottom = 10;
        legend.orient = "horizontal";
        margins.bottom += this.config.legendSpacing.bottom;
        break;
    }

    return true;
  }

  /**
   * Configura la posición y dimensiones físicas del slider de zoom (navegador)
   * en ECharts, y acumula su espacio sobre el margen inferior de la grid.   
   * 
   * @param margins Estructura de márgenes acumulativa.
   * @param libraryOptions Opciones de ECharts.
   * @param options Opciones del gráfico.
   * @param hasLegend Bandera que indica si la leyenda está visible.
   * @private
   */
  private applyNavigatorLayout(
    margins: Margins,
    libraryOptions: EChartsOption,
    options: ChartOptions,
    hasLegend: boolean
  ): void {
    const hasNavigator = options.navigator?.show;

    if (!hasNavigator) {
      if (libraryOptions.dataZoom) {
        const dataZoomArray = Array.isArray(libraryOptions.dataZoom)
          ? libraryOptions.dataZoom
          : [libraryOptions.dataZoom];
        dataZoomArray.forEach((dz: any) => {
          dz.show = false;
        });
      }
      return;
    }

    // Instanciar o configurar el array de dataZoom
    libraryOptions.dataZoom = libraryOptions.dataZoom || [];
    const dataZoomArray = Array.isArray(libraryOptions.dataZoom)
      ? libraryOptions.dataZoom
      : [libraryOptions.dataZoom];

    // Si la leyenda también está abajo, subimos el dataZoom un poco más para que no colisionen
    const legendAtBottom = hasLegend && (options.legends.position || "bottom").toLowerCase() === "bottom";
    const dataZoomBottom = legendAtBottom ? 40 : 15;

    const sliderIndex = dataZoomArray.findIndex(
      (dz: any) => dz.type === "slider" || dz.type === undefined
    );

    const layoutConfig = {
      show: true,
      bottom: dataZoomBottom,
      height: this.config.navigatorHeight,
    };

    if (sliderIndex >= 0) {
      dataZoomArray[sliderIndex] = { ...dataZoomArray[sliderIndex], ...layoutConfig };
    } else {
      dataZoomArray.push(layoutConfig);
    }

    libraryOptions.dataZoom = dataZoomArray;

    // Incrementar el margen inferior acumulado del grid
    margins.bottom += this.config.navigatorHeight + this.config.navigatorSpacing;
  }

  /**
   * Calcula y acumula los offsets de diseño generados por rotación de etiquetas,
   * doble nivel de ejes y títulos de ejes.
   * @param margins Estructura de márgenes acumulativa.
   * @param options Opciones del gráfico.
   * @param chartData Datos del gráfico.
   * @param isBarChart Indica si el gráfico es de tipo barra horizontal.
   * @private
   */
  private applyAxisLayout(
    margins: Margins,
    options: ChartOptions,
    chartData: ChartData,
    isBarChart: boolean
  ): void {
    // 1. Manejo de etiquetas de categoría rotadas (gráfico vertical)
    const categoryAxisRotated = !isBarChart && options.xAxis?.rotateLabels && options.xAxis.rotateLabels !== 0;
    if (categoryAxisRotated) {
      margins.bottom += this.config.axisSpacing.rotatedLabels;
    }

    // 2. Manejo de doble eje de categoría (x2)
    const hasDualAxis = !!chartData.seriesConfig.x2;
    if (hasDualAxis) {
      if (isBarChart) {
        // En gráficos de barras horizontales, la categoría (eje Y) se duplica
        margins.left += this.config.axisSpacing.dualAxisHorizontal;
      } else {
        // En gráficos verticales, se duplica el eje X (abajo y arriba)
        margins.bottom += this.config.axisSpacing.dualAxisVertical;
      }
    }

    // 3. Espaciado por títulos de ejes
    const hasXAxisTitle = !options.xAxis?.disableAutoTitle;
    const hasYAxisTitle = typeof options.yAxis?.title === "string" && options.yAxis.title.trim().length > 0;

    if (!isBarChart) {
      if (hasXAxisTitle) {
        margins.bottom += this.config.axisSpacing.xAxisTitle;
      }
      if (hasYAxisTitle) {
        margins.left += this.config.axisSpacing.yAxisTitle;
      }
    } else {
      // Invertir el sentido para gráficos de barras horizontales
      if (hasXAxisTitle) {
        margins.left += this.config.axisSpacing.xAxisTitleBar;
      }
      if (hasYAxisTitle) {
        margins.bottom += this.config.axisSpacing.yAxisTitleBar;
      }
    }
  }

  /**
   * Escribe las dimensiones calculadas acumuladas de vuelta a la grid de ECharts.
   * @param grid Objeto grid de ECharts a mutar.
   * @param margins Dimensiones finales de márgenes.
   * @param libraryOptions Opciones de ECharts.
   * @private
   */
  private applyGridMargins(grid: any, margins: Margins, libraryOptions: EChartsOption): void {
    grid.top = margins.top;
    grid.bottom = margins.bottom;
    grid.left = margins.left;
    grid.right = margins.right;

    libraryOptions.grid = grid;
  }
}
