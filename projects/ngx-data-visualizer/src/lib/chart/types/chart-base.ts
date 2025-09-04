/**
 * Interfaces y tipos base para la funcionalidad común de gráficos.
 * Este archivo contiene las interfaces y clases fundamentales que se utilizan
 * en toda la biblioteca para el manejo de gráficos.
 */

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
