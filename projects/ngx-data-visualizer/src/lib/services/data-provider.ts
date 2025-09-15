import uniqBy from 'lodash.uniqby';
import { RowData } from '../types/data.types';
import { Filters } from './types';
import { DIMENSION_YEAR, DIMENSION_VALUE } from '../types/constants';

/**
 * Proporciona funcionalidades para el manejo y procesamiento de datos.
 * Esta clase es el motor interno que realiza filtrado, agrupación (roll up),
 * y otras manipulaciones de datos.
 */
export class DataProvider {
  /**
   * Almacena la configuración de filtros actual.
   * @private
   */
  private _filters: Filters;

  /**
   * Almacena el conjunto de datos crudos original.
   * @private
   */
  private rowData: RowData[];

  /**
   * @description
   * Almacena reglas de ordenamiento personalizadas para claves específicas.
   * La clave externa es la `key` de la columna, y el valor es un mapa interno
   * donde la clave es el item (ej: 'Enero') y el valor es su orden numérico.
   * @private
   */
  private readonly sortingRules?: Map<string, Map<string, number>>;

  /**
   * @description Obtiene los filtros actuales.
   * @returns La configuración de filtros actual.
   */
  public get filters(): Filters {
    return this._filters;
  }

  /**
   * @description Establece los filtros actuales.
   * @param value - La nueva configuración de filtros a aplicar.
   */
  public set filters(value: Filters) {
    this._filters = value;
  }

  /**
   * @description Crea una nueva instancia de DataProvider.
   * @param initialData - Datos iniciales y configuración para el proveedor.
   * @param initialData.rowData - El conjunto de datos de filas a procesar.
   * @param initialData.sortingRules - Reglas opcionales para un ordenamiento personalizado.
   * @example
   * const dataProvider = new DataProvider({
   *   rowData: [{ 'Año': 2023, 'valor': 100 }],
   *   sortingRules: new Map()
   * });
   */
  constructor(initialData?: { rowData?: RowData[], sortingRules?: Map<string, Map<string, number>> }) {
    this._filters = new Filters();
    this.rowData = [];
    this.sortingRules = initialData?.sortingRules;

    if (initialData?.rowData) {
      this.setData(initialData.rowData);
    }
  }

  /**
   * @description Obtiene las claves de columna activas (que no están siendo agrupadas por rollUp).
   * @returns Un arreglo de las claves de columna visibles en los datos procesados.
   */
  public getActiveKeys(): string[] {
    const processedData = this.processConfig();
    if (processedData.length === 0) {
      return [];
    }
    return Object.keys(processedData[0] || {});
  }

  /**
   * @description Establece y valida el conjunto de datos a procesar.
   * @param data - El arreglo de datos de fila.
   * @throws {Error} Si los datos no son un arreglo, o si las filas no son objetos o tienen estructuras inconsistentes.
   */
  public setData(data: RowData[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Los datos de fila deben ser un arreglo');
    }

    if (data.length > 0) {
      const firstRowKeys = Object.keys(data[0] || {});
      data.forEach((row, index) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          throw new Error(`Fila en posición ${index} no es un objeto válido`);
        }
        const rowKeys = Object.keys(row || {});
        if (rowKeys.length !== firstRowKeys.length || !rowKeys.every(key => firstRowKeys.includes(key))) {
          throw new Error('Todas las filas deben tener la misma estructura');
        }
      });
    }

    this.rowData = data.map(row => ({ ...row }));
  }

  /**
   * @description Obtiene los datos procesados después de aplicar filtros y agrupaciones.
   * @returns Un arreglo de datos procesados.
   */
  public getData(): RowData[] {
    return this.processConfig();
  }

  /**
   * @description Obtiene los nombres de las columnas (claves) de los datos procesados.
   * @returns Un arreglo con los nombres de las columnas.
   */
  public getKeys(): string[] {
    const row = this.processConfig()[0] || {};
    return Object.keys(row);
  }

  /**
   * @description
   * Obtiene todos los valores únicos para una clave de columna específica de los datos procesados.
   * Los resultados son ordenados según las `sortingRules` si se proporcionaron para esa clave.
   * @param key - El nombre de la clave de columna a consultar.
   * @returns Un arreglo de valores únicos para la clave.
   */
  public getValuesByKey(key: string): (string | number)[] {
    const processedConfig = this.processConfig();
    const items = uniqBy(processedConfig, key)
      .map((item) => item[key])
      .filter((item): item is string | number => item !== undefined && item !== null);

    const sortingRule = this.sortingRules?.get(key);

    if (key !== DIMENSION_YEAR && sortingRule) {
      items.sort((a, b) => {
        const orderA = sortingRule.get(String(a)) ?? Infinity;
        const orderB = sortingRule.get(String(b)) ?? Infinity;
        return orderA - orderB;
      });
    }

    return items;
  }

  /**
   * Procesa los datos crudos aplicando la configuración de filtros y rollUp.
   * @returns Datos procesados.
   * @private
   */
  private processConfig(): RowData[] {
    try {
      const mapFilter = new Map<string, RowData>();

      for (const row of this.rowData) {
        if (!this.isFiltered(row)) {
          this.rollUp({ ...row }, mapFilter);
        }
      }

      return Array.from(mapFilter.values());
    } catch (error) {
      console.error('Error al procesar la configuración:', error);
      throw new Error(`Error al procesar los datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verifica si una fila debe ser excluida según los filtros actuales.
   * @param row - La fila a verificar.
   * @returns `true` si la fila debe ser filtrada (excluida), `false` en caso contrario.
   * @private
   */
  private isFiltered(row: RowData): boolean {
    if (!this._filters?.filter) {
      return false;
    }

    return this._filters.filter.some(filter => {
      const value = row[filter.name];
      if (value === null || value === undefined) {
        return true;
      }
      return !filter.items.some(item => item === value || String(item) === String(value));
    });
  }

  /**
   * Agrupa una fila de datos en el mapa de resultados según la configuración de rollUp.
   * Si no hay rollUp, la fila se agrega directamente. Si hay, se agrupa y se suma el valor.
   * @param row - La fila a procesar.
   * @param mapFilter - El mapa que acumula los resultados.
   * @private
   */
  private rollUp(row: RowData, mapFilter: Map<string, RowData>): void {
    if (this._filters.rollUp.length === 0) {
      mapFilter.set(Object.values(row).toString(), { ...row });
      return;
    }

    const value = row[DIMENSION_VALUE];
    const rowCopy = { ...row };

    delete rowCopy[DIMENSION_VALUE];
    this._filters.rollUp.forEach(key => {
      delete rowCopy[key];
    });

    const rowKey = Object.values(rowCopy).toString();
    const existingRow = mapFilter.get(rowKey);

    if (existingRow) {
      existingRow[DIMENSION_VALUE] = this.sumValues(
        existingRow[DIMENSION_VALUE],
        value
      );
    } else {
      rowCopy[DIMENSION_VALUE] = this.parseValue(value);
      mapFilter.set(rowKey, rowCopy);
    }
  }

  /**
   * Suma dos valores de forma segura, convirtiéndolos a número.
   * @private
   */
  private sumValues(a: unknown, b: unknown): number {
    return (Number(a) || 0) + (Number(b) || 0);
  }

  /**
   * Convierte un valor a número de forma segura.
   * @private
   */
  private parseValue(value: unknown): number {
    return Number(value) || 0;
  }
}