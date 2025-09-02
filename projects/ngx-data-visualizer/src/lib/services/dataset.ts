import { Subject } from "rxjs";
import { DataProvider } from "./data-provider";
import { Dimension, Filters, RowData, FiltersConfig } from "../types/data.types";

/**
 * Clase que representa un conjunto de datos para visualización
 * Proporciona métodos para manejar y filtrar datos
 */
export class Dataset {
  public readonly id?: number;
  public readonly dimensions: Dimension[];
  public readonly enableRollUp: boolean;
  public readonly rowData: RowData[];
  public readonly dataProvider: DataProvider;
  public readonly dataUpdated = new Subject<boolean>();

  private readonly dimensionKeyMap = new Map<number, string>();

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

    this.buildDimensionMapAndValidate();

    this.dataProvider = new DataProvider({
      dimensions: this.dimensions,
      rowData: this.rowData,
    });
  }

  private validateDimensions(dimensions: Dimension[] = []): Dimension[] {
    if (!Array.isArray(dimensions)) {
      console.warn('Las dimensiones deben ser un arreglo, se usará un arreglo vacío');
      return [];
    }

    const uniqueIds = new Set<number>();
    const uniqueNames = new Set<string>();

    return dimensions.map((dim, index) => {
      if (!dim || typeof dim !== 'object') {
        throw new Error(`Dimensión en posición ${index} no es un objeto válido`);
      }

      const requiredFields = ['id', 'name', 'nameView', 'items'];
      const missingFields = requiredFields.filter(field => !(field in dim));

      if (missingFields.length > 0) {
        throw new Error(`Dimensión '${dim.name || 'sin nombre'}' falta(n) campo(s) requerido(s): ${missingFields.join(', ')}`);
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

  private buildDimensionMapAndValidate(): void {
    if (this.rowData.length === 0 || this.dimensions.length === 0) {
      return;
    }

    const dataKeys = new Set<string>(Object.keys(this.rowData[0]));

    this.dimensions.forEach(dim => {
      let foundKey: string | null = null;

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
        console.warn(`ADVERTENCIA: Para la dimensión '${dim.nameView}', no se encontró una columna de datos que coincida con su 'id', 'name', o 'nameView'. La visualización podría no funcionar como se espera.`);
      }
    });

    const mappedKeys = new Set(this.dimensionKeyMap.values());
    const keysToValidate = [...dataKeys].filter(key => key !== 'valor');

    const extraDataKeys = keysToValidate.filter(key => !mappedKeys.has(key));

    if (extraDataKeys.length > 0) {
      const extraKeysStr = extraDataKeys.map(k => `'${k}'`).join(', ');
      console.warn(`ADVERTENCIA: Las siguientes columnas presentes en los datos no corresponden a ninguna dimensión definida: ${extraKeysStr}. Estos datos podrían no ser utilizados.`);
    }
  }

  public getDimensionKey(dimensionId: number): string | undefined {
    return this.dimensionKeyMap.get(dimensionId);
  }

  public applyFilters(config: FiltersConfig): void {
    const finalFilters = new Filters();

    if (config.rollUp) {
      finalFilters.rollUp = config.rollUp
        .map((idOrName) => {
          const dimension = this.dimensions.find(
            (d) => d.id === idOrName || d.name === idOrName || d.nameView === idOrName
          );
          return dimension ? this.getDimensionKey(dimension.id) : null;
        })
        .filter((key): key is string => !!key);
    }

    if (config.filter) {
      finalFilters.filter = config.filter
        .map((filterConfig) => {
          const dimension = this.dimensions.find(
            (d) => d.id === filterConfig.name || d.name === filterConfig.name || d.nameView === filterConfig.name
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

  public getRawData(): RowData[] {
    return this.rowData.map(row => ({ ...row }));
  }

  public getCurrentData(): RowData[] {
    return this.dataProvider.getData();
  }

  public getAllDimensions(): Dimension[] {
    return this.dimensions.map(dim => ({ ...dim }));
  }

  public getActiveDimensions(): Dimension[] {
    return this.dataProvider.getActiveDimensions();
  }
}