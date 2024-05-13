import { uniqBy } from 'lodash';
import { Dimension, Filters, RowData } from './models';

export const DIMENSION_YEAR = 'Año';
export const DIMENSION_VALUE = 'valor';

export class DataProvider {
  public filters: Filters;
  public dimensions: Dimension[];
  private rowData: RowData[];

  constructor() {
    this.filters = {
      rollUp: [],
      filter: []
    };
    this.dimensions = [];
    this.rowData = [];
  }

  getDimensions(): Dimension[]{
    return this.dimensions.filter(dimension => this.filters.rollUp.indexOf(dimension.nameView) === -1);
  }

  /**
   * Set the data for ArrayData
   * @param data - An array of data.
   */
  setData(data: RowData[]): void {
    this.rowData = data;
  }

  /**
   * Get the data of ArrayData
   * @returns - Array of data
   */
  getData(): RowData[] {
    return this.processConfig();
  }

  /**
   * Returns the dimensions names of current data
   * @returns - Array of strings
   */
  getDimensionsNames(): string[] {
    const row = this.processConfig()[0] || {};
    return Object.keys(row);
  }

  /**
   * Returns all items of dimension by name
   * @param dimensionName
   * @returns - Array of strings
   */
  getItems(dimensionName: string): string[] {
    const processedConfig = this.processConfig();
    const items = uniqBy(processedConfig, dimensionName).map((i) => i[dimensionName]) as string[];

    if (dimensionName !== DIMENSION_YEAR) {
      const dimension = this.dimensions.find((a) => a.nameView === dimensionName);
      if (dimension && dimension.items.length > 0) {
        items.sort((a, b) => {
          const itemA = dimension.items.find((i) => i.name === a);
          const itemB = dimension.items.find((i) => i.name === b);
          return (itemA?.order ?? 0) - (itemB?.order ?? 0);
        });
      }
    }
    return items;
  }

  private processConfig(): RowData[] {
    const mapFilter = new Map();
    for (const row of this.rowData) {
      if (!this.isFiltered(row)) {
        this.rollUp({ ...row }, mapFilter);
      }
    }
    return Array.from(mapFilter.values());
  }

  private isFiltered(row: RowData): boolean {
    if (!this.filters) {
      return false;
    }
    for (const filter of this.filters.filter) {
      if (filter.items.indexOf(row[filter.name]) === -1) {
        return true;
      }
    }
    return false;
  }

  private rollUp(row: RowData, mapFilter: Map<string, RowData>): void {
    if (this.filters.rollUp.length === 0) {
      mapFilter.set(Object.values(row).toString(), row);
    } else {
      const value = row[DIMENSION_VALUE];
      delete row[DIMENSION_VALUE];
      for (const [key] of Object.entries(row)) {
        if (this.filters.rollUp.indexOf(key) !== -1) {
          delete row[key];
        }
      }
      const key = Object.values(row).toString();
      const existingRow = mapFilter.get(key);

      if (existingRow) {
        existingRow[DIMENSION_VALUE] = (+existingRow[DIMENSION_VALUE] || 0) + (+value || 0);
      } else {
        row[DIMENSION_VALUE] = +value;
        mapFilter.set(key, row);
      }
    }
  }
}