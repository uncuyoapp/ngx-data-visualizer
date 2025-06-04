import { DataValue, RowData } from './types/data.types';
import { BaseSeries } from './chart/types/chart-base';

/**
 * Interfaz que representa una dimensión en el conjunto de datos
 */
export interface Dimension {
  /** Identificador único de la dimensión */
  id: number;

  /** Nombre interno de la dimensión */
  name: string;

  /** Nombre para mostrar de la dimensión */
  nameView: string;

  /** Elementos que componen la dimensión */
  items: Item[];

  /** Indica si la dimensión está seleccionada */
  selected: boolean;

  /** Tipo de dimensión (opcional) */
  type?: number;
}

/**
 * Interfaz que representa un ítem dentro de una dimensión
 */
export interface Item {
  /** Identificador único del ítem */
  id: number;

  /** Nombre del ítem */
  name: string;

  /** Color asociado al ítem (opcional) */
  color?: string;

  /** Orden de visualización del ítem (opcional) */
  order?: number;

  /** Indica si el ítem está seleccionado */
  selected: boolean;
}

/**
 * Interfaz que representa una serie temporal de datos
 */
export interface TimeSeries {
  /** Arreglo de valores de tiempo */
  arrayTime: string[] | number[];
}

/**
 * Clase que representa los filtros aplicables a un conjunto de datos
 * @example
 * const filters = new Filters();
 * filters.rollUp = ['categoria'];
 * filters.filter = [
 *   { name: 'año', items: [2023, 2024] }
 * ];
 */
export class Filters {
  /** Nombres de dimensiones a agrupar */
  public rollUp: string[] = [];

  /** Filtros de dimensión a aplicar */
  public filter: DimensionFilter[] = [];
}

/**
 * Interfaz que representa un filtro para una dimensión específica
 */
export interface DimensionFilter {
  /** Nombre de la dimensión a filtrar */
  name: string;

  /** Valores seleccionados para el filtro */
  items: Array<string | number>;
}

// Re-exportar tipos comunes
export { DataValue, RowData };

/**
 * Interfaz que representa una serie de datos para gráficos
 * Extiende de BaseSeries para mantener compatibilidad con el código existente
 */
export interface Series extends BaseSeries {
  /** Color de la serie */
  color: string;

  /** Indica si la serie es visible */
  visible: boolean;
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
