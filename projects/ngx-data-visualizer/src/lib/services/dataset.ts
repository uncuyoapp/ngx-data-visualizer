import { Subject } from "rxjs";
import { DataProvider } from "./data-provider";
import { Dimension, Filters, RowData } from "../types/data.types";

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
    this.rowData = this.validateRowData(config.rowData);
    this.enableRollUp = Boolean(config.enableRollUp);
    this.dataProvider = new DataProvider({
      dimensions: this.dimensions,
      rowData: this.rowData,
    });

    this.validateDataAgainstDimensions();
  }

  private validateDimensions(dimensions: Dimension[] = []): Dimension[] {
    if (!Array.isArray(dimensions)) {
      console.warn("Las dimensiones deben ser un arreglo, se usará un arreglo vacío");
      return [];
    }

    const uniqueIds = new Set<number>();
    const uniqueNames = new Set<string>();

    return dimensions.map((dim, index) => {
      if (!dim || typeof dim !== "object") {
        throw new Error(`Dimensión en posición ${index} no es un objeto válido`);
      }

      const requiredFields = ["id", "name", "nameView", "items"];
      const missingFields = requiredFields.filter((field) => !(field in dim));

      if (missingFields.length > 0) {
        throw new Error(`Dimensión '${dim.name || "sin nombre"}' falta(n) campo(s) requerido(s): ${missingFields.join(", ")}`);
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
      console.warn("Los datos de fila deben ser un arreglo, se usará un arreglo vacío");
      return [];
    }

    return rowData.map((row, index) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        throw new Error(`Fila en posición ${index} no es un objeto válido`);
      }
      return { ...row };
    });
  }

  private validateDataAgainstDimensions(): void {
    if (this.rowData.length === 0 || this.dimensions.length === 0) {
      return;
    }

    const dataKeys = new Set<string>(Object.keys(this.rowData[0]));

    const missingDimensions = this.dimensions.filter(dim => {
      const foundById = dataKeys.has(dim.id.toString());
      const foundByName = dataKeys.has(dim.name);
      const foundByNameView = dataKeys.has(dim.nameView);
      return !foundById && !foundByName && !foundByNameView;
    });

    if (missingDimensions.length > 0) {
      const missingNames = missingDimensions.map(d => `'${d.nameView}'`).join(', ');
      console.warn(`ADVERTENCIA: Para las siguientes dimensiones, no se encontró una columna de datos que coincida con su 'id', 'name', o 'nameView': ${missingNames}. La visualización podría no funcionar como se espera.`);
    }

    const dimensionIds = new Set(this.dimensions.map(d => d.id.toString()));
    const dimensionNames = new Set(this.dimensions.map(d => d.name));
    const dimensionNameViews = new Set(this.dimensions.map(d => d.nameView));
    const keysToValidate = [...dataKeys].filter(key => key !== 'valor');

    const extraDataKeys = keysToValidate.filter(key => {
      const isDimId = dimensionIds.has(key);
      const isDimName = dimensionNames.has(key);
      const isDimNameView = dimensionNameViews.has(key);
      return !isDimId && !isDimName && !isDimNameView;
    });

    if (extraDataKeys.length > 0) {
      const extraKeysStr = extraDataKeys.map(k => `'${k}'`).join(', ');
      console.warn(`ADVERTENCIA: Las siguientes columnas presentes en los datos no corresponden a ninguna dimensión definida (por id, name, o nameView): ${extraKeysStr}. Estos datos podrían no ser utilizados.`);
    }
  }

  public applyFilters(filters: Filters): void {
    this.dataProvider.filters = filters;
    this.dataUpdated.next(true);
  }

  public getRawData(): RowData[] {
    return this.rowData.map((row) => ({ ...row }));
  }

  public getCurrentData(): RowData[] {
    return this.dataProvider.getData();
  }

  public getAllDimensions(): Dimension[] {
    return this.dimensions.map((dim) => ({ ...dim }));
  }

  public getActiveDimensions(): Dimension[] {
    return this.dataProvider.getActiveDimensions();
  }
}