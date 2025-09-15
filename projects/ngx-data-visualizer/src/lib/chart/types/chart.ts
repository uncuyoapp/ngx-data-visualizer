import { ChartConfiguration, ChartError } from "./chart-configuration";
import { ChartData } from "../utils/chart-data";
import { ChartOptions } from "../../types/data.types";

/**
 * Clase abstracta base para la implementación de diferentes tipos de gráficos.
 * Proporciona una interfaz común para la manipulación y visualización de datos.
 *
 * @abstract
 */
export abstract class Chart {
  /** Nombre identificador del tipo de gráfico */
  abstract name: string;

  /** Indica si el gráfico está habilitado para su visualización */
  enabled = true;

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
   * Resalta una serie específica al pasar el mouse por encima
   * @param series - Serie a resaltar
   */
  abstract hoverSeries(series: object): void;

  /**
   * Selecciona una serie específica del gráfico
   * @param series - Serie a seleccionar
   */
  abstract selectSeries(series: object): void;

  /**
   * Renderiza el gráfico con los datos y opciones actuales
   * @throws {ChartError} Si hay un error al renderizar el gráfico
   */
  abstract render(): void;

  /**
   * Obtiene las opciones actuales del gráfico
   * @returns Objeto con las opciones de configuración
   */
  abstract getOptions(): object;

  /**
   * Expande el gráfico al ancho especificado
   * @param width - Ancho deseado (número o string con unidades)
   */
  abstract expand(width: number | string): void;

  /** Condensa el gráfico a su tamaño mínimo */
  abstract condense(): void;

  /** Oculta el gráfico */
  abstract hide(): void;

  /** Alterna el modo de visualización de porcentajes */
  abstract togglePercentMode(): void;

  /** Establece los valores extremos del gráfico */
  abstract setExtremes(): void;

  /**
   * Exporta el gráfico en el formato especificado
   * @param type - Tipo de exportación ('svg' o 'jpg')
   * @returns URL o datos del gráfico exportado
   * @throws {ChartError} Si hay un error al exportar el gráfico
   */
  abstract export(type: "svg" | "jpg"): string | void;

  /**
   * Libera los recursos utilizados por el gráfico
   * @throws {ChartError} Si hay un error al liberar los recursos
   */
  abstract dispose(): void;

  /**
   * Método de utilidad para manejar errores comunes
   * @protected
   */
  protected handleError(operation: string, error: unknown): never {
    if (error instanceof Error) {
      throw new ChartError(
        `Error durante la operación '${operation}': ${error.message}`,
        `CHART_${operation.toUpperCase()}_ERROR`,
        error,
      );
    }
    throw new ChartError(
      `Error desconocido durante la operación '${operation}'`,
      `CHART_${operation.toUpperCase()}_ERROR`,
    );
  }
}
