import { ChartOptions, PercentTransformationResult } from "../../types/data.types";

import { ChartData } from "../utils/chart-data";
import { ChartConfiguration } from "./chart-configuration";

/**
 * Clase abstracta base para la implementación de diferentes tipos de gráficos.
 * Proporciona una interfaz común para la manipulación y visualización de datos.
 *
 * @abstract
 */
export abstract class Chart {
  /** Array de series de datos del gráfico */
  protected abstract series: object[];

  /** Datos del gráfico */
  public get chartData(): ChartData {
    return this.configuration.chartData;
  }

  /** Opciones específicas de la biblioteca de gráficos utilizada */
  public libraryOptions: object;

  /** Opciones de configuración del gráfico */
  public chartOptions: ChartOptions;

  /**
   * Constructor de la clase Chart
   * @param configuration - Configuración inicial del gráfico
   */
  constructor(public configuration: ChartConfiguration) {
    this.libraryOptions = configuration.libraryOptions;
    this.chartOptions = configuration.options;
  }

  /** Instancia del gráfico de la biblioteca subyacente */
  abstract set instance(instance: object);
  abstract get instance(): object;

  /**
   * Obtiene todas las series de datos del gráfico
   * @returns Array de series de datos
   */
  abstract getSeries(): object[];

  /**
   * Agrega una nueva serie de datos al gráfico
   * @param series - Serie de datos a agregar
   */
  abstract addSeries(series: object): void;

  /**
   * Elimina una serie de datos del gráfico
   * @param series - Serie de datos a eliminar
   */
  abstract delSeries(series: object): void;

  /**
   * Renderiza el gráfico con los datos y opciones actuales
   * @throws {ChartError} Si hay un error al renderizar el gráfico
   */
  abstract render(): void;

  /** Alterna el modo de visualización de porcentajes */
  abstract togglePercentMode(enable?: boolean): PercentTransformationResult;

  /** Consulta si el gráfico se encuentra en modo porcentual */
  abstract isPercentMode(): boolean;

  /** Alterna la visibilidad de la leyenda nativa del gráfico */
  abstract toggleLegendVisibility(show: boolean): void;

  /** Establece los valores extremos del gráfico */
  abstract setExtremes(start?: number, end?: number): void;

  /** Obtiene los valores extremos actuales del navegador del gráfico */
  abstract getExtremes(): { start: number, end: number } | null;

  /**
   * Exporta el gráfico en el formato especificado
   * @param type - Tipo de exportación ('png' o 'jpg')
   * @returns void
   * @throws {ChartError} Si hay un error al exportar el gráfico
   */
  abstract export(type: "png" | "jpg"): void;

  /**
   * Libera los recursos utilizados por el gráfico
   * @throws {ChartError} Si hay un error al liberar los recursos
   */
  abstract dispose(): void;
}
