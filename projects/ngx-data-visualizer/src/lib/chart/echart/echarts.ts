/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ECharts,
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";
import { EC_AXIS_CONFIG, EC_SERIES_CONFIG } from "../../types/constants";
import { Chart } from "../types/chart";
import {
  ChartConfiguration,
  EChartsLibraryOptions,
} from "../types/chart-configuration";
import { ExportManager } from "./managers/export-manager";
import { SeriesManager } from "./managers/series-manager";
import { TooltipManager } from "./managers/tooltip-manager";
import { AxisManager, AxisContext } from "./managers/axis-manager";
import { SeriesConfigType } from "./types/echart-base";

/**
 * Clase EChart que extiende la clase base Chart para implementar gráficos usando la biblioteca ECharts.
 * Esta clase maneja la configuración, renderizado y manipulación de gráficos ECharts.
 *
 * @example
 * ```typescript
 * // Crear una instancia de EChart
 * const config: ChartConfiguration = {
 *   type: 'bar',
 *   data: {
 *     series: [
 *       { name: 'Serie 1', data: [[0, 10], [1, 20], [2, 30]] }
 *     ],
 *     seriesConfig: { x1: 'categoría' }
 *   },
 *   options: {
 *     xAxis: { title: 'Categorías' },
 *     yAxis: { title: 'Valores' }
 *   }
 * };
 * const chart = new EChart(config);
 *
 * // Renderizar el gráfico
 * chart.render();
 *
 * // Exportar a SVG
 * const svg = chart.export('svg');
 * ```
 *
 * @param configuration - Configuración del gráfico
 * @property {string} configuration.type - Tipo de gráfico ('bar', 'line', 'pie', etc.)
 * @property {object} configuration.data - Datos del gráfico
 * @property {Array<SeriesConfigType>} configuration.data.series - Series de datos
 * @property {object} configuration.data.seriesConfig - Configuración de series
 * @property {object} configuration.options - Opciones de visualización
 *
 * @limitations
 * - El modo porcentual solo funciona con series apiladas
 * - La exportación a JPG puede tener problemas con gráficos muy grandes
 * - El tooltip personalizado no soporta HTML complejo
 * - El redimensionamiento automático puede ser lento con muchos datos
 *
 * @performance
 * - Se implementa memoización para cálculos costosos
 * - Se usa debounce para reducir redibujados
 * - Se optimiza el manejo de eventos
 *
 * @see {@link Chart} Clase base
 * @see {@link SeriesManager} Gestión de series
 * @see {@link TooltipManager} Gestión de tooltips
 * @see {@link ExportManager} Gestión de exportación
 */
export class EChart extends Chart {
  // Instancia de ECharts que maneja el gráfico
  public chartInstance!: ECharts;
  private readonly tooltipManager: TooltipManager;
  private exportManager!: ExportManager;
  private seriesManager!: SeriesManager;
  private axisManager!: AxisManager;

  // Propiedades heredadas de la clase base Chart
  override name: string = "";
  override libraryOptions!: EChartsLibraryOptions;
  override series: SeriesConfigType[] = [];

  // Propiedades para control de renderizado
  public isRendering: boolean = false;
  public hasRendered: boolean = false;

  // Propiedades privadas para manejo interno
  private suffixSaved: string | null = ""; // Guarda el sufijo original para restaurarlo
  private decimalsSaved: number | null = null; // Guarda los decimales originales para restaurarlos
  private savedYAxisMaxValue: number | null = null; // Guarda el valor máximo del eje Y

  // Cache para memoización
  private readonly optionsCache: Map<string, EChartsOption> = new Map();

  private lastRenderTime: number = 0;
  private renderDebounceTimeout: number | null = null;
  private readonly RENDER_DEBOUNCE_MS = 100;

  constructor(public override configuration: ChartConfiguration) {
    super(configuration);
    this.tooltipManager = new TooltipManager(
      this.chartOptions.tooltip.decimals,
      this.chartOptions.tooltip.suffix,
    );
  }

  /**
   * Getters y Setters para la instancia del gráfico
   * @param instance - Instancia de ECharts
   * @throws {Error} Si la instancia es inválida
   */
  set instance(instance: ECharts) {
    if (!instance) {
      throw new Error("La instancia de ECharts es requerida");
    }
    this.chartInstance = instance;
    this.exportManager = new ExportManager(instance);
    this.seriesManager = new SeriesManager(instance);
    this.axisManager = new AxisManager(this.tooltipManager, this.seriesManager);

    // Optimización de eventos
    this.setupEventHandlers();
    this.setupFormatter();
  }

  /**
   * Configura el formateador de tooltip para las opciones actuales.
   * @private
   */
  private setupFormatter(): void {
    if (this.libraryOptions && this.libraryOptions.tooltip) {
      (this.libraryOptions.tooltip as any).formatter = (params: any) =>
        this.tooltipManager.formatTooltip(params, this.libraryOptions);
    }
  }

  /**
   * Obtiene la instancia actual del gráfico
   * @returns {ECharts} Instancia de ECharts
   */
  get instance(): ECharts {
    return this.chartInstance;
  }

  /**
   * Actualiza la configuración interna del gráfico con una nueva instancia.
   * Sincroniza las opciones de la biblioteca, las opciones del gráfico y el gestor de tooltips.
   * @param config - Nueva configuración del gráfico
   */
  public refreshFromConfiguration(config: ChartConfiguration): void {
    this.configuration = config;
    this.libraryOptions = config.libraryOptions;
    this.chartOptions = config.options;

    if (this.tooltipManager) {
      this.tooltipManager.updateDecimals(this.chartOptions.tooltip.decimals);
      this.tooltipManager.updateSuffix(this.chartOptions.tooltip.suffix);
    }

    this.setupFormatter();
    this.invalidateCache();
  }

  /**
   * Configuración optimizada de manejadores de eventos
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.chartInstance) return;

    // Usar un solo listener para múltiples eventos
    const eventHandler = this.debounce(() => {
      this.handleChartEvent();
    }, 100);

    this.chartInstance.on("click", eventHandler);
    this.chartInstance.on("mouseover", eventHandler);
    this.chartInstance.on("mouseout", eventHandler);
  }

  /**
   * Manejo optimizado de eventos del gráfico
   * @private
   */
  private handleChartEvent(): void {
    // Implementar lógica de manejo de eventos aquí
    // Evitar operaciones costosas durante eventos frecuentes
  }

  /**
   * Métodos de gestión del ciclo de vida del gráfico
   * Limpia los recursos y cierra la instancia del gráfico
   */
  override dispose(): void {
    if (this.renderDebounceTimeout) {
      window.clearTimeout(this.renderDebounceTimeout);
    }
    this.optionsCache.clear();
    this.chartInstance.dispose();
  }

  /**
   * Obtiene las opciones actuales del gráfico con memoización
   * @returns {object} Opciones del gráfico
   */
  getOptions(): object {
    const cacheKey = this.generateCacheKey();
    if (this.optionsCache.has(cacheKey)) {
      return this.optionsCache.get(cacheKey) || {};
    }
    const options = this.chartInstance?.getOption() || {};
    this.optionsCache.set(cacheKey, options as EChartsOption);
    return options;
  }

  /**
   * Genera una clave única para el cache basada en el estado actual
   * @private
   * @returns {string} Clave del cache
   */
  private generateCacheKey(): string {
    return JSON.stringify({
      series: this.series,
      maxValue: this.seriesManager?.getMaxValue(),
      toPercent: this.chartOptions.toPercent,
      totals: this.seriesManager?.getTotals(),
    });
  }

  /**
   * Obtiene las series actuales del gráfico
   * @returns {SeriesConfigType[]} Array de series
   */
  getSeries(): SeriesConfigType[] {
    return this.seriesManager.getSeries();
  }

  /**
   * Añade una nueva serie al gráfico
   * @param series - Configuración de la serie a añadir
   */
  addSeries(series: SeriesConfigType): void {
    this.seriesManager.addSeries(series);
    this.invalidateCache();
  }

  /**
   * Elimina una serie del gráfico
   * @param series - Configuración de la serie a eliminar
   */
  delSeries(series: SeriesConfigType): void {
    this.seriesManager.deleteSeries(series);
    this.invalidateCache();
  }

  /**
   * Invalida el cache de opciones y datos
   * @private
   */
  private invalidateCache(): void {
    this.optionsCache.clear();
  }

  /**
   * Maneja el hover de una serie
   * @param series - Serie sobre la que se hace hover
   */
  hoverSeries(series: SeriesConfigType): void {
    this.seriesManager.handleHover(series);
  }

  /**
   * Maneja la selección de una serie
   * @param series - Serie a seleccionar
   */
  selectSeries(series: SeriesConfigType): void {
    this.seriesManager.handleSelection(series);
  }

  /**
   * Expande el gráfico para mejor visualización
   */
  expand(): void { }

  /**
   * Condensa el gráfico
   */
  condense(): void { }

  /**
   * Oculta el gráfico
   */
  hide(): void { }

  /**
   * Alterna el modo porcentual del gráfico
   * @throws {Error} Si el gráfico no está en modo apilado
   */
  togglePercentMode(): void {
    if (!this.chartData.seriesConfig.stack) {
      throw new Error("El modo porcentual requiere series apiladas");
    }
    this.chartOptions.toPercent = !this.chartOptions.toPercent;
    this.invalidateCache();
    if (this.chartOptions.toPercent) {
      this.enablePercentMode();
    } else {
      this.disablePercentMode();
    }
    this.render();
  }

  /**
   * Habilita el modo porcentual
   * @private
   */
  private enablePercentMode() {
    this.ensureStackedSeries();
    this.suffixSaved = this.chartOptions.tooltip.suffix;
    this.decimalsSaved = this.chartOptions.tooltip.decimals;
    this.chartOptions.tooltip.suffix = "%";
    this.chartOptions.tooltip.decimals = 2; // Por defecto 2 decimales para porcentajes
    this.tooltipManager.updateSuffix("%");
    this.tooltipManager.updateDecimals(2);
    this.seriesManager.summarizeTotals(this.chartData.getSeries());
    this.saveAndSetYAxisMax(100);
  }

  /**
   * Deshabilita el modo porcentual
   * @private
   */
  private disablePercentMode() {
    this.unstackSeriesIfNotStacked();
    this.chartOptions.tooltip.suffix = this.suffixSaved;
    this.chartOptions.tooltip.decimals = this.decimalsSaved;
    this.tooltipManager.updateSuffix(this.suffixSaved);
    this.tooltipManager.updateDecimals(this.decimalsSaved);
    this.restoreYAxisMax();
  }

  /**
   * Asegura que las series estén apiladas
   * @private
   */
  private ensureStackedSeries() {
    this.chartData.seriesConfig.stack ??= "stack";
  }

  /**
   * Desapila las series si no están configuradas como apiladas
   * @private
   */
  private unstackSeriesIfNotStacked() {
    if (!this.chartOptions.stacked) {
      this.chartData.seriesConfig.stack = null;
    }
  }

  /**
   * Guarda y establece el valor máximo del eje Y
   * @private
   * @param maxValue - Valor máximo a establecer
   */
  private saveAndSetYAxisMax(maxValue: number) {
    if (this.chartOptions.yAxis.max) {
      this.savedYAxisMaxValue = this.chartOptions.yAxis.max;
    }
    this.chartOptions.yAxis.max = maxValue;
  }

  /**
   * Restaura el valor máximo del eje Y
   * @private
   */
  private restoreYAxisMax() {
    this.chartOptions.yAxis.max = this.savedYAxisMaxValue;
    this.savedYAxisMaxValue = null;
  }

  /**
   * Establece los extremos del gráfico
   */
  setExtremes(start?: number, end?: number): void {
    if (this.chartInstance && start != null && end != null) {
      this.chartInstance.dispatchAction({
        type: "dataZoom",
        start,
        end,
      });
    }
  }

  /**
   * Obtiene los extremos del navegador del gráfico
   */
  getExtremes(): { start: number; end: number } | null {
    if (!this.chartInstance) return null;
    const option = this.chartInstance.getOption() as Record<string, any>;
    if (option && option['dataZoom'] && option['dataZoom'].length > 0) {
      const dataZoom = option['dataZoom'][0];
      if (dataZoom.start != null && dataZoom.end != null) {
        return {
          start: dataZoom.start,
          end: dataZoom.end,
        };
      }
    }
    return null;
  }

  /**
   * Exporta el gráfico en el formato especificado
   * @param type - Tipo de exportación ('svg' | 'jpg')
   * @returns {string | void} Datos del gráfico exportado
   * @throws {Error} Si el tipo de exportación no es válido
   */
  export(type: "svg" | "jpg"): string | void {
    if (!["svg", "jpg"].includes(type)) {
      throw new Error("Tipo de exportación no válido");
    }
    return this.exportManager.export(type);
  }

  /**
   * Renderiza el gráfico con optimizaciones de rendimiento
   */
  render(): void {
    const now = Date.now();
    if (now - this.lastRenderTime < this.RENDER_DEBOUNCE_MS) {
      if (this.renderDebounceTimeout) {
        window.clearTimeout(this.renderDebounceTimeout);
      }
      this.renderDebounceTimeout = window.setTimeout(() => {
        this.performRender();
      }, this.RENDER_DEBOUNCE_MS);
      return;
    }
    this.performRender();
  }

  /**
   * Realiza el renderizado del gráfico
   * @private
   */
  private performRender(): void {
    this.lastRenderTime = Date.now();
    this.generateConfiguration();
    if (this.chartInstance) {
      // this.chartInstance.clear();
      this.chartInstance.setOption(this.libraryOptions, {
        notMerge: true,
        lazyUpdate: true,
      });

      if (this.chartOptions.navigator?.show && this.chartOptions.navigator?.start != null && this.chartOptions.navigator?.end != null) {
        setTimeout(() => {
          this.setExtremes(this.chartOptions.navigator.start as number, this.chartOptions.navigator.end as number);
        }, 100);
      }
    }
  }

  /**
   * @description
   * Orquesta la creación de la configuración completa de ECharts.
   * Llama a los métodos para configurar las series y los ejes antes de renderizar.
   * @private
   */
  private generateConfiguration() {
    const ctx = {
      chartType: this.libraryOptions["type"] as string,
      isPie: this.chartOptions.type === "pie",
      toPercent: this.chartOptions.toPercent,
      stack: this.chartData.seriesConfig.stack,
      colors: this.chartOptions.colors,
    };

    if (this.chartOptions.toPercent) {
      this.seriesManager.summarizeTotals(this.chartData.getSeries());
    }

    this.libraryOptions.series = this.seriesManager.configureSeries(
      this.chartData.getSeries(),
      ctx
    );
    const axisCtx: AxisContext = {
      chartData: this.chartData,
      chartOptions: this.chartOptions,
    };
    this.axisManager.configureAxis(this.libraryOptions, axisCtx);
  }

  /**
   * Utilidad para debounce
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        func(...args);
      }, wait);
    };
  }
}
