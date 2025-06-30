import { Subject } from 'rxjs';
import { DataProvider } from './data-provider';
import { Dimension, Filters, RowData } from '../types/data.types';
import { TimeSeries } from '../chart/types/chart-models';

/**
 * Clase que representa un conjunto de datos para visualización
 * Proporciona métodos para manejar y filtrar datos
 */
export class Dataset {
  /** Identificador único opcional del dataset */
  public readonly id?: number;

  /** Dimensiones disponibles en el dataset */
  public readonly dimensions: Dimension[];

  /** Indica si está habilitada la agrupación (roll up) de datos */
  public readonly enableRollUp: boolean;

  /** Datos en formato de filas */
  public readonly rowData: RowData[];

  /** Proveedor de datos para operaciones de filtrado y consulta */
  public readonly dataProvider: DataProvider;

  /** Subject que emite cuando los datos son actualizados */
  public readonly dataUpdated = new Subject<boolean>();

  /** Serie temporal asociada al dataset (opcional) */
  private readonly timeSeries?: TimeSeries;

  /**
   * Crea una nueva instancia de Dataset
   * @param config - Configuración inicial del dataset
   * @throws {Error} Si la configuración no es válida
   * @example
   * const dataset = new Dataset({
   *   dimensions: [{
   *     id: 1,
   *     name: 'year',
   *     nameView: 'Año',
   *     items: [{ id: 1, name: '2023', selected: true }]
   *   }],
   *   rowData: [{ 'Año': '2023', 'valor': 100 }],
   *   enableRollUp: true
   * });
   */
  constructor(config: {
    id?: number;
    dimensions: Dimension[];
    enableRollUp: boolean;
    rowData: RowData[];
  }) {
    if (!config) {
      throw new Error('La configuración del dataset es requerida');
    }

    this.id = config.id;
    this.dimensions = this.validateDimensions(config.dimensions);
    this.rowData = this.validateRowData(config.rowData);
    this.enableRollUp = Boolean(config.enableRollUp);
    this.dataProvider = new DataProvider({ dimensions: this.dimensions, rowData: this.rowData });

    // Validar que las dimensiones en los datos coincidan con las dimensiones definidas
    this.validateDataAgainstDimensions();
  }

  /**
   * Valida las dimensiones del dataset
   * @param dimensions - Dimensiones a validar
   * @returns Arreglo de dimensiones validadas
   * @private
   */
  private validateDimensions(dimensions: Dimension[] = []): Dimension[] {
    if (!Array.isArray(dimensions)) {
      console.warn('Las dimensiones deben ser un arreglo, se usará un arreglo vacío');
      return [];
    }

    // Validar que cada dimensión tenga los campos requeridos
    return dimensions.map((dim, index) => {
      if (!dim || typeof dim !== 'object') {
        throw new Error(`Dimensión en posición ${index} no es un objeto válido`);
      }

      const requiredFields = ['id', 'name', 'nameView', 'items'];
      const missingFields = requiredFields.filter(field => !(field in dim));

      if (missingFields.length > 0) {
        throw new Error(
          `Dimensión '${dim.name || 'sin nombre'}' falta(n) campo(s) requerido(s): ${missingFields.join(', ')}`
        );
      }

      return { ...dim };
    });
  }

  /**
   * Valida los datos de fila del dataset
   * @param rowData - Datos de fila a validar
   * @returns Arreglo de datos de fila validados
   * @private
   */
  private validateRowData(rowData: RowData[] = []): RowData[] {
    if (!Array.isArray(rowData)) {
      console.warn('Los datos de fila deben ser un arreglo, se usará un arreglo vacío');
      return [];
    }

    return rowData.map((row, index) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`Fila en posición ${index} no es un objeto válido`);
      }
      return { ...row };
    });
  }

  /**
   * Valida que los datos coincidan con las dimensiones definidas
   * @throws {Error} Si hay inconsistencias entre los datos y las dimensiones
   * @private
   */
  private validateDataAgainstDimensions(): void {
    if (this.rowData.length === 0 || this.dimensions.length === 0) {
      return; // No hay datos o dimensiones para validar
    }

    const dimensionNames = new Set(this.dimensions.map(d => d.nameView));
    const dataKeys = new Set<string>();

    // Recolectar todas las claves de los datos
    this.rowData.forEach(row => {
      Object.keys(row).forEach(key => dataKeys.add(key));
    });

    // Verificar que todas las dimensiones estén en los datos
    const missingDimensions = [...dimensionNames].filter(name => !dataKeys.has(name));
    if (missingDimensions.length > 0) {
      console.warn(
        `Las siguientes dimensiones no están presentes en los datos: ${missingDimensions.join(', ')}`
      );
    }
  }

  /**
   * Aplica filtros al conjunto de datos
   * @param filters - Filtros a aplicar
   * @throws {Error} Si los filtros no son válidos
   * @example
   * dataset.applyFilters({
   *   rollUp: ['categoria'],
   *   filter: [
   *     { name: 'año', items: [2023, 2024] }
   *   ]
   * });
   */
  public applyFilters(filters: Filters): void {
    this.dataProvider.filters = filters;
    this.dataUpdated.next(true);
  }

  /**
   * Obtiene los datos actuales del dataset
   * @returns Una copia de los datos actuales
   * @example
   * const currentData = dataset.getData();
   * console.log('Datos actuales:', currentData);
   */
  public getData(): RowData[] {
    return this.rowData.map(row => ({ ...row }));
  }

  /**
   * Obtiene las dimensiones actuales del dataset
   * @returns Una copia de las dimensiones actuales
   * @example
   * const dimensions = dataset.getDimensions();
   * console.log('Dimensiones:', dimensions.map(d => d.nameView));
   */
  public getDimensions(): Dimension[] {
    return this.dimensions.map(dim => ({ ...dim }));
  }
}
