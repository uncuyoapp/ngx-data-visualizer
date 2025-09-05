import { ChartOptions } from "../../types/data.types";

/**
 * Interfaz que define las operaciones necesarias para analizar y configurar opciones de gráficos
 */
export interface ParserOptions {
  /**
   * Obtiene las opciones para la vista previa del gráfico
   * @param config Configuración de opciones del gráfico
   * @returns Objeto con las opciones para la vista previa
   */
  getPreviewOptions(config: ChartOptions): unknown;

  /**
   * Obtiene las opciones completas para el gráfico
   * @param config Configuración de opciones del gráfico
   * @returns Objeto con las opciones completas
   */
  getFullOptions(config: ChartOptions): unknown;

  /**
   * Aplica configuraciones adicionales al gráfico
   * @param config Configuración de opciones
   * @param libraryConfig Configuración actual de la biblioteca de gráficos
   * @returns Configuración actualizada de la biblioteca
   */
  applyChartConfigurations(
    config: ChartOptions,
    libraryConfig: unknown,
  ): unknown;
}
