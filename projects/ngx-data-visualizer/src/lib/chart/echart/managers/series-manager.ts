import { ECharts } from 'echarts';
import { SeriesConfigType, SeriesData } from '../types/echart-base';

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
