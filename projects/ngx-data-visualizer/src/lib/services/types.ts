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
 * Clase que representa los filtros aplicables a un conjunto de datos
 */
export class Filters {
  /** Nombres de dimensiones a agrupar */
  public rollUp: string[] = [];

  /** Filtros de dimensión a aplicar */
  public filter: DimensionFilter[] = [];
}
