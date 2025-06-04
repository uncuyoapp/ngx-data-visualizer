/**
 * Interfaces base para la funcionalidad común de gráficos
 */

/**
 * Interfaz base para las opciones de configuración de cualquier librería de gráficos
 */
export interface ChartLibraryOptions {
  [key: string]: unknown;
}

/**
 * Clase de error personalizada para errores relacionados con gráficos
 */
export class ChartError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ChartError';
  }
} 