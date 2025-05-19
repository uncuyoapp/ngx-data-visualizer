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

  /** Habilita la selección múltiple de elementos */
  enableMulti: boolean;

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
 */
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

/**
 * Tipo que define los valores permitidos en una fila de datos
 */
type DataValue = string | number | boolean | null | undefined;

/**
 * Interfaz que representa una fila de datos genérica
 * @example
 * {
 *   id: 1,
 *   name: 'Ejemplo',
 *   value: 100,
 *   active: true
 * }
 */
export interface RowData {
  [key: string]: DataValue;
}

/**
 * Interfaz que representa una serie de datos para gráficos
 */
export interface Series {
  /** Nombre de la serie */
  name: string;

  /** Color de la serie */
  color: string;

  /** Indica si la serie es visible */
  visible: boolean;

  /** Datos de la serie */
  data: Array<number | [number, number] | { value: number }>;

  /** Indica si la serie debe mostrarse con líneas suaves */
  smooth?: boolean;

  /** Indica si la serie debe apilarse con otras series */
  stacking?: string | undefined;

  /** Tipo de gráfico asociado a la serie */
  chartType?: string;

  /** Tipo de serie para ECharts */
  type?: string;

  /** Símbolo para los puntos de la serie */
  symbol?: string;

  /** Tamaño del símbolo */
  symbolSize?: number;

  /** Estilo de la línea */
  lineStyle?: {
    width?: number;
    type?: string;
  };
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
