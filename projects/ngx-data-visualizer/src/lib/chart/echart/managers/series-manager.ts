import { ECharts } from "echarts";
import { EC_SERIES_CONFIG } from "../../../types/constants";
import { SeriesConfigType } from "../types/echart-base";

/**
 * @description Interfaz que define el contexto y parámetros necesarios para la configuración de las series.
 */
export interface SeriesContext {
  /** @description Tipo identificatorio del gráfico (ej: "bar", "line", "area"). */
  chartType: string;
  /** @description Indica si el gráfico es de tipo torta (pie). */
  isPie: boolean;
  /** @description Indica si los valores deben transformarse a representación porcentual. */
  toPercent: boolean;
  /** @description Clave opcional de apilamiento para agrupar series. */
  stack?: string | null;
  /** @description Paleta de colores opcional asignada a las series. */
  colors?: string[];
}

/**
 * @description
 * Clase administradora encargada de todo lo referido al manejo y transformación de las Series
 * en los gráficos de ECharts. Acuña responsabilidades sobre adición, eliminación y 
 * selección interactiva de series. Adicionalmente, computa valores acumulados para visualizaciones en porcentajes.
 */
export class SeriesManager {
  /** Diccionario de acumulación por clave de pila y por cada índice de datos. Usado para gráficos porcentuales. */
  private totals: Record<string, number[]> = {};
  /** Valor máximo hallado en las series dibujadas. Utilizado para calcular la separación dinámica del Label (NameGap). */
  private maxValue: number = 0;

  /**
   * @description Crea la instancia del gestor de series de ECharts.
   * @param chartInstance - Referencia a la instancia de renderizado nativa de ECharts.
   */
  constructor(private readonly chartInstance: ECharts) { }

  /**
   * @description Obtiene los totales acumulados por todas las series para una pila específica o por defecto.
   * @param stackKey - Clave opcional de la pila a consultar (por defecto 'default').
   * @returns Arreglo de totales acumulados por índice o mapa de todas las pilas.
   * @public
   */
  public getTotals(stackKey: string = 'default'): number[] | Record<string, number[]> {
    if (stackKey && this.totals[stackKey]) {
      return this.totals[stackKey];
    }
    return this.totals['default'] || this.totals;
  }

  /**
   * @description Obtiene el valor máximo numérico hallado iterando sobre todas las series renderizadas.
   * @returns El valor máximo numérico hallado.
   * @public
   */
  public getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * @description Obtiene todas las series actualmente configuradas en la instancia de ECharts.
   * @returns Arreglo con la configuración de todas las series.
   * @public
   */
  getSeries(): SeriesConfigType[] {
    return (
      (this.chartInstance?.getOption()?.["series"] as SeriesConfigType[]) || []
    );
  }

  /**
   * @description Añade una nueva serie al gráfico de ECharts.
   * @param series - Objeto de configuración de la serie a añadir.
   * @public
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
   * @description Elimina una serie del gráfico según su nombre.
   * @param series - Objeto de configuración de la serie a eliminar.
   * @public
   */
  deleteSeries(series: SeriesConfigType): void {
    const currentSeries = this.getSeries();
    this.chartInstance.setOption({
      series: currentSeries.filter((cs) => cs.name !== series.name),
    });
  }

  /**
   * @description Maneja la interacción de hover (foco/resaltado) sobre una serie.
   * @param series - Serie sobre la que se realiza la acción de hover.
   * @public
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
   * @description Maneja la selección/deselección interactiva de una serie en la leyenda.
   * @param series - Serie a seleccionar o deseleccionar.
   * @public
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
   * @description Orquesta el formato estructural de las series. Muta su formato interno 
   * inyectando las configuraciones constantes (`EC_SERIES_CONFIG`) requeridas por la biblioteca, 
   * calcula los valores porcentuales y asigna propiedades visuales tales como color y apilamiento.
   * @param series - Listado con la configuración funcional y de valores de las series.
   * @param context - Contexto visual general del gráfico encapsulado en `SeriesContext`.
   * @returns El subconjunto de series procesado y transformado en formato EChartsOption.
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public configureSeries(series: any[], context: SeriesContext): any[] {
    this.maxValue = 0; // reset maxValue calculation

    return series.map((s) => {
      const originalType = context.chartType; // Ej: "area"
      s.type = this.getMappedChartType(originalType); // Ej: "line"

      // Assign Config
      type ObjectKey = keyof typeof EC_SERIES_CONFIG;
      // Usamos el originalType para buscar la config específica (ej: areaStyle de "area") 
      // y si no está, usamos el tipo mapeado (ej: "line")
      const configKey = EC_SERIES_CONFIG[originalType as ObjectKey] ? originalType : s.type;
      Object.assign(s, EC_SERIES_CONFIG[configKey as ObjectKey] || {});

      // Ensure Stack
      if (!s.stack && context.stack) {
        s.stack = context.stack;
      }

      const stackKey = s.stack || context.stack || 'default';

      // Process Data
      s.data = this.processSeriesDataPayload(s.data, context, stackKey);

      // Ensure visible
      s.visible = true;

      return s;
    });
  }

  /**
   * @description Procesa estructuralmente una matriz de valores para retornar la transformación pertinente. 
   * Extrae simultáneamente el valor máximo detectado para cálculos de layout.
   * Si las opciones refieren a modo porcentual, computa el porcentaje frente a los totales previamente calculados.
   * Preserva el valor nominal original en la propiedad `nominalValue`.
   * @param data - Matriz de datos de entrada de la serie.
   * @param context - Contexto de las series.
   * @param stackKey - Clave de la pila activa (por defecto 'default').
   * @returns Arreglo de datos formateados para ECharts.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processSeriesDataPayload(data: any[], context: SeriesContext, stackKey: string = 'default') {
    const stackTotals = this.totals[stackKey] || this.totals['default'] || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((v: any, i) => {
      const numericVal = Number.parseFloat(v[1]) || 0;
      this.maxValue = Math.max(this.maxValue, numericVal);
      const totalForIdx = stackTotals[i] || 1;

      if (!context.isPie) {
        if (context.toPercent) {
          const porcentaje = (numericVal * 100) / (totalForIdx || 1);
          return {
            value: porcentaje,
            nominalValue: numericVal,
          };
        }
        return v[1];
      } else {
        const porcentaje = (numericVal * 100) / (totalForIdx || 1);
        return {
          name: v[0],
          value: context.toPercent ? porcentaje : v[1],
          ...(context.toPercent ? { nominalValue: numericVal } : {}),
        };
      }
    });
  }

  /**
   * @description Recorre recursivamente todas las series para acumular sus valores respectivos por clave de apilamiento e índice.
   * @param series - Arreglo de series a procesar.
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public summarizeTotals(series: Array<any>): void {
    this.totals = {};
    series.forEach((s) => {
      const stackKey = s.stack || 'default';
      if (!this.totals[stackKey]) {
        this.totals[stackKey] = [];
      }
      const stackTotals = this.totals[stackKey];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((s.data as Array<any>) || []).forEach((v: any, i) => {
        const val = Number.parseFloat(v[1]) || 0;
        if (stackTotals[i] === undefined) {
          stackTotals[i] = val;
        } else {
          stackTotals[i] += val;
        }
      });
    });
  }

  /**
   * @description Mapea y traduce la convención de tipos de gráficos usada por la aplicación 
   * hacia las claves interpretables por ECharts (`bar`, `line`, etc.).
   * @param type - Tipo de gráfico de origen.
   * @returns Tipo de gráfico equivalente interpretable por ECharts.
   * @private
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
