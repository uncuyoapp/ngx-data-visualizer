/**
 * Tipos base para las tablas de la librería
 */

import { DataProvider } from "../../data-provider";
import { Dimension } from "../../models";

/**
 * Interfaz base para la configuración de tablas
 */
export interface TableConfiguration {
  /** Opciones de configuración del pivot */
  options: PivotConfiguration;
  /** Dimensiones disponibles para la tabla */
  dimensions: Dimension[];
  /** Proveedor de datos para la tabla */
  data: DataProvider;
}

/**
 * Interfaz para la configuración del ordenamiento de dimensiones
 */
export interface PivotSorter {
  /** Nombre de la dimensión a ordenar */
  name: string;
  /** Lista de ítems con su orden específico */
  items: {
    /** Nombre del ítem */
    name: string;
    /** Orden del ítem */
    order: number;
  }[];
}

/**
 * Interfaz para la configuración del pivot table
 */
export interface PivotConfiguration {
  /** Número de decimales a mostrar */
  digitsAfterDecimal: number;
  /** Configuración de ordenamiento para cada dimensión */
  sorters: PivotSorter[];
  /** Indica si se debe mostrar la fila de totales */
  totalRow: boolean;
  /** Indica si se debe mostrar la columna de totales */
  totalCol: boolean;
  /** Lista de nombres de columnas */
  cols: string[];
  /** Lista de nombres de filas */
  rows: string[];
  /** Sufijo opcional para los valores numéricos */
  suffix?: string;
}

/**
 * Interfaz para los datos del pivot table
 */
export interface PivotData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Tipo para el formateador de valores del pivot table
 */
export type PivotFormatter = (value: number) => string;

/**
 * Tipo para el agregador de valores del pivot table
 */
export type PivotAggregator = (data: PivotData[], rowKey: string[], colKey: string[]) => unknown;

/**
 * Tipo para el renderizador del pivot table
 */
export type PivotRenderer = (pivotData: unknown, opts: PivotOptions) => string;

/**
 * Tipo para el derivador de datos del pivot table
 */
export type PivotDeriver = (record: PivotData) => Record<string, unknown>;

/**
 * Interfaz para la configuración de localización del pivot table
 */
export interface PivotLocale {
  /** Agregadores disponibles */
  aggregators: Record<string, unknown>;
  /** Renderizadores disponibles */
  renderers: Record<string, unknown>;
  /** Cadenas de texto localizadas */
  localeStrings: Record<string, string>;
}

/**
 * Interfaz para las opciones de configuración del pivot table
 */
export interface PivotOptions {
  /** Lista de nombres de filas */
  rows?: string[];
  /** Lista de nombres de columnas */
  cols?: string[];
  /** Lista de nombres de valores */
  vals?: string[];
  /** Nombre del agregador a utilizar */
  aggregatorName?: string;
  /** Nombre del renderizador a utilizar */
  rendererName?: string;
  /** Código de localización */
  locale?: string;
  /** Opciones específicas del renderizador */
  rendererOptions?: {
    table?: {
      /** Callback para el evento click */
      clickCallback?: (
        e: JQuery.ClickEvent,
        value: unknown,
        filters: Record<string, unknown>
      ) => void;
    };
  };
  /** Propiedades adicionales */
  [key: string]: unknown;
}

/**
 * Interfaz para las utilidades del pivot table
 */
export interface PivotUtilities {
  /** Plantillas de agregadores disponibles */
  aggregatorTemplates: {
    /** Agregador de suma */
    sum: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
    /** Agregador de conteo */
    count: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
    /** Agregador de promedio */
    average: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
  };
  /** Renderizadores disponibles */
  renderers: Record<string, PivotRenderer>;
  /** Derivadores disponibles */
  derivers: Record<string, PivotDeriver>;
  /** Localizaciones disponibles */
  locales: Record<string, PivotLocale>;
  /** Función de ordenamiento natural */
  naturalSort: (a: string | number, b: string | number) => number;
  /** Función de formateo de números */
  numberFormat: (opts?: { 
    digitsAfterDecimal?: number; 
    scaler?: number; 
    prefix?: string; 
    suffix?: string 
  }) => PivotFormatter;
  /** Función de ordenamiento personalizado */
  sortAs: (orderValues: string[]) => (a: string, b: string) => number;
} 