/**
 * Declaración de tipos para pivottable
 */

// Extender la interfaz de jQuery para incluir los métodos de pivottable
interface JQuery {
  pivot(data: any[], options?: any, locale?: string): JQuery;
}

// Extender JQueryStatic para incluir pivotUtilities
interface JQueryStatic {
  pivotUtilities: {
    aggregatorTemplates: {
      sum: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
      count: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
      average: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
    };
    renderers: {
      [key: string]: any;
    };
    derivers: {
      [key: string]: any;
    };
    locales: {
      [key: string]: any;
    };
    naturalSort: (a: any, b: any) => number;
    numberFormat: (opts?: any) => (num: number) => string;
    sortAs: (orderValues: string[]) => (a: string, b: string) => number;
  };
}
