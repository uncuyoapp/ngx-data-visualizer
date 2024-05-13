export interface Dimension {
  id: number;
  name: string;
  nameView: string;
  items: Item[];
  selected: boolean;
  showItems: boolean;
  enableMulti: boolean;
  type?: number;
}

export interface Item {
  id: number;
  name: string;
  color?: string;
  order?: number;
  selected: boolean;
}

export interface TimeSeries {
  arrayTime: string[] | number[];
}

export class Filters {
  rollUp!: string[];
  filter!: DimensionFilter[];
}

export interface DimensionFilter {
  name: string;
  items: Array<string | number>;
}

export interface RowData {
  [key: string]: string | number;
}

export interface Series {
  name: string;
  color: string;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface Goal {
  chartType: string;
  text: string;
  data: RowData[];
}