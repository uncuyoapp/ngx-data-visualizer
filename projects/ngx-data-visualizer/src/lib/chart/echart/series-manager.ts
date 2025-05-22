import { ECharts } from 'echarts';

/**
 * Interfaz para los datos de una serie
 */
export interface SeriesData {
  /** Nombre del punto de datos */
  name: string;
  /** Valor numérico del punto de datos */
  value: number;
  /** Propiedades adicionales */
  [key: string]: string | number | boolean;
}

/**
 * Interfaz para la configuración de una serie
 */
export interface SeriesConfigType {
  /** Nombre de la serie */
  name: string;
  /** Tipo de gráfico de la serie (line, bar, pie, etc.) */
  type: string;
  /** Datos de la serie */
  data: SeriesData[];
  /** Grupo de apilamiento (opcional) */
  stack?: string;
  /** Indica si la serie es visible */
  visible?: boolean;
  /** Indica si la serie está en estado hover */
  hover?: boolean;
  /** Color de la serie */
  color?: string;
  /** Propiedades adicionales */
  [key: string]: string | number | boolean | SeriesData[] | undefined;
}

/**
 * Clase encargada de manejar las series de los gráficos ECharts.
 * Proporciona funcionalidades para agregar, eliminar, seleccionar y
 * configurar series en el gráfico.
 */
export class SeriesManager {
  /**
   * Constructor de la clase
   * @param chartInstance - Instancia de ECharts que maneja el gráfico
   */
  constructor(private readonly chartInstance: ECharts) {}

  /**
   * Obtiene todas las series del gráfico
   * @returns Array con la configuración de todas las series
   */
  getSeries(): SeriesConfigType[] {
    return (this.chartInstance?.getOption()?.['series'] as SeriesConfigType[]) || [];
  }

  /**
   * Añade una nueva serie al gráfico
   * @param series - Configuración de la serie a añadir
   */
  addSeries(series: SeriesConfigType): void {
    const currentSeries = this.chartInstance.getOption()['series'] as SeriesConfigType[];
    this.chartInstance.setOption({ series: [...currentSeries, series] });
  }

  /**
   * Elimina una serie del gráfico
   * @param series - Configuración de la serie a eliminar
   */
  deleteSeries(series: SeriesConfigType): void {
    const currentSeries = this.chartInstance.getOption()['series'] as SeriesConfigType[];
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
      this.chartInstance.dispatchAction({ type: 'downplay' });
    } else {
      this.chartInstance.dispatchAction({
        type: 'highlight',
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
        type: 'legendUnSelect',
        name: series.name,
      });
    } else {
      this.chartInstance.dispatchAction({
        type: 'legendSelect',
        name: series.name,
      });
    }
    series.visible = !series.visible;
  }

  /**
   * Procesa los datos de una serie, opcionalmente convirtiendo valores a porcentajes
   * @param data - Array de datos de la serie
   * @param toPercent - Indica si se deben convertir los valores a porcentajes
   * @param totals - Array de totales para el cálculo de porcentajes
   * @returns Array de datos procesados
   */
  processSeriesData(data: SeriesData[], toPercent: boolean, totals?: number[]): SeriesData[] {
    return data.map((item, index) => {
      if (toPercent && totals) {
        return {
          ...item,
          value: (item.value * 100) / totals[index],
        };
      }
      return item;
    });
  }

  /**
   * Configura una serie con los parámetros proporcionados
   * @param series - Configuración base de la serie
   * @param index - Índice de la serie para asignar color
   * @param colors - Array de colores disponibles
   * @returns Configuración completa de la serie
   */
  configureSeries(series: SeriesConfigType, index: number, colors?: string[]): SeriesConfigType {
    return {
      ...series,
      visible: true,
      color: colors ? colors[index % colors.length] : undefined,
    };
  }
}
