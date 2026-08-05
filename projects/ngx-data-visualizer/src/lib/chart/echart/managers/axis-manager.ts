import { EChartsOption, XAXisComponentOption, YAXisComponentOption } from 'echarts';
import { Dataset } from '../../../services/dataset';
import { EC_AXIS_CONFIG } from '../../../types/constants';
import { ChartOptions } from '../../../types/data.types';
import { ChartData } from '../../utils/chart-data';
import { ChartLogicHelper } from '../../utils/chart-logic.helper';
import { LayoutResult } from './layout-manager';
import { SeriesManager } from './series-manager';

/**
 * @description Interfaz que agrupa el contexto de los ejes necesario para su configuración,
 * que incluye las opciones de renderizado y la colección procesada de datos del gráfico.
 */
export interface AxisContext {
  /** @description Opciones genéricas del gráfico definidas por el usuario. */
  chartOptions: ChartOptions;
  /** @description Instancia con los datos procesados del gráfico. */
  chartData: ChartData;
  /** @description Conjunto de datos opcional con metadatos y dimensiones. */
  dataset?: Dataset;
  /** @description Resultado del cálculo dinámico de márgenes y layout. */
  layoutResult?: LayoutResult;
}

/**
 * @description
 * Clase administradora encargada de todo lo referido a la configuración de los Ejes X e Y
 * en los gráficos de ECharts. Interpola datos proporcionados por los manejadores de series
 * para generar las estructuras finales esperadas por la librería gráfica.
 */
export class AxisManager {

  /**
   * @description Crea la instancia del gestor de ejes de ECharts.
   * @param seriesManager - Instancia del manejador de series para cálculos como el maxValue.
   */
  constructor(
    private readonly seriesManager: SeriesManager
  ) { }

  /**
   * @description Orquesta la configuración principal de ambos ejes (X e Y), inyectando las configuraciones 
   * resultantes dentro de las opciones de rendering nativas de la librería ECharts.
   * Maneja tanto gráficos convencionales como gráficos con rotación de ejes (barras horizontales).
   * @param libraryOptions - Referencia al objeto de opciones nativo de ECharts a mutar.
   * @param context - Contexto con opciones y datos definidos por el componente padre.
   * @public
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xAxis: any[] = [];
    const yAxis = this.createYAxis(chartOptions, layoutResult);

    if (chartData.seriesConfig.x2) {
      this.configureDualXAxis(
        xAxis,
        chartData.seriesConfig.x1,
        chartData.seriesConfig.x2,
        context
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
   * @description Calcula de forma dinámica la distancia (gap) del nombre del eje respecto a este, 
   * en función de la longitud que ocupa el valor máximo a dibujar.
   * @returns Distancia numérica recomendada para el label.
   * @private
   */
  private calculateNameGap(): number {
    const maxVal = this.seriesManager ? this.seriesManager.getMaxValue() : 0;
    return Math.max(((Math.log10(Math.max(1, maxVal)) + 1) | 1) * 10, 30);
  }

  /**
   * @description Crea la configuración base para el Eje Y del gráfico.
   * En ECharts el eje de valores se representa con tipo 'value' y formatea las marcas
   * de forma nativa sin concatenar sufijos (los cuales se reservan para el Tooltip).
   * @param chartOptions - Opciones de configuración del gráfico.
   * @param layoutResult - Resultados del cálculo dinámico de layout.
   * @returns Objeto de opciones de configuración del eje Y para ECharts.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      tooltip: {
        show: true,
      },
      triggerEvent: true,
    };
  }

  /**
   * @description Configura la visualización de Doble Eje en X cuando el gráfico incluye
   * agrupaciones secundarias. Instancia dos ejes paralelos modificando el objeto de entrada `xAxis`.
   * @param xAxis - Arreglo de configuración de ejes X a poblar.
   * @param x1 - Clave de la dimensión primaria.
   * @param x2 - Clave de la dimensión secundaria.
   * @param context - Contexto de los ejes.
   * @private
   */
  private configureDualXAxis(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    xAxis: any[],
    x1: string,
    x2: string,
    context: AxisContext
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

    // Estirar los ticks del Eje Primario (nivel 0, y=0) hacia abajo la distancia exacta del offset
    // para que funcionen como divisores verticales continuos que conectan con el segundo nivel
    xAxis[0].axisTick = {
      ...(xAxis[0].axisTick || {}),
      show: true,
      length: layoutResult.axis.dualLevelOffset
    };

    // Ticks cortos estándar en el Eje Secundario (nivel 1) apuntando hacia afuera (inside: false)
    // para enmarcar limpiamente los bloques de categorías superiores sin colisionar con el título
    xAxis[1].axisTick = {
      ...(xAxis[1].axisTick || {}),
      show: true,
      inside: false
    };

    // Posición del título por debajo del segundo nivel
    xAxis[0].nameGap = Math.max(xAxis[0].nameGap || 0, layoutResult.axis.categoryNameGap);
  }

  /**
   * @description Extrapola y construye la lista de ítems para el primer nivel del eje X primario.
   * @param items1 - Ítems de la dimensión primaria.
   * @param items2 - Ítems de la dimensión secundaria.
   * @returns Arreglo extrapolado de datos para el eje primario.
   * @private
   */
  private createDataX1(items1: (string | number)[], items2: (string | number)[]): (string | number)[] {
    return new Array<string | number>().concat(...new Array(items1.length).fill(items2));
  }

  /**
   * @description Extrapola y construye la lista de ítems para el segundo nivel del eje X secundario.
   * @param items1 - Ítems de la dimensión primaria.
   * @param items2 - Ítems de la dimensión secundaria.
   * @param context - Contexto de los ejes.
   * @returns Arreglo extrapolado de datos para el eje secundario.
   * @private
   */
  private createDataX2(items1: (string | number)[], items2: (string | number)[], context: AxisContext): (string | number)[] {
    return context.chartOptions.navigator.show
      ? new Array<string | number>().concat(
        ...items1.map((i) => new Array(items2.length).fill(i)),
      )
      : items1;
  }

  /**
   * @description Agrega la configuración de un único eje X para el gráfico actual al listado.
   * @param xAxis - Arreglo de configuración de ejes X a poblar.
   * @param context - Contexto de los ejes.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configureSingleXAxis(xAxis: any[], context: AxisContext) {
    const { chartData } = context;
    const dataX1 = chartData.getItems(chartData.seriesConfig.x1);
    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1, context));
  }

  /**
   * @description Aplica la personalización visual detallada que comparten tanto el eje X secundario como primario.
   * @param axisOptions - Objeto base de opciones del eje a personalizar.
   * @param data - Arreglo de datos asignado al eje.
   * @param context - Contexto de los ejes.
   * @param isSecondaryAxis - Indica si el eje corresponde a un nivel secundario (por defecto false).
   * @returns Objeto de opciones del eje configurado.
   * @private
   */
  private configureAxisOptions(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    axisOptions: any,
    data: unknown[],
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
    axisOptions.axisTick = { ...(axisOptions.axisTick || {}), show: true };
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
   * @description Determina el título o nombre del eje según las dimensiones seleccionadas.
   * @param chartOptions - Opciones de configuración del gráfico.
   * @param chartData - Datos procesados del gráfico.
   * @param dataset - Conjunto de datos opcional.
   * @param isSecondaryAxis - Indica si es un eje secundario.
   * @returns Nombre formateado del eje o null si está deshabilitado.
   * @private
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
   * @description Configura las propiedades de truncado y estilo en negrita para el título del eje.
   * @param axisOptions - Objeto de opciones del eje a mutar.
   * @param isBar - Indica si el gráfico es de barras horizontales.
   * @param layoutResult - Resultado del cálculo dinámico de layout.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configureAxisTitleTruncate(axisOptions: any, isBar: boolean, layoutResult: LayoutResult): void {
    const maxWidth = isBar ? layoutResult.axis.valueTitleMaxWidth : layoutResult.axis.categoryTitleMaxWidth;
    axisOptions.nameTruncate = {
      maxWidth: maxWidth,
      ellipsis: '...',
    };
    axisOptions.nameTextStyle = { fontWeight: 'bold' };
  }

  /**
   * @description Configura la posición, rotación y separación del título del eje.
   * @param axisOptions - Objeto de opciones del eje a mutar.
   * @param isBar - Indica si el gráfico es de barras horizontales.
   * @param layoutResult - Resultado del cálculo dinámico de layout.
   * @private
   */
  private configureAxisTitleLayout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    axisOptions: any,
    isBar: boolean,
    layoutResult: LayoutResult
  ): void {
    axisOptions.nameLocation = 'center';
    axisOptions.nameGap = layoutResult.axis.categoryNameGap;
    axisOptions.nameRotate = isBar ? 90 : 0;
  }

  /**
   * @description Configura el truncado, ancho máximo y rotación de las etiquetas de texto del eje.
   * @param axisOptions - Objeto de opciones del eje a mutar.
   * @param chartOptions - Opciones de configuración del gráfico.
   * @param isSecondaryAxis - Indica si es un eje secundario.
   * @param layoutResult - Resultado del cálculo dinámico de layout.
   * @private
   */
  private configureAxisLabels(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      hideOverlap: false,
      width: isSecondaryAxis
        ? layoutResult.axis.secondLevelLabelMaxWidth
        : layoutResult.axis.firstLevelLabelMaxWidth
    };
  }

  /**
   * @description Configura la división de áreas visuales (splitArea) y posición específica para el eje secundario.
   * @param axisOptions - Objeto de opciones del eje a mutar.
   * @param chartData - Datos procesados del gráfico.
   * @param chartType - Tipo de gráfico.
   * @param isSecondaryAxis - Indica si es un eje secundario.
   * @param layoutResult - Resultado del cálculo dinámico de layout.
   * @private
   */
  private configureSecondaryAxisLayout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    axisOptions: any,
    chartData: ChartData,
    chartType: string,
    isSecondaryAxis: boolean,
    layoutResult: LayoutResult
  ): void {
    axisOptions.splitArea = axisOptions.splitArea || {};
    axisOptions.splitArea.show = !isSecondaryAxis && !chartData.seriesConfig.x2;

    if (isSecondaryAxis) {
      axisOptions.splitArea.show = true;
      axisOptions.position = chartType === 'bar' ? 'left' : 'bottom';
      axisOptions.offset = layoutResult.axis.dualLevelOffset;
    }
  }

  /**
   * @description Obtiene el nombre legible de una dimensión basada en su clave de datos consultando el dataset.
   * @param key - Clave identificatoria de la dimensión.
   * @param dataset - Conjunto de datos opcional.
   * @returns Nombre de vista legible de la dimensión o la clave por defecto.
   * @private
   */
  private getDimensionName(key: string, dataset?: Dataset): string {
    if (!dataset?.dimensions) {
      return key;
    }
    const dim = dataset.dimensions.find(d => dataset.getDimensionKey(d.id) === key);
    return dim ? dim.nameView : key;
  }
}
