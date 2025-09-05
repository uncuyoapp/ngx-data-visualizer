import { Type } from "@angular/core";
import { EChartsOption } from "echarts";
import { EchartsComponent } from "../echart/echarts.component";
import { ChartData } from "../utils/chart-data";
import { Dataset } from "../../services/dataset";
import { ChartOptions } from "../../types/data.types";

/**
 * Interfaz base para las opciones de configuración de cualquier librería de gráficos.
 * Permite la extensión de opciones específicas de cada librería de gráficos mediante
 * propiedades dinámicas.
 *
 * Esta interfaz se utiliza para pasar opciones específicas de la implementación
 * de gráficos (como ECharts) sin restringir las propiedades disponibles.
 *
 * @example
 * ```typescript
 * const options: ChartLibraryOptions = {
 *   theme: 'dark',
 *   animation: true,
 *   renderer: 'canvas',
 *   customOption: 'value'
 * };
 * ```
 */
export interface ChartLibraryOptions {
  [key: string]: unknown;
}

/**
 * Interfaz específica para las opciones de configuración de ECharts
 */
export type EChartsLibraryOptions = EChartsOption;

/**
 * Interfaz que define la configuración de una serie del gráfico
 */
export interface SeriesConfig {
  /** Campo para el eje X primario */
  x1: string;
  /** Campo para el eje X secundario (opcional) */
  x2?: string;
  /** Grupo de apilamiento para la serie */
  stack: string | null;
  /** Campo de medida para la serie */
  measure?: string;
}

/**
 * Interfaz principal que define la configuración completa del gráfico
 */
export interface ChartConfiguration {
  /** Componente de renderizado del gráfico */
  chartRenderType: Type<EchartsComponent>;
  /** Dataset con los datos del gráfico */
  dataset: Dataset;
  /** Datos procesados del gráfico */
  chartData: ChartData;
  /** Indica si el gráfico está expandido */
  expanded: boolean;
  /** Opciones específicas de la librería de gráficos */
  libraryOptions: ChartLibraryOptions;
  /** Opciones de configuración del gráfico */
  options: ChartOptions;
  /** Indica si el gráfico está en modo vista previa */
  preview: boolean;
  /** Configuración de las series del gráfico */
  seriesConfig: SeriesConfig;
}

/**
 * Clase de error personalizada para errores relacionados con gráficos.
 * Proporciona información adicional sobre el tipo de error y el error original,
 * facilitando la depuración y el manejo de errores específicos de gráficos.
 *
 * @example
 * ```typescript
 * // Uso básico
 * throw new ChartError(
 *   'No se pudo renderizar el gráfico',
 *   'RENDER_ERROR'
 * );
 *
 * // Con error original
 * try {
 *   // operación que puede fallar
 * } catch (error) {
 *   throw new ChartError(
 *     'Error al procesar los datos del gráfico',
 *     'DATA_PROCESSING_ERROR',
 *     error as Error
 *   );
 * }
 * ```
 */
export class ChartError extends Error {
  /**
   * Crea una nueva instancia de ChartError
   * @param message - Mensaje descriptivo del error
   * @param code - Código identificador del error (útil para manejo programático)
   * @param originalError - Error original que causó este error (opcional)
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "ChartError";
  }
}
