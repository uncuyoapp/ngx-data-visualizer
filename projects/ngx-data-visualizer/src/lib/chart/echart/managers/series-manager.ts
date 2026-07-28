import { ECharts } from "echarts";
import { EC_SERIES_CONFIG } from "../../../types/constants";
import { SeriesConfigType, SeriesData } from "../types/echart-base";

/**
 * Interface con el contexto necesario para configurar las series
 */
export interface SeriesContext {
  chartType: string;
  isPie: boolean;
  toPercent: boolean;
  stack?: string | null;
  colors?: string[];
}

/**
 * Clase administradora encargada de todo lo referido al manejo y transformación de las Series
 * en los gráficos de ECharts. Acuña responsabilidades sobre adición, eliminación y 
 * selección interactiva de series. Adicionalmente, computa valores acumulados para visualizaciones en porcentajes.
 */
export class SeriesManager {
  /** Array de acumulación por cada índice de datos a través de todas las series. Usado para gráficos porcentuales. */
  private totals: number[] = [];
  /** Valor máximo hallado en las series dibujadas. Utilizado para calcular la separación dinámica del Label (NameGap). */
  private maxValue: number = 0;

  /**
   * Crea la instancia gestora de las Series de EChart.
   * @param chartInstance - Referencia a la instancia de renderizado nativa de ECharts.
   */
  constructor(private readonly chartInstance: ECharts) {}

  /**
   * Obtiene los totales acumulados por todas las series para cada índice respectivo en el eje.
   * Necesario para dibujar los gráficos porcentuales apilados.
   */
  public getTotals(): number[] {
    return this.totals;
  }

  /**
   * Obtiene el valor máximo numérico hallado iterándolo sobre todas las series renderizadas.
   */
  public getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * Obtiene todas las series del gráfico
   * @returns Array con la configuración de todas las series
   */
  getSeries(): SeriesConfigType[] {
    return (
      (this.chartInstance?.getOption()?.["series"] as SeriesConfigType[]) || []
    );
  }

  /**
   * Añade una nueva serie al gráfico
   * @param series - Configuración de la serie a añadir
   */
  addSeries(series: SeriesConfigType): void {
    if (!this.chartInstance) {
      console.error(
        "No se puede agregar la serie: la instancia de ECharts no está inicializada",
      );
      return;
    }
    try {
      const currentSeries = this.getSeries();
      
      const formattedSeries: SeriesConfigType = {
        ...series,
        type: series.type || "line",
        data: series.data,
        name: series.name,
        color: series.color,
        smooth: series["smooth"],
        symbol: series["symbol"],
        symbolSize: series["symbolSize"],
        lineStyle: series["lineStyle"],
        isReferenceSeries: series.isReferenceSeries,
      };

      this.chartInstance.setOption({ series: [...currentSeries, formattedSeries] });
    } catch (error) {
      console.error("Error al agregar la serie:", error);
    }
  }

  /**
   * Elimina una serie del gráfico
   * @param series - Configuración de la serie a eliminar
   */
  deleteSeries(series: SeriesConfigType): void {
    const currentSeries = this.getSeries();
    this.chartInstance.setOption({
      series: currentSeries.filter((cs) => cs.name !== series.name),
    });
  }

  /**
   * Maneja el hover de una serie
   * @param series - Serie sobre la que se realiza el hover
   */
  handleHover(series: SeriesConfigType): void {
    if (series.hover) {
      this.chartInstance.dispatchAction({ type: "downplay" });
    } else {
      this.chartInstance.dispatchAction({
        type: "highlight",
        seriesName: series.name,
      });
    }
    series.hover = !series.hover;
  }

  /**
   * Maneja la selección de una serie
   * @param series - Serie a seleccionar/deseleccionar
   */
  handleSelection(series: SeriesConfigType): void {
    if (series.visible) {
      this.chartInstance.dispatchAction({
        type: "legendUnSelect",
        name: series.name,
      });
    } else {
      this.chartInstance.dispatchAction({
        type: "legendSelect",
        name: series.name,
      });
    }
    series.visible = !series.visible;
  }

  /**
   * Orquesta el formato estructural de las series. Muta su formato interno 
   * inyectando las configuraciones constantes (`EC_SERIES_CONFIG`) requeridas por la biblioteca, 
   * calcula los valores porcentuales y asigna propiedades visuales tales como color y apilamiento.
   * Modifica el arreglo interno in-place.
   * 
   * @param series - Listado con la configuración funcional y de valores de las series
   * @param context - Contexto visual general del Chart encapsulado en `SeriesContext`
   * @returns El subconjunto de series procesado y transformado en formato EChartsOption
   */
  public configureSeries(series: any[], context: SeriesContext): any[] {
    this.maxValue = 0; // reset maxValue calculation

    return series.map((s, index) => {
      const originalType = context.chartType; // Ej: "area"
      s.type = this.getMappedChartType(originalType); // Ej: "line"
      
      // Assign Config
      type ObjectKey = keyof typeof EC_SERIES_CONFIG;
      // Usamos el originalType para buscar la config específica (ej: areaStyle de "area") 
      // y si no está, usamos el tipo mapeado (ej: "line")
      const configKey = EC_SERIES_CONFIG[originalType as ObjectKey] ? originalType : s.type;
      Object.assign(s, EC_SERIES_CONFIG[configKey as ObjectKey] || {});

      // Process Data
      s.data = this.processSeriesDataPayload(s.data, context);

      // Ensure Stack
      if (!s.stack && context.stack) {
        s.stack = context.stack;
      }

      // Ensure visible
      s.visible = true;

      return s;
    });
  }

  /**
   * Procesa estructuralmente una dupla matriz de valores para retornar la transformación pertinente. 
   * Extrae simultáneamente el valor Máximo detectado para cálculos futuros de layout.
   * Si las opciones refieren a modo porcentual, computa el porcentaje frente a todos los `totals` generados de antemano.
   * Si es Pie Chart lo decodifica a `{name, value}` al estilo objeto iterador.
   */
  private processSeriesDataPayload(data: any[], context: SeriesContext) {
    return data.map((v, i) => {
      const numericVal = parseFloat(v[1]) || 0;
      this.maxValue = Math.max(this.maxValue, numericVal);

      if (!context.isPie) {
        return context.toPercent
          ? (numericVal * 100) / (this.totals[i] || 1)
          : v[1];
      } else {
        return { 
          name: v[0], 
          value: context.toPercent
            ? (numericVal * 100) / (this.totals[i] || 1)
            : v[1]
        };
      }
    });
  }

  /**
   * Recorre recursivamente todas las series para acumular sus valores respectivos por el índice de su columna de datos. 
   * Asigna localmente la matriz numérica en `options.totals` para su posterior uso en renderizaciones apiladas o porcentuales.
   * @param series - Array bruto de series que se pretenden graficar.
   */
  public summarizeTotals(series: Array<any>): void {
    this.totals = [];
    series.forEach((s) => {
      (s.data as Array<any>).forEach((v, i) => {
        const val = parseFloat(v[1]) || 0;
        if (!this.totals[i]) {
          this.totals[i] = val;
        } else {
          this.totals[i] += val;
        }
      });
    });
  }

  /**
   * Mapea y traduce de forma determinística la convención de tipos de gráficas usada por 
   * NGX Visualizer Data (p., ej., `column`, `area`) hacia las claves interpretables por ECharts (`bar`, `line`, etc).
   */
  private getMappedChartType(type: string): string {
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
}
