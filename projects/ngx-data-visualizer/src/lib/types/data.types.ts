/**
 * Tipo que define los valores permitidos en una fila de datos.
 * Representa todos los tipos de datos que pueden ser almacenados en una celda.
 */
export type DataValue = string | number | null;

/**
 * Interfaz base que representa una fila de datos genérica.
 * Cada clave en el objeto representa una columna y su valor puede ser de cualquier tipo DataValue.
 */
export interface RowData {
  [key: string]: DataValue;
}

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

  /** Tipo de dimensión (opcional) */
  type?: number;

  /** Indica si la dimensión puede desagregarse en múltiples gráficos (opcional) */
  enableMulti?: boolean;

  /** Indica si la dimensión está seleccionada (opcional) */
  selected?: boolean;
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
 * Clase que representa los filtros aplicables a un conjunto de datos
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
