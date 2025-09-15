import { Subject } from "rxjs";
import { DataProvider } from "./data-provider";
import { Dimension, RowData, FiltersConfig } from "../types/data.types";
import { Filters } from "./types";
import { DIMENSION_VALUE } from '../types/constants';

/**
 * Clase que representa un conjunto de datos para visualización.
 * Actúa como una fachada (Facade) que simplifica la interacción con el DataProvider.
 */
export class Dataset {
  /** @description Identificador opcional para el conjunto de datos. */
  public readonly id?: number;
  /** @description Array de objetos Dimension que describen los datos. */
  public readonly dimensions: Dimension[];
  /** @description Flag para habilitar o deshabilitar la funcionalidad de roll-up. */
  public readonly enableRollUp: boolean;
  /** @description Los datos crudos (sin procesar) del conjunto de datos. */
  public readonly rowData: RowData[];
  /** @description Instancia del motor de procesamiento de datos. */
  public readonly dataProvider: DataProvider;
  /** @description Un `Subject` de RxJS que emite `true` cuando los datos se actualizan (ej. por un filtro). */
  public readonly dataUpdated = new Subject<boolean>();

  /**
   * @description Mapa interno para vincular el `id` de una dimensión con su `key` correspondiente en los `rowData`.
   * @private
   */
  private readonly dimensionKeyMap = new Map<number, string>();

  /**
   * @description Crea una instancia de Dataset.
   * @param config - Objeto de configuración para inicializar el Dataset.
   * @param config.id - Identificador numérico opcional.
   * @param config.dimensions - Array con la definición de las dimensiones.
   * @param config.enableRollUp - Booleano para activar la funcionalidad de agrupación.
   * @param config.rowData - Array con los datos de las filas.
   */
  constructor(config: {
    id?: number;
    dimensions: Dimension[];
    enableRollUp: boolean;
    rowData: RowData[];
  }) {
    if (!config) {
      throw new Error("La configuración del dataset es requerida");
    }

    this.id = config.id;
    this.dimensions = this.validateDimensions(config.dimensions);
    this.rowData = config.rowData; // La validación de rowData se delega a DataProvider
    this.enableRollUp = Boolean(config.enableRollUp);

    this.buildDimensionMapAndValidate();

    const sortingRules = this.buildSortingRules();

    this.dataProvider = new DataProvider({
      rowData: this.rowData,
      sortingRules: sortingRules,
    });
  }

  /**
   * @description Construye y devuelve el mapa de reglas de ordenamiento para el `DataProvider`.
   * @returns Un `Map` con las reglas de ordenamiento.
   * @private
   */
  private buildSortingRules(): Map<string, Map<string, number>> {
    const sortingRules = new Map<string, Map<string, number>>();
    this.dimensions.forEach((dim) => {
      if (dim.items && dim.items.length > 0) {
        const itemOrderMap = new Map<string, number>();
        dim.items.forEach((item, index) =>
          itemOrderMap.set(item.name, item.order ?? index),
        );
        const dataKey = this.getDimensionKey(dim.id);
        if (dataKey) {
          sortingRules.set(dataKey, itemOrderMap);
        }
      }
    });
    return sortingRules;
  }

  /**
   * @description Valida la estructura y unicidad del array de dimensiones.
   * @param dimensions - El array de dimensiones a validar.
   * @returns El array de dimensiones validado.
   * @private
   */
  private validateDimensions(dimensions: Dimension[] = []): Dimension[] {
    if (!Array.isArray(dimensions)) {
      console.warn(
        "Las dimensiones deben ser un arreglo, se usará un arreglo vacío",
      );
      return [];
    }

    const uniqueIds = new Set<number>();
    const uniqueNames = new Set<string>();

    return dimensions.map((dim, index) => {
      if (!dim || typeof dim !== "object") {
        throw new Error(
          `Dimensión en posición ${index} no es un objeto válido`,
        );
      }

      const requiredFields = ["id", "name", "nameView", "items"];
      const missingFields = requiredFields.filter((field) => !(field in dim));

      if (missingFields.length > 0) {
        throw new Error(
          `Dimensión '${dim.name || "sin nombre"}' falta(n) campo(s) requerido(s): ${missingFields.join(", ")}`,
        );
      }

      if (uniqueIds.has(dim.id)) {
        throw new Error(`ID de dimensión duplicado encontrado: ${dim.id}`);
      }
      uniqueIds.add(dim.id);

      if (uniqueNames.has(dim.name)) {
        throw new Error(`Nombre de dimensión duplicado: ${dim.name}`);
      }
      uniqueNames.add(dim.name);

      return { ...dim };
    });
  }

  /**
   * @description
   * Construye el mapa `dimensionKeyMap` que relaciona el ID de una dimensión con la clave (`key`)
   * correspondiente en los `rowData`. También valida que no haya claves en los datos sin una dimensión definida.
   * @private
   */
  private buildDimensionMapAndValidate(): void {
    if (this.rowData.length === 0 || this.dimensions.length === 0) {
      return;
    }

    const dataKeys = new Set<string>(Object.keys(this.rowData[0] || {}));

    this.dimensions.forEach((dim) => {
      let foundKey: string | null = null;

      // Búsqueda por id, name, o nameView para encontrar la key correspondiente en los datos
      if (dataKeys.has(dim.id.toString())) {
        foundKey = dim.id.toString();
      } else if (dataKeys.has(dim.name)) {
        foundKey = dim.name;
      } else if (dataKeys.has(dim.nameView)) {
        foundKey = dim.nameView;
      }

      if (foundKey) {
        this.dimensionKeyMap.set(dim.id, foundKey);
      } else {
        console.warn(
          `ADVERTENCIA: Para la dimensión '${dim.nameView}', no se encontró una columna de datos que coincida con su 'id', 'name', o 'nameView'.`,
        );
      }
    });

    const mappedKeys = new Set(this.dimensionKeyMap.values());
    const keysToValidate = [...dataKeys].filter(
      (key) => key !== DIMENSION_VALUE,
    );
    const extraDataKeys = keysToValidate.filter((key) => !mappedKeys.has(key));

    if (extraDataKeys.length > 0) {
      const extraKeysStr = extraDataKeys.map((k) => `'${k}'`).join(", ");
      console.warn(
        `ADVERTENCIA: Las siguientes columnas en los datos no tienen una dimensión definida: ${extraKeysStr}.`,
      );
    }
  }

  /**
   * @description Obtiene la clave de datos (`key`) asociada a un ID de dimensión.
   * @param dimensionId - El ID de la dimensión.
   * @returns La `key` (string) correspondiente o `undefined` si no se encuentra.
   */
  public getDimensionKey(dimensionId: number): string | undefined {
    return this.dimensionKeyMap.get(dimensionId);
  }

  /**
   * @description Aplica una configuración de filtros y/o roll-up al `DataProvider`.
   * @param config - Objeto con la configuración de filtros a aplicar.
   */
  public applyFilters(config: FiltersConfig): void {
    const finalFilters = new Filters();

    if (config.rollUp) {
      if (!this.enableRollUp) {
        console.warn(
          'ADVERTENCIA: Se intentó realizar una operación de roll-up en un dataset que no la tiene habilitada. La operación de roll-up será ignorada. Para activarla, establezca "enableRollUp: true" en la configuración del dataset.',
        );
      } else {
        finalFilters.rollUp = config.rollUp
          .map((idOrName) => {
            const dimension = this.dimensions.find(
              (d) =>
                d.id === idOrName ||
                d.name === idOrName ||
                d.nameView === idOrName,
            );
            return dimension ? this.getDimensionKey(dimension.id) : null;
          })
          .filter((key): key is string => !!key);
      }
    }

    if (config.filter) {
      finalFilters.filter = config.filter
        .map((filterConfig) => {
          const dimension = this.dimensions.find(
            (d) =>
              d.id === filterConfig.name ||
              d.name === filterConfig.name ||
              d.nameView === filterConfig.name,
          );
          if (dimension) {
            const dataKey = this.getDimensionKey(dimension.id);
            if (dataKey) {
              return {
                name: dataKey,
                items: filterConfig.items,
              };
            }
          }
          return null;
        })
        .filter((f): f is { name: string; items: (string | number)[] } => !!f);
    }

    this.dataProvider.filters = finalFilters;
    this.dataUpdated.next(true);
  }

  /**
   * @description Devuelve una copia de los datos crudos originales.
   * @returns Un array de `RowData`.
   */
  public getRawData(): RowData[] {
    return this.rowData.map((row) => ({ ...row }));
  }

  /**
   * @description Devuelve los datos procesados actuales del `DataProvider` (después de filtros y roll-up).
   * @returns Un array de `RowData` procesado.
   */
  public getCurrentData(): RowData[] {
    return this.dataProvider.getData();
  }

  /**
   * @description Devuelve una copia de todas las dimensiones definidas en el `Dataset`.
   * @returns Un array de `Dimension`.
   */
  public getAllDimensions(): Dimension[] {
    return this.dimensions.map((dim) => ({ ...dim }));
  }

  /**
   * @description
   * Devuelve las dimensiones que están activas, es decir, aquellas que no están siendo
   * agrupadas por la configuración de `rollUp`.
   * @returns Un array de `Dimension` activas.
   */
  public getActiveDimensions(): Dimension[] {
    const activeKeys = this.dataProvider.getActiveKeys();
    const activeKeysSet = new Set(activeKeys);
    return this.dimensions.filter((dim) => {
      const key = this.getDimensionKey(dim.id);
      return key ? activeKeysSet.has(key) : false;
    });
  }

  /**
   * @description
   * Obtiene todos los valores únicos para una dimensión específica, basándose en su ID.
   * @param dimensionId - El ID de la dimensión a consultar.
   * @returns Un array de valores únicos (string o number) para la dimensión.
   */
  public getDimensionValues(dimensionId: number): (string | number)[] {
    const dataKey = this.getDimensionKey(dimensionId);
    if (!dataKey) {
      return [];
    }
    return this.dataProvider.getValuesByKey(dataKey);
  }
}
