import { DIMENSION_VALUE } from '../../../types/constants';
import { ChartType, PercentTransformationResult } from '../../../types/data.types';
import { ChartLogicHelper } from '../../utils/chart-logic.helper';
import { EChart } from '../echarts';

/**
 * @description
 * Representa el estado respaldado de las opciones del gráfico antes de aplicar
 * la transformación a modo porcentual, utilizado para restaurar el estado original.
 */
export interface BackupState {
  type: ChartType;
  stacked: number | 'all' | null;
  yAxisTitle: string;
  yAxisMax: number | null;
  tooltipShowPercentage?: boolean;
  tooltipShowTotal: boolean;
  tooltipShared: boolean;
  seriesConfigStack?: string | null;
  libraryOptionsTooltip?: {
    trigger?: string;
    shared?: boolean;
    showPercentage?: boolean;
    showTotal?: boolean;
  };
}

/**
 * @description Estructura interna para opciones personalizadas del tooltip de ECharts.
 * @internal
 */
interface CustomTooltipOptions {
  trigger?: string;
  shared?: boolean;
  showPercentage?: boolean;
  showTotal?: boolean;
}

/**
 * @description Estructura interna para opciones personalizadas de las series de ECharts.
 * @internal
 */
interface CustomSeriesOptions {
  areaStyle?: Record<string, unknown>;
  emphasis?: Record<string, unknown>;
}

/**
 * @description Extensión interna de `libraryOptions` para acceder de forma segura a propiedades de ECharts.
 * @internal
 */
interface EChartsLibraryOptionsExt {
  tooltip?: CustomTooltipOptions;
  series?: CustomSeriesOptions[];
  [key: string]: unknown;
}

/**
 * @description
 * Módulo desacoplado encargado de gestionar la validación, respaldo,
 * mutación visual y restauración del gráfico al conmutar el modo porcentual.
 * @internal
 */
export class PercentTransformer {
  private backupState: BackupState | null = null;

  /**
   * @description Consulta si el gráfico actualmente tiene un estado respaldado (ya fue procesado).
   * @returns `true` si existe un estado respaldado, `false` en caso contrario.
   */
  public isProcessed(): boolean {
    return this.backupState !== null;
  }

  /**
   * @description Valida si el gráfico es apto para la transformación a modo porcentual.
   * @param chart Instancia de `EChart` a validar.
   * @returns `null` si la validación es exitosa, o un objeto `PercentTransformationResult` con el código de error.
   */
  public validate(chart: EChart): PercentTransformationResult | null {
    const dataProvider = chart.chartData?.dataProvider;
    const data = dataProvider?.getData() || [];

    if (!dataProvider || data.length === 0) {
      return {
        success: false,
        code: 'EMPTY_DATASET',
        message: 'El conjunto de datos está vacío.',
      };
    }

    if (chart.configuration?.dataset?.isPercent) {
      return {
        success: false,
        code: 'ALREADY_PERCENT',
        message: 'El gráfico ya se encuentra en formato porcentual.',
      };
    }

    const chartTypeStr = chart.chartOptions?.type as string;
    if (chartTypeStr === 'kpi' || ChartLogicHelper.isDaZero(chart.configuration?.dataset)) {
      return {
        success: false,
        code: 'KPI_NO_DIMENSION',
        message: 'Los gráficos KPI (sin dimensión) no soportan la transformación porcentual.',
      };
    }

    if (chart.chartOptions?.type === 'pie') {
      return {
        success: false,
        code: 'INTRINSIC_PERCENT',
        message: 'Los gráficos de torta/torta apilada ya son intrínsecamente porcentuales.',
      };
    }

    const series = chart.chartData?.getSeries() || [];
    if (series.length <= 1) {
      return {
        success: false,
        code: 'SINGLE_SERIES',
        message: 'Se requieren al menos 2 series para calcular la distribución porcentual.',
      };
    }

    const hasNegatives = data.some((row) => {
      const val = row[DIMENSION_VALUE];
      const num = typeof val === 'number' ? val : Number.parseFloat(String(val ?? 0));
      return !Number.isNaN(num) && num < 0;
    });

    const isStacked = chart.chartOptions?.stacked !== null && chart.chartOptions?.stacked !== undefined;
    if (hasNegatives && isStacked) {
      return {
        success: false,
        code: 'NEGATIVE_VALUES_STACKED',
        message: 'No se puede porcentualizar un gráfico apilado con valores negativos.',
      };
    }

    return null;
  }

  /**
   * @description Modifica las opciones del gráfico para activar o desactivar el modo porcentual.
   * @param chart Instancia de `EChart` a procesar.
   * @param enable Parámetro opcional para forzar activación (`true`) o desactivación (`false`).
   * @returns Resultado del proceso de transformación.
   */
  public process(chart: EChart, enable?: boolean): PercentTransformationResult {
    const currentPercentMode = !!chart.chartOptions?.toPercent;
    const targetMode = enable ?? !currentPercentMode;

    return targetMode ? this.enablePercentMode(chart) : this.disablePercentMode(chart);
  }

  /**
   * @description Activa el modo porcentual en el gráfico tras respaldar su estado actual y aplicar las opciones correspondientes.
   * @param chart Instancia de `EChart` a transformar.
   * @returns Resultado del intento de activación.
   */
  private enablePercentMode(chart: EChart): PercentTransformationResult {
    const validationError = this.validate(chart);
    if (validationError) {
      chart.chartOptions.toPercent = false;
      return validationError;
    }

    this.ensureBackupState(chart);
    this.applyPercentChartOptions(chart);
    this.applyPercentSeriesAndTooltip(chart);

    return { success: true };
  }

  /**
   * @description Desactiva el modo porcentual restaurando el estado previamente respaldado.
   * @param chart Instancia de `EChart` a restaurar.
   * @returns Resultado de la desactivación.
   */
  private disablePercentMode(chart: EChart): PercentTransformationResult {
    if (this.backupState) {
      this.restoreStateFromBackup(chart);
    }
    chart.chartOptions.toPercent = false;
    return { success: true };
  }

  /**
   * @description Garantiza la creación de un respaldo de las propiedades del gráfico si aún no existe.
   * @param chart Instancia de `EChart` de la cual extraer el estado.
   */
  private ensureBackupState(chart: EChart): void {
    if (this.backupState) {
      return;
    }

    const libTooltip = ((chart.libraryOptions as EChartsLibraryOptionsExt)?.tooltip || {});
    this.backupState = {
      type: chart.chartOptions.type,
      stacked: chart.chartOptions.stacked,
      yAxisTitle: chart.chartOptions.yAxis.title,
      yAxisMax: chart.chartOptions.yAxis.max,
      tooltipShowPercentage: chart.chartOptions.tooltip.showPercentage,
      tooltipShowTotal: chart.chartOptions.tooltip.showTotal,
      tooltipShared: chart.chartOptions.tooltip.shared,
      seriesConfigStack: chart.chartData?.seriesConfig?.stack ?? null,
      libraryOptionsTooltip: {
        trigger: libTooltip.trigger,
        shared: libTooltip.shared,
        showPercentage: libTooltip.showPercentage,
        showTotal: libTooltip.showTotal,
      },
    };
  }

  /**
   * @description Aplica las configuraciones de opciones globales requeridas para el modo porcentual en el gráfico.
   * @param chart Instancia de `EChart` a configurar.
   */
  private applyPercentChartOptions(chart: EChart): void {
    chart.chartOptions.toPercent = true;
    chart.chartOptions.yAxis.title = 'Porcentaje';
    chart.chartOptions.yAxis.max = 100;
    chart.chartOptions.tooltip.showPercentage = true;
    chart.chartOptions.tooltip.showTotal = true;
    chart.chartOptions.tooltip.shared = true;

    if (!chart.chartOptions.stacked) {
      chart.chartOptions.stacked = 'all';
    }

    if (chart.chartOptions.type === 'line' || chart.chartOptions.type === 'spline') {
      chart.chartOptions.type = chart.chartOptions.type === 'spline' ? 'areaspline' : 'area';
      if (!chart.chartOptions.stacked) {
        chart.chartOptions.stacked = 'all';
      }
    }
  }

  /**
   * @description Configura los estilos de serie (área) y las opciones del tooltip específicas de la librería.
   * @param chart Instancia de `EChart` a ajustar.
   */
  private applyPercentSeriesAndTooltip(chart: EChart): void {
    if (chart.chartOptions.type === 'area' || chart.chartOptions.type === 'areaspline') {
      this.configureAreaSeries(chart);
    }

    if (chart.libraryOptions) {
      this.configureLibraryTooltip(chart);
    }

    this.configureSeriesConfigStack(chart);
  }

  /**
   * @description Aplica estilos de área y énfasis a la lista de series del gráfico.
   * @param chart Instancia de `EChart` con las series a modificar.
   */
  private configureAreaSeries(chart: EChart): void {
    const seriesList = (chart.libraryOptions as EChartsLibraryOptionsExt)?.series;
    if (!Array.isArray(seriesList)) {
      return;
    }

    seriesList.forEach((s) => {
      s.areaStyle = s.areaStyle || {};
      s.emphasis = s.emphasis || { focus: 'series' };
    });
  }

  /**
   * @description Configura las propiedades del tooltip en `libraryOptions` para mostrar porcentajes y totales.
   * @param chart Instancia de `EChart` a actualizar.
   */
  private configureLibraryTooltip(chart: EChart): void {
    const libOptions = chart.libraryOptions as EChartsLibraryOptionsExt;
    libOptions.tooltip = libOptions.tooltip || {};
    const libTooltip = libOptions.tooltip;

    libTooltip.trigger = chart.chartOptions.type === 'pie' ? 'item' : 'axis';
    libTooltip.shared = true;
    libTooltip.showPercentage = true;
    libTooltip.showTotal = true;
  }

  /**
   * @description Define la propiedad `stack` en `seriesConfig` según el tipo de apilado configurado en el gráfico.
   * @param chart Instancia de `EChart` a ajustar.
   */
  private configureSeriesConfigStack(chart: EChart): void {
    if (!chart.chartData?.seriesConfig) {
      return;
    }

    if (!chart.chartData.seriesConfig.stack) {
      const stacked = chart.chartOptions.stacked;
      if (stacked === 'all') {
        chart.chartData.seriesConfig.stack = 'all';
      } else if (stacked) {
        chart.chartData.seriesConfig.stack = String(stacked);
      } else {
        chart.chartData.seriesConfig.stack = null;
      }
    }
  }

  /**
   * @description Restaura las opciones del gráfico, el tooltip y la configuración de apilado a partir del estado respaldado.
   * @param chart Instancia de `EChart` a restaurar.
   */
  private restoreStateFromBackup(chart: EChart): void {
    if (!this.backupState) {
      return;
    }

    chart.chartOptions.type = this.backupState.type;
    chart.chartOptions.stacked = this.backupState.stacked;
    chart.chartOptions.yAxis.title = this.backupState.yAxisTitle;
    chart.chartOptions.yAxis.max = this.backupState.yAxisMax;
    chart.chartOptions.tooltip.showPercentage = this.backupState.tooltipShowPercentage;
    chart.chartOptions.tooltip.showTotal = this.backupState.tooltipShowTotal;
    chart.chartOptions.tooltip.shared = this.backupState.tooltipShared;

    if (chart.chartData?.seriesConfig) {
      chart.chartData.seriesConfig.stack = this.backupState.seriesConfigStack ?? null;
    }

    if (chart.libraryOptions && this.backupState.libraryOptionsTooltip) {
      this.restoreLibraryTooltip(chart, this.backupState.libraryOptionsTooltip);
    }

    if (this.backupState.type === 'line' || this.backupState.type === 'spline') {
      this.removeAreaSeriesStyle(chart);
    }

    this.backupState = null;
  }

  /**
   * @description Restaura los valores respaldados de las opciones de tooltip en `libraryOptions`.
   * @param chart Instancia de `EChart` donde se aplicará la restauración.
   * @param backupLib Copia de respaldo de las opciones de tooltip de la librería.
   */
  private restoreLibraryTooltip(chart: EChart, backupLib: NonNullable<BackupState['libraryOptionsTooltip']>): void {
    const libOptions = chart.libraryOptions as EChartsLibraryOptionsExt;
    libOptions.tooltip = libOptions.tooltip || {};
    const libTooltip = libOptions.tooltip;

    if (backupLib.trigger !== undefined) libTooltip.trigger = backupLib.trigger;
    if (backupLib.shared !== undefined) libTooltip.shared = backupLib.shared;
    if (backupLib.showPercentage !== undefined) libTooltip.showPercentage = backupLib.showPercentage;
    if (backupLib.showTotal !== undefined) libTooltip.showTotal = backupLib.showTotal;
  }

  /**
   * @description Elimina los estilos de área (`areaStyle`) añadidos a las series al revertir gráficos de líneas/spline.
   * @param chart Instancia de `EChart` a revertir.
   */
  private removeAreaSeriesStyle(chart: EChart): void {
    const seriesList = (chart.libraryOptions as EChartsLibraryOptionsExt)?.series;
    if (!Array.isArray(seriesList)) {
      return;
    }

    seriesList.forEach((s) => {
      delete s.areaStyle;
    });
  }
}
