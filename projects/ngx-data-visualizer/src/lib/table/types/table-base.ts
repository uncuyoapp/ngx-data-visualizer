/**
 * Tipos base para las tablas de la librería
 */

import { Dataset } from "../../services/dataset";
import { TableOptions } from "../../types/data.types";

// Re-exportar TableOptions para que esté disponible desde este módulo
export { TableOptions } from "../../types/data.types";

/**
 * Interfaz base para la configuración de tablas
 */
export interface TableConfiguration {
  /** Opciones de configuración del pivot */
  options: TableOptions;
  /** Conjunto de datos para la tabla */
  dataset: Dataset;
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
export type PivotAggregator = (
  data: PivotData[],
  rowKey: string[],
  colKey: string[],
) => unknown;

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
        filters: Record<string, unknown>,
      ) => void;
    };
  };
  /** Propiedades adicionales */
  [key: string]: unknown;
}
