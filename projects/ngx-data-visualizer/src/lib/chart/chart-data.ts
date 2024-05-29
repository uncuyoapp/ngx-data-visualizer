import { DataProvider, DIMENSION_VALUE } from "../data-provider";
import { Dimension, RowData } from "../models";
import { SeriesConfig } from "./chart-configuration";


export class ChartData {

  constructor(
    public dataProvider: DataProvider,
    public seriesConfig: SeriesConfig
  ) { }

  public getItems(column: string, withoutFilter?: boolean): string[] {
    if (withoutFilter) {
      const dimension = this.dataProvider.dimensions.find(d => d.nameView === column);
      return dimension?.items?.map(i => i.name) ?? [];
    } else {
      return this.dataProvider.getItems(column);
    }
  }

  public getSeries(): object[] {
    const { stackKey, axis0, axis1, items, items2, palette } = this.extractVariables();
    const dataStruct = this.createDataStruct(items, items2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = new Map<string, any>();

    this.dataProvider.getData().forEach(row => {
      const { nameSeries, stack, firstLevel, secondLevel, color } = this.processRow(row, stackKey, axis0, axis1, palette);
      if (!series.get(nameSeries)) {
        series.set(nameSeries, {
          name: nameSeries,
          stack: stack !== nameSeries ? stack : null,
          data: new Map(dataStruct),
          color
        });
      }

      const actualSeries = series.get(nameSeries);
      const valor = row['valor'] !== null ? +row['valor'] : row['valor'];
      if (!firstLevel) {
        throw Error('FirstLevel is undefined');
      }
      if (actualSeries === undefined) {
        throw Error('An error ocurred wen find series');
      }
      if (secondLevel) {
        actualSeries.data.set(firstLevel.concat(secondLevel), [secondLevel, valor]);
      } else {
        actualSeries.data.set(firstLevel, [firstLevel, valor]);
      }

    });

    series.forEach(seriesElement => {
      seriesElement.data = Array.from(seriesElement.data.values());
    });
    return Array.from(series.values());
  }

  private extractVariables() {
    let stackKey = '';
    let axis0 = '';
    let axis1 = '';
    let items: string[] = [];
    let items2: string[] = [];
    let palette: Map<string, string> | undefined;


    this.dataProvider.dimensions.forEach(dimension => {
      if (dimension.selected && (!palette || palette.size === 0)) {
        palette = this.getPalette(dimension);
      }
    });

    this.dataProvider.getDimensionsNames().forEach(dimensionName => {
      switch (dimensionName) {
        case this.seriesConfig.x1:
          axis0 = dimensionName;
          items = this.getItems(dimensionName);
          break;
        case this.seriesConfig.x2:
          axis1 = dimensionName;
          items2 = this.getItems(dimensionName);
          break;
        case this.seriesConfig.stack:
          stackKey = dimensionName;
          break;
      }
    });

    return { stackKey, axis0, axis1, items, items2, palette };
  }

  private createDataStruct(items: string[], items2: string[]) {
    const dataStruct = new Map<string, [string, number | null]>();
    items.forEach(item => {
      if (items2.length > 0) {
        items2.forEach(item2 => {
          dataStruct.set(item.concat(item2), [item2, null]);
        });
      } else {
        dataStruct.set(item, [item, null]);
      }
    });
    return dataStruct;
  }


  private processRow(row: RowData, stackKey: string, axis0: string, axis1: string, palette: Map<string, string> | undefined) {
    let nameSeries: string = '';
    let stack: string | undefined;
    let firstLevel: string | undefined;
    let secondLevel: string | undefined;
    let color: string | undefined;

    Object.entries(row).forEach(([key, value]) => {
      value = '' + value;
      switch (key) {
        case stackKey:
          stack = value;
          nameSeries = nameSeries ? `${nameSeries} → ${value}` : value;
          color = !color && palette ? palette.get(value) : color;
          break;
        case axis0:
          firstLevel = value;
          break;
        case axis1:
          secondLevel = value;
          break;
        case DIMENSION_VALUE:
          nameSeries = nameSeries === '' ? this.seriesConfig.measure ?? '' : nameSeries;
          break;
        default:
          nameSeries = nameSeries ? `${nameSeries} → ${value}` : value;
          stack = key === stackKey ? value : stack;
          color = !color && palette ? palette.get(value) : color;
          break;
      }
    });

    return { nameSeries, stack, firstLevel, secondLevel, color };
  }

  private getPalette(dimension: Dimension) {
    const mapColors = new Map();
    dimension.items.filter(item => item.color).forEach(i => mapColors.set(i.name, i.color));
    return mapColors;
  }
}
