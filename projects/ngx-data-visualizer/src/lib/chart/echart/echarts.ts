/* eslint-disable @typescript-eslint/no-explicit-any */
import { ECharts, EChartsOption } from 'echarts';
import { EC_KPI_TITLE_CONFIG, ECharts as EChartsConstants } from '../../types/constants';
import { Chart } from '../types/chart';
import { ChartConfiguration, EChartsLibraryOptions } from '../types/chart-configuration';
import { ChartLogicHelper } from '../utils/chart-logic.helper';
import { AxisContext, AxisManager } from './managers/axis-manager';
import { ExportManager } from './managers/export-manager';
import { LayoutManager } from './managers/layout-manager';
import { SeriesManager } from './managers/series-manager';
import { TooltipManager } from './managers/tooltip-manager';
import { SeriesConfigType } from './types/echart-base';

/**
 * @description
 * Clase EChart que extiende la clase base Chart para implementar gráficos usando la biblioteca ECharts.
 * Esta clase maneja la configuración, renderizado y manipulación de gráficos ECharts.
 *
 * @example
 * ```typescript
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
 * chart.render();
 * ```
 */
export class EChart extends Chart {
  /** Instancia nativa de ECharts que maneja el lienzo del gráfico. */
  public chartInstance!: ECharts;

  /** Manejador de formateo y comportamiento del tooltip. */
  private readonly tooltipManager: TooltipManager;

  /** Manejador de exportaciones (PNG, JPG, SVG, Canvas). */
  private exportManager!: ExportManager;

  /** Manejador de configuración y transformaciones de series de datos. */
  private seriesManager!: SeriesManager;

  /** Manejador de configuración de ejes cartesianos y categóricos. */
  private axisManager!: AxisManager;

  /** Manejador de distribución espacial y cálculo de grilla (layout). */
  private layoutManager!: LayoutManager;

  /** Nombre identificador heredado de la clase base. */
  override name: string = '';

  /** Opciones nativas computadas de la biblioteca ECharts. */
  override libraryOptions!: EChartsLibraryOptions;

  /** Colección de series configuradas en el gráfico. */
  override series: SeriesConfigType[] = [];

  /** Estado que indica si la instancia se encuentra ejecutando un ciclo de renderizado. */
  public isRendering: boolean = false;

  /** Estado que indica si la instancia ya ha completado al menos un renderizado inicial. */
  public hasRendered: boolean = false;

  /** Lista de series añadidas dinámicamente en caliente. */
  private addedSeries: SeriesConfigType[] = [];

  /** Copia del sufijo original de tooltip para restauración tras modo porcentual. */
  private suffixSaved: string | null = '';

  /** Copia de la cantidad original de decimales para restauración tras modo porcentual. */
  private decimalsSaved: number | null = null;

  /** Copia del valor máximo del eje Y para restauración tras modo porcentual. */
  private savedYAxisMaxValue: number | null = null;

  /** Caché para memoización de opciones calculadas. */
  private readonly optionsCache: Map<string, EChartsOption> = new Map();

  /** Timestamp del último renderizado ejecutado para control de debounce. */
  private lastRenderTime: number = 0;

  /** Identificador del temporizador activo de debounce para el renderizado. */
  private renderDebounceTimeout: number | null = null;

  /** Tiempo de espera en milisegundos para el debounce de renderizado. */
  private readonly RENDER_DEBOUNCE_MS = 100;

  constructor(public override configuration: ChartConfiguration) {
    super(configuration);
    this.tooltipManager = new TooltipManager(
      this.chartOptions.tooltip.decimals,
      this.chartOptions.tooltip.suffix,
    );
  }

  /**
   * Asigna la instancia nativa de ECharts e inicializa sus manejadores secundarios.
   * @param instance - Instancia de ECharts.
   * @throws {Error} Si la instancia es nula o indefinida.
   */
  set instance(instance: ECharts) {
    if (!instance) {
      throw new Error('La instancia de ECharts es requerida');
    }
    this.chartInstance = instance;
    this.exportManager = new ExportManager(instance);
    this.seriesManager = new SeriesManager(instance);
    this.axisManager = new AxisManager(this.tooltipManager, this.seriesManager);
    this.layoutManager = new LayoutManager();

    this.setupEventHandlers();
    this.setupFormatter();
  }

  /**
   * Configura el formateador de tooltip para las opciones actuales.
   * @private
   */
  private setupFormatter(): void {
    if (this.libraryOptions?.tooltip) {
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

    this.chartInstance.on('click', eventHandler);
    this.chartInstance.on('mouseover', eventHandler);
    this.chartInstance.on('mouseout', eventHandler);

    // Guardar el índice de la serie hovered para el tooltip
    this.chartInstance.on('mouseover', (params: any) => {
      if (params && typeof params.seriesIndex === 'number') {
        this.tooltipManager.setHoveredSeriesIndex(params.seriesIndex);
      }
    });

    this.chartInstance.on('mouseout', (params: any) => {
      if (params && typeof params.seriesIndex === 'number') {
        if (this.tooltipManager.getHoveredSeriesIndex() === params.seriesIndex) {
          this.tooltipManager.setHoveredSeriesIndex(null);
        }
      }
    });
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
    this.addedSeries = [];
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
    if (!this.addedSeries.some(s => s.name === series.name)) {
      this.addedSeries.push(series);
    }
    this.seriesManager.addSeries(series);
    this.invalidateCache();
  }

  /**
   * Elimina una serie del gráfico
   * @param series - Configuración de la serie a eliminar
   */
  delSeries(series: SeriesConfigType): void {
    this.addedSeries = this.addedSeries.filter(s => s.name !== series.name);
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
   * Alterna la visibilidad de la leyenda nativa del gráfico
   * @param show - Indica si se debe mostrar o ocultar la leyenda
   */
  override toggleLegendVisibility(show: boolean): void {
    this.chartOptions.legends.show = show;
    this.chartOptions.legends.enabled = show;
    if (this.libraryOptions) {
      (this.libraryOptions as any).legend = (this.libraryOptions as any).legend || {};
      (this.libraryOptions as any).legend.show = show;
    }

    if (this.chartInstance) {
      this.hideTooltip();
      // 1. Modificar en caliente la visibilidad de la leyenda en ECharts
      this.chartInstance.setOption({
        legend: {
          show: show
        }
      });

      // 2. Recalcular grilla (grid) reactivamente usando LayoutManager
      if (this.layoutManager) {
        const layoutResult = this.layoutManager.configureLayout(this.libraryOptions, this.chartOptions, this.chartData);
        // 3. Aplicar el grid/legend/series modificado en caliente
        const optionsUpdate: any = {
          legend: (this.libraryOptions as any).legend
        };

        if (this.chartOptions.type !== 'pie') {
          optionsUpdate.grid = (this.libraryOptions as any).grid;
        } else if (layoutResult.pie) {
          const pieResult = layoutResult.pie;
          const currentSeries = this.chartInstance.getOption()['series'];
          if (Array.isArray(currentSeries)) {
            optionsUpdate.series = currentSeries.map((s: any) => {
              if (s.type === 'pie') {
                return {
                  ...s,
                  center: pieResult.center
                  // radius no se sobreescribe: lo define EC_SERIES_CONFIG.pie
                };
              }
              return s;
            });
          }
        }

        this.chartInstance.setOption(optionsUpdate);
      }
    }

    this.invalidateCache();
  }

  /**
   * Habilita el modo porcentual.
   * @private
   */
  private enablePercentMode(): void {
    this.ensureStackedSeries();
    this.suffixSaved = this.chartOptions.tooltip.suffix;
    this.decimalsSaved = this.chartOptions.tooltip.decimals;
    this.chartOptions.tooltip.suffix = '%';
    this.chartOptions.tooltip.decimals = 2;
    this.tooltipManager.updateSuffix('%');
    this.tooltipManager.updateDecimals(2);
    this.seriesManager.summarizeTotals(this.chartData.getSeries());
    this.saveAndSetYAxisMax(100);
  }

  /**
   * Deshabilita el modo porcentual.
   * @private
   */
  private disablePercentMode(): void {
    this.unstackSeriesIfNotStacked();
    this.chartOptions.tooltip.suffix = this.suffixSaved;
    this.chartOptions.tooltip.decimals = this.decimalsSaved;
    this.tooltipManager.updateSuffix(this.suffixSaved);
    this.tooltipManager.updateDecimals(this.decimalsSaved);
    this.restoreYAxisMax();
  }

  /**
   * Asegura que las series estén apiladas.
   * @private
   */
  private ensureStackedSeries(): void {
    this.chartData.seriesConfig.stack ??= 'stack';
  }

  /**
   * Desapila las series si no están configuradas como apiladas.
   * @private
   */
  private unstackSeriesIfNotStacked(): void {
    if (!this.chartOptions.stacked) {
      this.chartData.seriesConfig.stack = null;
    }
  }

  /**
   * Guarda y establece el valor máximo del eje Y.
   * @param maxValue - Valor máximo a establecer.
   * @private
   */
  private saveAndSetYAxisMax(maxValue: number): void {
    if (this.chartOptions.yAxis.max) {
      this.savedYAxisMaxValue = this.chartOptions.yAxis.max;
    }
    this.chartOptions.yAxis.max = maxValue;
  }

  /**
   * Restaura el valor máximo del eje Y.
   * @private
   */
  private restoreYAxisMax(): void {
    this.chartOptions.yAxis.max = this.savedYAxisMaxValue;
    this.savedYAxisMaxValue = null;
  }

  /**
   * Establece los extremos del zoom (dataZoom) en el gráfico.
   * @param start - Porcentaje o índice de inicio.
   * @param end - Porcentaje o índice de fin.
   */
  setExtremes(start?: number, end?: number): void {
    if (this.chartInstance && start != null && end != null) {
      this.chartInstance.dispatchAction({
        type: 'dataZoom',
        start,
        end,
      });
    }
  }

  /**
   * Obtiene los extremos actuales del navegador (dataZoom) del gráfico.
   * @returns Los valores de inicio y fin o null si no está disponible.
   */
  getExtremes(): { start: number; end: number } | null {
    if (!this.chartInstance) return null;
    const option = this.chartInstance.getOption() as Record<string, any>;
    if (option?.['dataZoom']?.length > 0) {
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
   * Exporta el gráfico en el formato especificado.
   * @param type - Tipo de exportación ('png' | 'jpg').
   * @throws {Error} Si el tipo de exportación no es válido.
   */
  export(type: 'png' | 'jpg' = 'png'): void {
    if (!['png', 'jpg'].includes(type)) {
      throw new Error('Tipo de exportación no válido');
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
      }, this.RENDER_DEBOUNCE_MS) as any;
      return;
    }
    this.performRender();
  }

  /**
   * Realiza el renderizado del gráfico
   * @private
   */
  private performRender(): void {
    if (!this.chartInstance) return;
    this.lastRenderTime = Date.now();
    this.generateConfiguration();

    this.hideTooltip();

    this.chartInstance.setOption(this.libraryOptions, {
      notMerge: true,
      lazyUpdate: false,
    });

    if (this.chartOptions.navigator?.show && this.chartOptions.navigator?.start != null && this.chartOptions.navigator?.end != null) {
      setTimeout(() => {
        this.setExtremes(this.chartOptions.navigator.start as number, this.chartOptions.navigator.end as number);
      }, 100);
    }
  }

  /**
   * Oculta de manera segura el tooltip activo del gráfico de ECharts.
   * Se utiliza antes de realizar re-renderizados o cambios significativos de diseño
   * (como ocultar/mostrar la leyenda o recalcular el tamaño) para prevenir que
   * el tooltip quede visible en una posición incorrecta o desalineado.
   * @private
   */
  private hideTooltip(): void {
    if (this.chartInstance) {
      try {
        this.chartInstance.dispatchAction({ type: 'hideTip' });
      } catch (e) {
        // Ignorar si falla al intentar ocultar el tooltip
      }
    }
  }

  /**
   * @description
   * Orquesta la creación de la configuración completa de ECharts.
   * Modifica `libraryOptions` según el número de dimensiones activas (DA).
   * @private
   */
  private generateConfiguration(): void {
    if (ChartLogicHelper.isDaZero(this.configuration.dataset)) {
      this.generateKpiConfiguration();
      return;
    }

    this.restoreStandardTitle();
    this.generateStandardConfiguration();
  }

  /**
   * Configura las opciones de la biblioteca gráfica para mostrar la tarjeta KPI / Big Number (DA = 0).
   * @private
   */
  private generateKpiConfiguration(): void {
    const total = ChartLogicHelper.calculateConsolidatedTotal(this.chartData.dataProvider);
    const text = ChartLogicHelper.formatKpiValue(total, this.chartOptions);
    const subtext =
      typeof this.chartOptions.yAxis?.title === "string" &&
        this.chartOptions.yAxis.title.trim().length > 0
        ? this.chartOptions.yAxis.title
        : this.chartOptions.measureUnit ||
        this.chartData.seriesConfig.measure ||
        "Total";

    this.libraryOptions.series = [];
    this.libraryOptions.xAxis = { show: false };
    this.libraryOptions.yAxis = { show: false };
    this.libraryOptions.title = {
      ...EC_KPI_TITLE_CONFIG,
      text,
      subtext,
    };
  }

  /**
   * Restaura la propiedad de título estándar en `libraryOptions` cuando no se encuentra en modo KPI.
   * @private
   */
  private restoreStandardTitle(): void {
    if (typeof this.chartOptions.title === 'string' && this.chartOptions.title.trim().length > 0) {
      this.libraryOptions.title = {
        text: this.chartOptions.title,
        show: true,
      };
    } else {
      this.libraryOptions.title = {
        show: false,
      };
    }
  }

  /**
   * Genera y aplica la configuración estándar (series, layout, ejes) para gráficos cartesianos/radiales (DA >= 1).
   * @private
   */
  private generateStandardConfiguration(): void {
    const ctx = {
      chartType: this.libraryOptions['type'] as string,
      isPie: this.chartOptions.type === 'pie',
      toPercent: this.chartOptions.toPercent,
      stack: this.chartData.seriesConfig.stack,
      colors: this.chartOptions.colors,
    };

    if (this.chartOptions.toPercent) {
      this.seriesManager.summarizeTotals(this.chartData.getSeries());
    }

    let layoutResult;
    if (this.layoutManager) {
      const containerWidth =
        this.chartInstance?.getWidth() || EChartsConstants.DEFAULT_DIMENSIONS.WIDTH;
      layoutResult = this.layoutManager.configureLayout(
        this.libraryOptions,
        this.chartOptions,
        this.chartData,
        containerWidth
      );
    }

    const mainSeries = this.seriesManager.configureSeries(
      this.chartData.getSeries(),
      ctx
    );

    const allSeries = [...mainSeries, ...this.addedSeries];
    this.libraryOptions.series = allSeries;

    if (this.chartOptions.type === 'pie' && layoutResult?.pie) {
      allSeries.forEach((s: any) => {
        if (s.type === 'pie') {
          s.center = layoutResult.pie.center;
        }
      });
    }

    const axisCtx: AxisContext = {
      chartData: this.chartData,
      chartOptions: this.chartOptions,
      dataset: this.configuration.dataset,
      layoutResult: layoutResult,
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
