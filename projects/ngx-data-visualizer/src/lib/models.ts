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
  
  /** Indica si se deben mostrar los elementos de la dimensión */
  showItems: boolean;
  
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

  /**
   * Valida si los filtros son válidos
   * @throws {Error} Si los filtros no son válidos
   */
  public validate(): void {
    if (!Array.isArray(this.rollUp)) {
      throw new Error('rollUp debe ser un array');
    }
    
    if (!Array.isArray(this.filter)) {
      throw new Error('filter debe ser un array');
    }
    
    this.filter.forEach((f, index) => {
      if (!f.name || typeof f.name !== 'string') {
        throw new Error(`Filtro en posición ${index} no tiene un nombre válido`);
      }
      if (!Array.isArray(f.items)) {
        throw new Error(`Los items del filtro '${f.name}' deben ser un array`);
      }
    });
  }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
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