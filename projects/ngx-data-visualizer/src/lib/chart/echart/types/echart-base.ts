/**
 * @fileoverview
 * Este archivo define las interfaces y tipos de datos base que son utilizados internamente
 * por la implementación de gráficos con ECharts. Estos tipos no están pensados para ser
 * expuestos directamente fuera del motor de gráficos.
 * @internal
 */

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
  [key: string]:
    | string
    | number
    | boolean
    | SeriesData[]
    | { width?: number; type?: string }
    | undefined;
}
