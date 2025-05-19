import { ECharts } from 'echarts';

/**
 * Interfaz para los datos de una serie
 */
export interface SeriesData {
  name: string;
  value: number;
  [key: string]: string | number | boolean;
}

/**
 * Interfaz para la configuración de una serie
 */
export interface SeriesConfigType {
  name: string;
  type: string;
  data: SeriesData[];
  stack?: string;
  visible?: boolean;
  hover?: boolean;
  color?: string;
  [key: string]: string | number | boolean | SeriesData[] | undefined;
}

/**
 * Clase encargada de manejar las series de los gráficos ECharts
 */
export class SeriesManager {
  constructor(private chartInstance: ECharts) {}

  /**
   * Obtiene todas las series del gráfico
   */
  getSeries(): SeriesConfigType[] {
    if (!this.chartInstance || !this.chartInstance.getOption()) {
      return [];
    }
    return (this.chartInstance.getOption()['series'] as SeriesConfigType[]) || [];
  }

  /**
   * Añade una nueva serie al gráfico
   */
  addSeries(series: SeriesConfigType): void {
    const currentSeries = this.chartInstance.getOption()['series'] as SeriesConfigType[];
    console.log(currentSeries, series);
    console.log(this.chartInstance);
    this.chartInstance.setOption({ series: [...currentSeries, series] });
  }

  /**
   * Elimina una serie del gráfico
   */
  deleteSeries(series: SeriesConfigType): void {
    const currentSeries = this.chartInstance.getOption()['series'] as SeriesConfigType[];
    this.chartInstance.setOption({
      series: currentSeries.filter((cs) => cs.name !== series.name),
    });
  }

  /**
   * Maneja el hover de una serie
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
   * Procesa los datos de una serie
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
   */
  configureSeries(series: SeriesConfigType, index: number, colors?: string[]): SeriesConfigType {
    return {
      ...series,
      visible: true,
      color: colors ? colors[index % colors.length] : undefined,
    };
  }
}
