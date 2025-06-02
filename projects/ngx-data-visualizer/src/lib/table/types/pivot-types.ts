export interface PivotData {
  [key: string]: string | number | boolean | null | undefined;
}

export type PivotFormatter = (value: number) => string;

export type PivotAggregator = (data: PivotData[], rowKey: string[], colKey: string[]) => unknown;

export type PivotRenderer = (pivotData: unknown, opts: PivotOptions) => string;

export type PivotDeriver = (record: PivotData) => Record<string, unknown>;

export interface PivotLocale {
  aggregators: Record<string, unknown>;
  renderers: Record<string, unknown>;
  localeStrings: Record<string, string>;
}

export interface PivotOptions {
  rows?: string[];
  cols?: string[];
  vals?: string[];
  aggregatorName?: string;
  rendererName?: string;
  locale?: string;
  rendererOptions?: {
    table?: {
      clickCallback?: (
        e: JQuery.ClickEvent,
        value: unknown,
        filters: Record<string, unknown>
      ) => void;
    };
  };
  [key: string]: unknown;
}

export interface PivotUtilities {
  aggregatorTemplates: {
    sum: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
    count: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
    average: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
  };
  renderers: Record<string, PivotRenderer>;
  derivers: Record<string, PivotDeriver>;
  locales: Record<string, PivotLocale>;
  naturalSort: (a: string | number, b: string | number) => number;
  numberFormat: (opts?: { digitsAfterDecimal?: number; scaler?: number; prefix?: string; suffix?: string }) => PivotFormatter;
  sortAs: (orderValues: string[]) => (a: string, b: string) => number;
}
