import { BaseSeries } from './chart-base';
import { RowData } from '../../types/data.types';

/**
 * Interfaz que representa una serie temporal de datos
 */
export interface TimeSeries {
  /** Arreglo de valores de tiempo */
  arrayTime: string[] | number[];
}

/**
 * Interfaz que representa una serie de datos para gráficos
 * Extiende de BaseSeries para mantener compatibilidad con el código existente
 */
export interface Series extends BaseSeries {
  /** Color de la serie */
  color: string;

  /** Indica si la serie es visible */
  visible: boolean;

  /** Tipo de serie para ECharts (line, bar, pie, etc.) */
  type?: string;
}

/**
 * Interfaz que representa una meta u objetivo para visualización
 */
export interface Goal {
  /** Tipo de gráfico para representar la meta */
  chartType: string;

  /** Texto descriptivo de la meta */
  text: string;

  /** Datos asociados a la meta */
  data: RowData[];
}