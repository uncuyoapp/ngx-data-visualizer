/**
 * Tipos base para ECharts
 */
import { ECharts, EChartsOption } from 'echarts';
import { ChartConfiguration, ChartOptions } from '../../types/chart-configuration';

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
  /** Indica si la serie debe mostrarse con líneas suaves */
  smooth?: boolean;
  /** Símbolo para los puntos de la serie */
  symbol?: string;
  /** Tamaño del símbolo */
  symbolSize?: number;
  /** Estilo de la línea */
  lineStyle?: {
    width?: number;
    type?: string;
  };
  /** Propiedades adicionales */
  [key: string]: string | number | boolean | SeriesData[] | { width?: number; type?: string } | undefined;
}

/**
 * Interfaz para la instancia de ECharts
 */
export interface EChartInstance {
  /** Instancia del gráfico ECharts */
  chartInstance: ECharts;
  /** Indica si el gráfico está en proceso de renderizado */
  isRendering: boolean;
  /** Indica si el gráfico ha sido renderizado */
  hasRendered: boolean;
}

/**
 * Interfaz para el caché de ECharts
 */
export interface EChartCache {
  /** Caché de opciones del gráfico */
  optionsCache: Map<string, EChartsOption>;
  /** Caché de datos de series */
  seriesDataCache: Map<string, SeriesData[]>;
  /** Tiempo del último renderizado */
  lastRenderTime: number;
  /** Timeout para el debounce del renderizado */
  renderDebounceTimeout: number | null;
}

/**
 * Interfaz para el estado de ECharts
 */
export interface EChartState {
  /** Totales calculados */
  totals: number[];
  /** Sufijo guardado */
  suffixSaved: string | null;
  /** Decimales guardados */
  decimalsSaved: number | null;
  /** Valor máximo */
  maxValue: number;
  /** Valor máximo del eje Y guardado */
  savedYAxisMaxValue: number | null;
}

/**
 * Interfaz para la configuración de ECharts
 */
export interface EChartConfiguration extends ChartConfiguration {
  /** Tipo de gráfico */
  type: string;
  /** Datos del gráfico */
  data: {
    /** Datos de las series */
    series: SeriesData[];
    /** Configuración de las series */
    seriesConfig: Record<string, string | number | boolean>;
  };
  /** Opciones de configuración */
  options: ChartOptions;
} 