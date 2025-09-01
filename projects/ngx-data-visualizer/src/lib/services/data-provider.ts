import uniqBy from 'lodash.uniqby';
import { Dimension, Filters, RowData } from '../types/data.types';
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
   * Almacena las dimensiones con las que opera el proveedor.
   * @public
   */
  public dimensions: Dimension[];

  /**
   * Almacena el conjunto de datos crudos original.
   * @private
   */
  private rowData: RowData[];

  /**
   * Obtiene los filtros actuales.
   * @returns La configuración de filtros actual.
   */
  public get filters(): Filters {
    return this._filters;
  }

  /**
   * Establece los filtros actuales.
   * @param value - La nueva configuración de filtros a aplicar.
   */
  public set filters(value: Filters) {
    this._filters = value;
  }

  /**
   * Crea una nueva instancia de DataProvider.
   * @param initialData - Datos iniciales para el proveedor (dimensiones y datos de fila).
   * @example
   * const dataProvider = new DataProvider({
   *   dimensions: [{ id: 1, name: 'año', nameView: 'Año', items: [] }],
   *   rowData: [{ 'Año': 2023, 'valor': 100 }]
   * });
   */
  constructor(initialData?: { dimensions?: Dimension[]; rowData?: RowData[] }) {
    this._filters = new Filters();
    this.dimensions = [];
    this.rowData = [];

    if (initialData) {
      if (initialData.dimensions) {
        this.dimensions = initialData.dimensions;
      }
      if (initialData.rowData) {
        this.setData(initialData.rowData);
      }
    }
  }

  /**
   * Obtiene las dimensiones activas (que no están siendo agrupadas por rollUp).
   * @returns Un arreglo de las dimensiones visibles.
   * @example
   * const activeDimensions = dataProvider.getActiveDimensions();
   */
  public getActiveDimensions(): Dimension[] {
    return this.dimensions.filter(
      dimension => !this._filters.rollUp.includes(dimension.nameView)
    );
  }

  /**
   * Establece y valida el conjunto de datos a procesar.
   * @param data - El arreglo de datos de fila.
   * @throws {Error} Si los datos no son un arreglo o si las filas tienen estructuras inconsistentes.
   * @example
   * dataProvider.setData([
   *   { año: 2023, valor: 100 },
   *   { año: 2024, valor: 200 }
   * ]);
   */
  public setData(data: RowData[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Los datos deben ser un arreglo');
    }

    if (data.length > 0) {
      const firstRowKeys = Object.keys(data[0] || {});
      const invalidRow = data.find(row => {
        const rowKeys = Object.keys(row || {});
        return rowKeys.length !== firstRowKeys.length ||
               !rowKeys.every(key => firstRowKeys.includes(key));
      });

      if (invalidRow) {
        throw new Error('Todas las filas deben tener la misma estructura');
      }
    }

    this.rowData = data.map(row => ({ ...row }));
  }

  /**
   * Obtiene los datos procesados después de aplicar filtros y agrupaciones.
   * @returns Un arreglo de datos procesados.
   */
  public getData(): RowData[] {
    return this.processConfig();
  }

  /**
   * Obtiene los nombres de las columnas de los datos procesados.
   * @returns Un arreglo con los nombres de las columnas.
   */
  public getDimensionsNames(): string[] {
    const row = this.processConfig()[0] || {};
    return Object.keys(row);
  }

  /**
   * Obtiene todos los valores únicos para una dimensión específica de los datos procesados.
   * Los resultados son ordenados según la propiedad 'order' de los items de la dimensión.
   * @param dimensionName - El nombre de la dimensión a consultar.
   * @returns Un arreglo de valores únicos (string) para la dimensión.
   */
  public getItems(dimensionName: string): string[] {
    const processedConfig = this.processConfig();
    const items = uniqBy(processedConfig, dimensionName)
      .map((item) => item[dimensionName])
      .filter((item): item is string => item !== undefined);

    if (dimensionName !== DIMENSION_YEAR) {
      const dimension = this.dimensions.find(d => d.nameView === dimensionName);

      if (dimension && Array.isArray(dimension.items) && dimension.items.length > 0) {
        items.sort((a, b) => {
          const itemA = dimension.items.find(i => i.name === a);
          const itemB = dimension.items.find(i => i.name === b);
          return (itemA?.order ?? 0) - (itemB?.order ?? 0);
        });
      }
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