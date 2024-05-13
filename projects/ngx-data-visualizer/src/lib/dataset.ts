import { Subject } from "rxjs";
import { DataProvider } from "./data-provider";
import { Dimension, Filters, RowData, TimeSeries } from "./models";

export interface DatasetModel {
  id?: number;
  dimensions: Dimension[];
  enableRollUp: boolean;
  rowData: RowData[];
}

export class Dataset implements DatasetModel {
  readonly id?: number;
  readonly dimensions: Dimension[];
  readonly enableRollUp: boolean;
  readonly rowData: RowData[];
  readonly dataProvider: DataProvider;
  readonly dataUpdated = new Subject<boolean>();

  private timeSeries?: TimeSeries;

  constructor(config: DatasetModel) {
    this.id = config.id;
    this.dimensions = config.dimensions || [];
    this.rowData = config.rowData || [];
    this.enableRollUp = config.enableRollUp;

    this.dataProvider = new DataProvider();
    this.dataProvider.setData(this.rowData);
    this.dataProvider.dimensions = this.dimensions;
  }

  applyFilters(filters: Filters){
    this.dataProvider.filters = filters;
    this.dataUpdated.next(true);
  }
}