import { EChartsOption, XAXisComponentOption, YAXisComponentOption } from "echarts";
import { EC_AXIS_CONFIG } from "../../../types/constants";
import { ChartOptions } from "../../../types/data.types";
import { ChartData } from "../../utils/chart-data";
import { TooltipManager } from "./tooltip-manager";
import { SeriesManager } from "./series-manager";

/**
 * Interface que agrupa el contexto de los ejes necesario para su configuración,
 * que incluye las opciones de renderizado y la colección procesada de datos del gráfico.
 */
export interface AxisContext {
  chartOptions: ChartOptions;
  chartData: ChartData;
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
    private tooltipManager: TooltipManager,
    private seriesManager: SeriesManager
  ) {}

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
    const { chartOptions, chartData } = context;
    const nameGap = this.calculateNameGap();
    const xAxis: any[] = [];
    const yAxis = this.createYAxis(chartOptions, nameGap);

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
      chartOptions.type === "bar"
        ? (yAxis as XAXisComponentOption)
        : xAxis;
    
    libraryOptions.yAxis =
      chartOptions.type === "bar"
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
    return Math.max(((Math.log(Math.max(1, maxVal)) * Math.LOG10E + 1) | 1) * 10, 30);
  }

  /**
   * Crea la configuración base para el Eje Y del gráfico.
   * En Echarts el eje de valores suele representarse con tipo 'value' y delega el 
   * formato del índice a la configuración designada en el Tooltip.
   * 
   * @param chartOptions - Opciones visuales del gráfico provistas por el usario.
   * @param nameGap - Separación numérica frente al laber calculada en instantes previos.
   * @returns Configuración en formato Objeto inyectable como Eje (YAXisComponentOption).
   */
  private createYAxis(chartOptions: ChartOptions, nameGap: number): any {
    return {
      show: chartOptions.type !== "pie",
      type: "value",
      name: chartOptions.yAxis.title,
      nameLocation: "middle",
      nameGap: nameGap,
      nameTextStyle: { fontWeight: "bold" },
      max: chartOptions.yAxis.max,
      axisLabel: {
        formatter: (value: string) => this.tooltipManager.formatValue(value),
      },
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
    const { chartOptions, chartData } = context;
    const items1 = chartData.getItems(x1);
    const items2 = chartData.getItems(x2);

    const dataX1 = this.createDataX1(items1, items2);
    const dataX2 = this.createDataX2(items1, items2, context);

    // Eje X Primario (x1)
    xAxis.push(
      this.configureAxisOptions(
        JSON.parse(JSON.stringify(EC_AXIS_CONFIG)),
        dataX1,
        context
      ),
    );
    // Eje X Secundario (x2)
    xAxis.push(
      this.configureAxisOptions(
        JSON.parse(JSON.stringify(EC_AXIS_CONFIG)),
        dataX2,
        context,
        true
      ),
    );

    // Incrementa la separación del primer eje para que no colisionen los labels de ambos
    xAxis[0].nameGap = 70;
    
    // Si la barra de navegación inferior está activa, ensancha el padding de la gráfica
    if (chartOptions.navigator.show && libraryOptions.grid) {
      (libraryOptions.grid as any).bottom = 100;
    }
  }

  /**
   * Helper para extrapolar los ítems de las agrupaciones del Eje X Primario
   */
  private createDataX1(items1: any[], items2: any[]): string[] {
    return Array<string>().concat(...new Array(items1.length).fill(items2));
  }

  /**
   * Helper para extrapolar los ítems del Eje X Secundario basado en si posee un visualizador scrollable
   */
  private createDataX2(items1: any[], items2: any[], context: AxisContext): string[] {
    return context.chartOptions.navigator.show
      ? Array<string>().concat(
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
   * Aplica la personalización visual detallada que comparten tanto el Eje X Secundario como Primario,
   * incluyendo su rotación de texto, ubicación, estilos, etc, basados en `chartOptions`.
   * 
   * @param axisOptions - Opciones nativas crudas a modificar referenciadas desde la constante `EC_AXIS_CONFIG`.
   * @param data - Arrays de strings representantes de los items o ticks definidos en los ejes.
   * @param context - Contexto con el ChartData y el ChartOptions.
   * @param isSecondaryAxis - Flag booleano para definir si la inyección asume un layout secundario/inferior.
   */
  private configureAxisOptions(
    axisOptions: any,
    data: any[],
    context: AxisContext,
    isSecondaryAxis: boolean = false
  ) {
    const { chartOptions, chartData } = context;
    
    // Gráficos como las tortas ('pie') no poseen ejes
    axisOptions.show = chartOptions.type !== "pie";
    axisOptions.name = isSecondaryAxis ? null : chartOptions.xAxis.title;
    axisOptions.nameGap = chartOptions.type === "bar" ? 20 : 35;
    axisOptions.nameLocation =
      chartOptions.type === "bar" ? "end" : "middle";
    axisOptions.nameTextStyle = { fontWeight: "bold" };
    axisOptions.axisLabel.rotate = chartOptions.xAxis.rotateLabels;
    axisOptions.data = data;
    axisOptions.axisTick.show = true;
    axisOptions.splitArea.show =
      !isSecondaryAxis && !chartData.seriesConfig.x2;

    if (isSecondaryAxis) {
      axisOptions.splitArea.show = true;
      axisOptions.position =
        chartOptions.type === "bar" ? "left" : "bottom";
      axisOptions.offset = chartOptions.type === "bar" ? 60 : 30;
    }
    return axisOptions;
  }
}

