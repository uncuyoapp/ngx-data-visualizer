import uniqBy from 'lodash.uniqby';
import { Dimension, Filters, RowData } from '../types/data.types';
import { DIMENSION_YEAR, DIMENSION_VALUE } from '../types/constants';

/**
 * Proporciona funcionalidades para el manejo y procesamiento de datos en visualizaciones.
 * Permite filtrar, agrupar y acceder a dimensiones y valores de los datos.
 */
export class DataProvider {
  /** Filtros actuales aplicados a los datos */
  public filters: Filters;

  /** Dimensiones disponibles en los datos */
  public dimensions: Dimension[];

  /** Datos crudos sin procesar */
  private rowData: RowData[];

  /**
   * Crea una nueva instancia de DataProvider
   * @param initialData - Datos iniciales opcionales para el proveedor
   * @example
   * const dataProvider = new DataProvider({
   *   dimensions: [{ id: 1, name: 'año', nameView: 'Año', items: [] }],
   *   rowData: [{ 'Año': 2023, 'valor': 100 }]
   * });
   */
  constructor(initialData?: { dimensions?: Dimension[]; rowData?: RowData[] }) {
    this.filters = new Filters();
    this.dimensions = [];
    this.rowData = [];

    if (initialData) {
      if (initialData.dimensions) {
        this.dimensions = this.validateDimensions(initialData.dimensions);
      }
      if (initialData.rowData) {
        this.setData(initialData.rowData);
      }
    }
  }

  /**
   * Valida un arreglo de dimensiones
   * @param dimensions - Dimensiones a validar
   * @returns Arreglo de dimensiones validadas
   * @throws {Error} Si alguna dimensión no es válida
   * @private
   */
  private validateDimensions(dimensions: Dimension[]): Dimension[] {
    if (!Array.isArray(dimensions)) {
      throw new Error('Las dimensiones deben ser un arreglo');
    }

    const uniqueIds = new Set<number>();
    const uniqueNames = new Set<string>();
    const uniqueNameViews = new Set<string>();

    return dimensions.map((dim, index) => {
      if (!dim || typeof dim !== 'object') {
        throw new Error(`Dimensión en posición ${index} no es un objeto válido`);
      }

      if (uniqueIds.has(dim.id)) {
        throw new Error(`ID duplicado encontrado: ${dim.id}`);
      }
      uniqueIds.add(dim.id);

      if (uniqueNames.has(dim.name)) {
        throw new Error(`Nombre de dimensión duplicado: ${dim.name}`);
      }
      uniqueNames.add(dim.name);

      if (uniqueNameViews.has(dim.nameView)) {
        throw new Error(`Nombre para mostrar de dimensión duplicado: ${dim.nameView}`);
      }
      uniqueNameViews.add(dim.nameView);

      return { ...dim };
    });
  }

  /**
   * Obtiene las dimensiones que no están siendo agrupadas (rollUp)
   * @returns Arreglo de dimensiones visibles
   * @example
   * const dimensionsVisibles = dataProvider.getDimensions();
   * console.log(dimensionsVisibles.map(d => d.nameView));
   */
  public getDimensions(): Dimension[] {
    return this.dimensions.filter(
      dimension => !this.filters.rollUp.includes(dimension.nameView)
    );
  }

  /**
   * Establece los datos a procesar
   * @param data - Arreglo de datos a procesar
   * @throws {Error} Si los datos no son válidos
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

    // Validar que cada fila tenga la misma estructura
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
   * Obtiene los datos procesados con los filtros actuales
   * @returns Arreglo de datos procesados
   */
  public getData(): RowData[] {
    return this.processConfig();
  }

  /**
   * Obtiene los nombres de las dimensiones de los datos actuales
   * @returns Arreglo con los nombres de las dimensiones
   */
  public getDimensionsNames(): string[] {
    const row = this.processConfig()[0] || {};
    return Object.keys(row);
  }

  /**
   * Obtiene todos los valores únicos de una dimensión específica
   * @param dimensionName - Nombre de la dimensión
   * @returns Arreglo de valores únicos de la dimensión
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
   * Procesa la configuración actual y aplica los filtros
   * @returns Datos procesados con los filtros aplicados
   * @throws {Error} Si hay un error al procesar los datos
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
   * Verifica si una fila debe ser filtrada según los filtros actuales
   * @param row - Fila a verificar
   * @returns true si la fila debe ser filtrada, false en caso contrario
   * @private
   */
  private isFiltered(row: RowData): boolean {
    if (!this.filters?.filter) {
      return false;
    }

    return this.filters.filter.some(filter => {
      const value = row[filter.name];
      // Verificar que el valor no sea null, undefined y que sea del tipo correcto
      if (value === null || value === undefined) {
        return true; // Filtrar valores nulos o indefinidos
      }
      // Asegurarse de que el valor sea compatible con los items del filtro
      return !filter.items.some(item => item === value || String(item) === String(value));
    });
  }

  /**
   * Realiza la operación de agrupación (roll up) de los datos
   * @param row - Fila de datos a procesar
   * @param mapFilter - Mapa para almacenar los resultados agrupados
   * @private
   */
  private rollUp(row: RowData, mapFilter: Map<string, RowData>): void {
    if (this.filters.rollUp.length === 0) {
      // Si no hay agrupación, simplemente agregar la fila
      mapFilter.set(Object.values(row).toString(), { ...row });
      return;
    }

    // Realizar la operación de agrupación
    const value = row[DIMENSION_VALUE];
    const rowCopy = { ...row };

    // Eliminar la columna de valor y las columnas a agrupar
    delete rowCopy[DIMENSION_VALUE];
    this.filters.rollUp.forEach(key => {
      delete rowCopy[key];
    });

    const rowKey = Object.values(rowCopy).toString();
    const existingRow = mapFilter.get(rowKey);

    if (existingRow) {
      // Sumar al valor existente
      existingRow[DIMENSION_VALUE] = this.sumValues(
        existingRow[DIMENSION_VALUE],
        value
      );
    } else {
      // Crear nueva entrada
      rowCopy[DIMENSION_VALUE] = this.parseValue(value);
      mapFilter.set(rowKey, rowCopy);
    }
  }

  /**
   * Suma dos valores numéricos, manejando valores no definidos
   * @private
   */
  private sumValues(a: unknown, b: unknown): number {
    return (Number(a) || 0) + (Number(b) || 0);
  }

  /**
   * Convierte un valor a número, manejando valores no definidos
   * @private
   */
  private parseValue(value: unknown): number {
    return Number(value) || 0;
  }

  public setFilters(filters: Filters): void {
    this.filters = filters;
  }
}
