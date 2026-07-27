import { EChartsOption, XAXisComponentOption, YAXisComponentOption } from 'echarts';
import { Dataset } from '../../../services/dataset';
import { EC_AXIS_CONFIG } from '../../../types/constants';
import { ChartOptions } from '../../../types/data.types';
import { ChartData } from '../../utils/chart-data';
import { ChartLogicHelper } from '../../utils/chart-logic.helper';
import { LayoutResult } from './layout-manager';
import { SeriesManager } from './series-manager';
import { TooltipManager } from './tooltip-manager';

/**
 * Interface que agrupa el contexto de los ejes necesario para su configuración,
 * que incluye las opciones de renderizado y la colección procesada de datos del gráfico.
 */
export interface AxisContext {
  chartOptions: ChartOptions;
  chartData: ChartData;
  dataset?: Dataset;
  layoutResult?: LayoutResult;
}

/**
 * Clase administradora encargada de todo lo referido a la configuración de los Ejes X e Y
 * en los gráficos de ECharts. Interpola datos proporcionados por los manejadores de series
 * y tooltips para generar las estructuras finales esperadas por la librería gráfica.
 */
export class AxisManager {

  /**
   * Inicializa el administrador de Ejes
   * @param tooltipManager - Instancia del manejador de tooltips para formateo de labels.
   * @param seriesManager - Instancia del manejador de series para cálculos como el maxValue.
   */
  constructor(
    private readonly tooltipManager: TooltipManager,
    private readonly seriesManager: SeriesManager
  ) { }

  /**
   * Orquesta la configuración principal de ambos ejes (X e Y), inyectando las configuraciones 
   * resultantes dentro de las opciones de rendering nativas de la librería ECharts.
   * Maneja tanto gráficos convencionales como gráficos con rotación de ejes (barras horizontales).
   * 
   * @param libraryOptions - Referencia al objeto de opciones nativo de ECharts a mutar.
   * @param context - Contexto con opciones y datos definidos por el componente padre.
   */
  public configureAxis(
    libraryOptions: EChartsOption,
    context: AxisContext
  ): void {
    const { chartOptions, chartData, dataset, layoutResult } = context;
    if (!layoutResult) return;

    if (!chartData?.seriesConfig?.x1 || ChartLogicHelper.isDaZero(dataset)) {
      libraryOptions.xAxis = { show: false };
      libraryOptions.yAxis = { show: false };
      return;
    }

    const xAxis: any[] = [];
    const yAxis = this.createYAxis(chartOptions, layoutResult);

    if (chartData.seriesConfig.x2) {
      this.configureDualXAxis(
        xAxis,
        chartData.seriesConfig.x1,
        chartData.seriesConfig.x2,
        context,
        libraryOptions
      );
    } else {
      this.configureSingleXAxis(xAxis, context);
    }

    // Intercambia la ubicación de atributos si es un gráfico de barras horizontales
    libraryOptions.xAxis =
      chartOptions.type === 'bar'
        ? (yAxis as XAXisComponentOption)
        : xAxis;

    libraryOptions.yAxis =
      chartOptions.type === 'bar'
        ? xAxis
        : (yAxis as YAXisComponentOption);
  }

  /**
   * Calcula de forma dinámica la distancia (gap) del nombre del eje respecto a este, 
   * en función de la longitud que ocupa el valor máximo a dibujar.
   * @returns Distancia numérica recomendada para el label.
   */
  private calculateNameGap(): number {
    const maxVal = this.seriesManager ? this.seriesManager.getMaxValue() : 0;
    return Math.max(((Math.log10(Math.max(1, maxVal)) + 1) | 1) * 10, 30);
  }

  /**
   * Crea la configuración base para el Eje Y del gráfico.
   * En Echarts el eje de valores suele representarse con tipo 'value' y delega el 
   * formato del índice a la configuración designada en el Tooltip.
   */
  private createYAxis(chartOptions: ChartOptions, layoutResult: LayoutResult): any {
    const yAxisTitle = chartOptions.yAxis.title;
    const name = typeof yAxisTitle === 'string' && yAxisTitle.trim().length > 0 ? yAxisTitle : undefined;

    const isBar = chartOptions.type === 'bar';
    const maxWidth = layoutResult.axis.valueTitleMaxWidth;

    const finalNameGap = isBar
      ? layoutResult.axis.valueNameGap
      : layoutResult.axis.valueNameGap + this.calculateNameGap();

    return {
      show: chartOptions.type !== 'pie',
      type: 'value',
      name,
      nameLocation: 'center',
      nameRotate: isBar ? 0 : 90,
      nameGap: finalNameGap,
      nameTextStyle: { fontWeight: 'bold' },
      nameTruncate: {
        maxWidth: maxWidth,
        ellipsis: '...',
      },
      max: chartOptions.yAxis.max,
      axisLabel: {
        formatter: (value: string) => this.tooltipManager.formatValue(value),
      },
      tooltip: {
        show: true,
      },
      triggerEvent: true,
    };
  }

  /**
   * Configura la visualización de Doble Eje en X cuando el gráfico incluye
   * agrupaciones secundarias. Instancia dos ejes paralelos modificando el objeto de entrada `xAxis`.
   */
  private configureDualXAxis(
    xAxis: any[],
    x1: string,
    x2: string,
    context: AxisContext,
    libraryOptions: EChartsOption
  ) {
    const { chartData, layoutResult } = context;
    if (!layoutResult) return;

    const items1 = chartData.getItems(x1);
    const items2 = chartData.getItems(x2);

    const dataX1 = this.createDataX1(items1, items2);
    const dataX2 = this.createDataX2(items1, items2, context);

    // Agregar Eje X Primario (x1) y Eje X Secundario (x2) en una sola llamada
    xAxis.push(
      this.configureAxisOptions(
        structuredClone(EC_AXIS_CONFIG),
        dataX1,
        context
      ),
      this.configureAxisOptions(
        structuredClone(EC_AXIS_CONFIG),
        dataX2,
        context,
        true
      )
    );

    // Asignar el offset dinámico calculado al eje secundario de forma nativa
    xAxis[1].offset = layoutResult.axis.dualLevelOffset;

    // Ocultar la línea horizontal/vertical del eje secundario para evitar la doble línea flotante
    xAxis[1].axisLine = {
      ...(xAxis[1].axisLine || {}),
      show: false
    };

    // Usar un margen estándar para las etiquetas respecto a su offset
    xAxis[1].axisLabel = {
      ...(xAxis[1].axisLabel || {}),
      margin: 8
    };

    // Ticks conectan visualmente ambos niveles
    xAxis[1].axisTick = {
      ...(xAxis[1].axisTick || {}),
      show: true,
      length: layoutResult.axis.dualLevelOffset,
      inside: false
    };

    // Posición del título por debajo del segundo nivel
    xAxis[0].nameGap = Math.max(xAxis[0].nameGap || 0, layoutResult.axis.categoryNameGap);
  }

  /**
   * Helper para extrapolar los ítems de las agrupaciones del Eje X Primario
   */
  private createDataX1(items1: any[], items2: any[]): string[] {
    return new Array<string>().concat(...new Array(items1.length).fill(items2));
  }

  /**
   * Helper para extrapolar los ítems del Eje X Secundario basado en si posee un visualizador scrollable
   */
  private createDataX2(items1: any[], items2: any[], context: AxisContext): string[] {
    return context.chartOptions.navigator.show
      ? new Array<string>().concat(
        ...items1.map((i) => new Array(items2.length).fill(i)),
      )
      : items1;
  }

  /**
   * Agrega la configuración de un Único Eje X para el gráfico actual al listado.
   */
  private configureSingleXAxis(xAxis: any[], context: AxisContext) {
    const { chartData } = context;
    const dataX1 = chartData.getItems(chartData.seriesConfig.x1);
    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1, context));
  }

  /**
   * Aplica la personalización visual detallada que comparten tanto el Eje X Secundario como Primario.
   */
  private configureAxisOptions(
    axisOptions: any,
    data: any[],
    context: AxisContext,
    isSecondaryAxis: boolean = false
  ) {
    const { chartOptions, chartData, dataset, layoutResult } = context;
    if (!layoutResult) return axisOptions;
    const isBar = chartOptions.type === 'bar';

    // 1. Visibilidad básica y habilitación de interacción/events del eje
    axisOptions.show = chartOptions.type !== 'pie';
    axisOptions.triggerEvent = true;
    axisOptions.data = data;
    axisOptions.axisTick.show = true;
    axisOptions.tooltip = { show: true };

    // 2. Resolver y asignar el nombre (título) del eje
    axisOptions.name = this.resolveAxisName(chartOptions, chartData, dataset, isSecondaryAxis);

    // 3. Configurar el truncamiento automático del título del eje
    this.configureAxisTitleTruncate(axisOptions, isBar, layoutResult);

    // 4. Configurar posición, gap y rotación del título del eje
    this.configureAxisTitleLayout(axisOptions, isBar, layoutResult);

    // 5. Configurar truncado, ancho y rotación selectiva para las etiquetas (axisLabel)
    this.configureAxisLabels(axisOptions, chartOptions, isSecondaryAxis, layoutResult);

    // 6. Configurar la división del área y posición específica del eje secundario
    this.configureSecondaryAxisLayout(axisOptions, chartData, chartOptions.type, isSecondaryAxis, layoutResult);

    return axisOptions;
  }

  /**
   * Determina el título o nombre del eje según las dimensiones seleccionadas.
   */
  private resolveAxisName(
    chartOptions: ChartOptions,
    chartData: ChartData,
    dataset: Dataset | undefined,
    isSecondaryAxis: boolean
  ): string | null {
    if (isSecondaryAxis || chartOptions.xAxis?.disableAutoTitle) {
      return null;
    }

    const x1 = chartData.seriesConfig.x1;
    const x2 = chartData.seriesConfig.x2;
    const name1 = this.getDimensionName(x1, dataset);

    if (x2) {
      const name2 = this.getDimensionName(x2, dataset);
      return `${name1} / ${name2}`;
    }

    return name1;
  }

  /**
   * Configura las propiedades de truncado y estilo en negrita para el título del eje.
   */
  private configureAxisTitleTruncate(axisOptions: any, isBar: boolean, layoutResult: LayoutResult): void {
    const maxWidth = isBar ? layoutResult.axis.valueTitleMaxWidth : layoutResult.axis.categoryTitleMaxWidth;
    axisOptions.nameTruncate = {
      maxWidth: maxWidth,
      ellipsis: '...',
    };
    axisOptions.nameTextStyle = { fontWeight: 'bold' };
  }

  /**
   * Configura la alineación, rotación y distancia del título del eje según el tipo de gráfico.
   */
  private configureAxisTitleLayout(
    axisOptions: any,
    isBar: boolean,
    layoutResult: LayoutResult
  ): void {
    axisOptions.nameLocation = 'center';
    axisOptions.nameGap = layoutResult.axis.categoryNameGap;
    axisOptions.nameRotate = isBar ? 90 : 0;
  }

  /**
   * Configura el formateado, ancho máximo y la rotación selectiva para las etiquetas del eje.
   */
  private configureAxisLabels(
    axisOptions: any,
    chartOptions: ChartOptions,
    isSecondaryAxis: boolean,
    layoutResult: LayoutResult
  ): void {
    axisOptions.axisLabel = {
      ...(axisOptions.axisLabel || {}),
      rotate: isSecondaryAxis ? 0 : (chartOptions.xAxis?.rotateLabels ?? 0),
      overflow: 'truncate',
      ellipsis: '...',
      width: isSecondaryAxis
        ? layoutResult.axis.secondLevelLabelMaxWidth
        : layoutResult.axis.firstLevelLabelMaxWidth
    };
  }

  /**
   * Configura la cuadrícula splitArea y el desplazamiento (offset) del eje secundario.
   */
  private configureSecondaryAxisLayout(
    axisOptions: any,
    chartData: ChartData,
    chartType: string,
    isSecondaryAxis: boolean,
    layoutResult: LayoutResult
  ): void {
    axisOptions.splitArea.show = !isSecondaryAxis && !chartData.seriesConfig.x2;

    if (isSecondaryAxis) {
      axisOptions.splitArea.show = true;
      axisOptions.position = chartType === 'bar' ? 'left' : 'bottom';
      axisOptions.offset = layoutResult.axis.dualLevelOffset;
    }
  }

  /**
   * Obtiene el nombre legible de una dimensión basada en su clave de datos.
   */
  private getDimensionName(key: string, dataset?: Dataset): string {
    if (!dataset?.dimensions) {
      return key;
    }
    const dim = dataset.dimensions.find(d => dataset.getDimensionKey(d.id) === key);
    return dim ? dim.nameView : key;
  }
}
