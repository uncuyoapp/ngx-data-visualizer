/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ECharts,
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";
import { Chart } from "../types/chart";
import {
  ChartConfiguration,
  EChartsLibraryOptions,
} from "../types/chart-configuration";
import { ExportManager } from "./managers/export-manager";
import { SeriesManager } from "./managers/series-manager";
import { TooltipManager } from "./managers/tooltip-manager";
import { SeriesConfigType } from "./types/echart-base";
import { EC_AXIS_CONFIG, EC_SERIES_CONFIG } from "../../types/constants";

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

  // Propiedades heredadas de la clase base Chart
  override name: string = "";
  override libraryOptions!: EChartsLibraryOptions;
  override series: SeriesConfigType[] = [];

  // Propiedades para control de renderizado
  public isRendering: boolean = false;
  public hasRendered: boolean = false;

  // Propiedades privadas para manejo interno
  private totals: number[] = []; // Almacena los totales para cálculos de porcentajes
  private suffixSaved: string | null = ""; // Guarda el sufijo original para restaurarlo
  private decimalsSaved: number | null = null; // Guarda los decimales originales para restaurarlos
  private maxValue = 0; // Valor máximo para escalado del eje
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

    // Optimización de eventos
    this.setupEventHandlers();

    (this.libraryOptions.tooltip as any).formatter = (params: any) =>
      this.tooltipManager.formatTooltip(params, this.libraryOptions);
  }

  /**
   * Obtiene la instancia actual del gráfico
   * @returns {ECharts} Instancia de ECharts
   */
  get instance(): ECharts {
    return this.chartInstance;
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
      maxValue: this.maxValue,
      toPercent: this.chartOptions.toPercent,
      totals: this.totals,
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
    if (!this.instance) {
      console.error(
        "No se puede agregar la serie: la instancia de ECharts no está inicializada",
      );
      return;
    }

    try {
      const currentSeries = this.instance.getOption()[
        "series"
      ] as SeriesConfigType[];

      // Asegurarnos de que la serie tenga el formato correcto para ECharts
      const formattedSeries = {
        ...series,
        type: series.type || "line",
        data: series.data,
        name: series.name,
        color: series.color,
        smooth: series["smooth"],
        symbol: series["symbol"],
        symbolSize: series["symbolSize"],
        lineStyle: series["lineStyle"],
      };

      // Agregar la serie al gráfico
      this.instance.setOption({ series: [...currentSeries, formattedSeries] });

      // Invalidar la caché para forzar una actualización
      this.invalidateCache();
    } catch (error) {
      console.error("Error al agregar la serie:", error);
    }
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
  expand(): void {}

  /**
   * Condensa el gráfico
   */
  condense(): void {}

  /**
   * Oculta el gráfico
   */
  hide(): void {}

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
    this.summarizeTotals(this.chartData.getSeries());
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
   * @throws {Error} Método no implementado
   */
  setExtremes(): void {
    throw new Error("Method not implemented.");
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
    }
  }

  /**
   * @description
   * Orquesta la creación de la configuración completa de ECharts.
   * Llama a los métodos para configurar las series y los ejes antes de renderizar.
   * @private
   */
  private generateConfiguration() {
    this.configureSeries(this.chartData.getSeries());
    this.configureAxis();
  }

  /**
   * @description
   * Calcula los totales para cada punto de datos a través de todas las series.
   * Este cálculo es necesario para el modo porcentual.
   * @param series - Las series de datos del gráfico.
   * @private
   */
  private summarizeTotals(series: Array<any>) {
    this.totals = [];
    series.forEach((s) => {
      (s.data as Array<any>).forEach((v, i) => {
        if (!this.totals[i]) {
          this.totals[i] = parseFloat(v[1]);
        } else {
          this.totals[i] += parseFloat(v[1]);
        }
      });
    });
  }

  /**
   * @description
   * Procesa y configura el array de series para ECharts.
   * Asigna tipos, colores, datos procesados y configuraciones de apilamiento.
   * @param series - El array de series proveniente de `ChartData`.
   * @private
   */
  private configureSeries(series: Array<any>) {
    const processedSeries = series.map((s, index) => {
      s.type = this.getChartType(this.libraryOptions["type"] as string);
      this.assignSeriesConfig(s);
      s.data = this.processSeriesData(s.data);
      this.ensureSeriesStack(s);
      this.setSeriesVisibility(s);
      this.setSeriesColor(s, index);
      return s;
    });

    this.libraryOptions.series = processedSeries;
  }

  private assignSeriesConfig(s: any) {
    type ObjectKey = keyof typeof EC_SERIES_CONFIG;
    Object.assign(s, EC_SERIES_CONFIG[s.type as ObjectKey]);
  }

  private processSeriesData(data: Array<any>) {
    return data.map((v, i) => {
      this.maxValue = Math.max(this.maxValue, v[1]);

      if (this.chartOptions.type !== "pie") {
        return this.chartOptions.toPercent
          ? (v[1] * 100) / this.totals[i]
          : v[1];
      } else {
        return this.chartOptions.toPercent
          ? { name: v[0], value: (v[1] * 100) / this.totals[i] }
          : { name: v[0], value: v[1] };
      }
    });
  }

  private ensureSeriesStack(s: any) {
    if (!s.stack && this.chartData.seriesConfig.stack) {
      s.stack = this.chartData.seriesConfig.stack;
    }
  }

  private setSeriesVisibility(s: any) {
    s.visible = true;
  }

  private setSeriesColor(s: any, index: number) {
    if (!s.color && s.type !== "pie" && this.chartOptions.colors) {
      s.color =
        this.chartOptions.colors[index % this.chartOptions.colors.length];
    }
  }

  private getChartType(type: string) {
    switch (type) {
      case "bar":
      case "column":
        return "bar";
      case "area":
      case "areaspline":
      case "spline":
        return "line";
      default:
        return type;
    }
  }

  private configureAxisOptions(
    axisOptions: any,
    data: any[],
    isSecondaryAxis: boolean = false,
  ) {
    axisOptions.show = this.chartOptions.type !== "pie";
    axisOptions.name = isSecondaryAxis ? null : this.chartOptions.xAxis.title;
    axisOptions.nameGap = this.chartOptions.type === "bar" ? 20 : 35;
    axisOptions.nameLocation =
      this.chartOptions.type === "bar" ? "end" : "middle";
    axisOptions.nameTextStyle = { fontWeight: "bold" };
    axisOptions.axisLabel.rotate = this.chartOptions.xAxis.rotateLabels;
    axisOptions.data = data;
    axisOptions.axisTick.show = true;
    axisOptions.splitArea.show =
      !isSecondaryAxis && !this.chartData.seriesConfig.x2;

    if (isSecondaryAxis) {
      // axisOptions.axisLabel.rotate = 45;
      axisOptions.splitArea.show = true;

      axisOptions.position =
        this.chartOptions.type === "bar" ? "left" : "bottom";
      axisOptions.offset = this.chartOptions.type === "bar" ? 60 : 30;
    }
    return axisOptions;
  }

  /**
   * @description
   * Configura los ejes X e Y del gráfico.
   * Maneja la lógica para ejes simples, dobles e invierte los ejes para gráficos de barras.
   * @private
   */
  private configureAxis() {
    const nameGap = this.calculateNameGap();
    const xAxis: any[] = [];
    const yAxis = this.createYAxis(nameGap);

    if (this.chartData.seriesConfig.x2) {
      this.configureDualXAxis(
        xAxis,
        this.chartData.seriesConfig.x1,
        this.chartData.seriesConfig.x2,
      );
    } else {
      this.configureSingleXAxis(xAxis);
    }

    this.libraryOptions.xAxis =
      this.chartOptions.type === "bar"
        ? (yAxis as XAXisComponentOption)
        : xAxis;
    this.libraryOptions.yAxis =
      this.chartOptions.type === "bar"
        ? xAxis
        : (yAxis as YAXisComponentOption);
  }

  private calculateNameGap(): number {
    return Math.max(((Math.log(this.maxValue) * Math.LOG10E + 1) | 1) * 10, 30);
  }

  private createYAxis(nameGap: number): any {
    return {
      show: this.chartOptions.type !== "pie",
      type: "value",
      name: this.chartOptions.yAxis.title,
      nameLocation: "middle",
      nameGap: nameGap,
      nameTextStyle: { fontWeight: "bold" },
      max: this.chartOptions.yAxis.max,
      axisLabel: {
        formatter: (value: string) => this.formatValue(value),
      },
    };
  }

  /**
   * Formatea un valor numérico
   */
  private formatValue(value: string): string {
    if (!value) {
      return "-";
    }
    const returnValue = parseFloat(value).toLocaleString("es-AR", {
      useGrouping: true,
    });
    return this.chartOptions.tooltip.suffix
      ? returnValue + " " + this.chartOptions.tooltip.suffix
      : returnValue;
  }

  private configureDualXAxis(xAxis: any[], x1: string, x2: string) {
    const items1 = this.chartData.getItems(x1);
    const items2 = this.chartData.getItems(x2);

    const dataX1 = this.createDataX1(items1, items2);
    const dataX2 = this.createDataX2(items1, items2);

    xAxis.push(
      this.configureAxisOptions(
        JSON.parse(JSON.stringify(EC_AXIS_CONFIG)),
        dataX1,
      ),
    );
    xAxis.push(
      this.configureAxisOptions(
        JSON.parse(JSON.stringify(EC_AXIS_CONFIG)),
        dataX2,
        true,
      ),
    );

    xAxis[0].nameGap = 70;
    if (this.chartOptions.navigator.show) {
      (this.libraryOptions.grid as any).bottom = 100;
    }
  }

  private createDataX1(items1: any[], items2: any[]): string[] {
    return Array<string>().concat(...new Array(items1.length).fill(items2));
  }

  private createDataX2(items1: any[], items2: any[]): string[] {
    return this.chartOptions.navigator.show
      ? Array<string>().concat(
          ...items1.map((i) => new Array(items2.length).fill(i)),
        )
      : items1;
  }

  private configureSingleXAxis(xAxis: any[]) {
    const dataX1 = this.chartData.getItems(this.chartData.seriesConfig.x1);
    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1));
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
