import { DataProvider } from "../data-provider";
import { Dimension } from "../models";

export interface TableConfiguration {
  options: PivotConfiguration;
  dimensions: Dimension[];
  data: DataProvider;
}

export interface PivotSorter {
  name: string;
  items: {
    name: string;
    order: number;
  }[];
}

export interface PivotConfiguration {
  digitsAfterDecimal: number;
  sorters: PivotSorter[];
  totalRow: boolean;
  totalCol: boolean;
  cols: string[];
  rows: string[];
  suffix?: string;
}