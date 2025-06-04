/**
 * Tipos base comunes a toda la librería (tanto para gráficos como para tablas)
 * Estos tipos son fundamentales para el manejo de datos en la biblioteca
 */

/**
 * Tipo que define los valores permitidos en una fila de datos.
 * Representa todos los tipos de datos que pueden ser almacenados en una celda.
 * 
 * @example
 * ```typescript
 * const value: DataValue = 42;        // número
 * const text: DataValue = "texto";    // string
 * const flag: DataValue = true;       // boolean
 * const empty: DataValue = null;      // null
 * const undef: DataValue = undefined; // undefined
 * ```
 */
export type DataValue = string | number | boolean | null | undefined;

/**
 * Interfaz base que representa una fila de datos genérica.
 * Cada clave en el objeto representa una columna y su valor puede ser de cualquier tipo DataValue.
 * 
 * @example
 * ```typescript
 * const row: RowData = {
 *   "Año": 2024,
 *   "valor": 100,
 *   "activo": true,
 *   "descripción": "texto"
 * };
 * ```
 */
export interface RowData {
  [key: string]: DataValue;
} 