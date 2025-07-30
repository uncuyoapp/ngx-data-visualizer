/**
 * Interfaces y tipos base para la funcionalidad común de gráficos.
 * Estas interfaces definen la estructura base para la configuración y manejo de gráficos
 * en la biblioteca, independientemente de la librería de gráficos específica utilizada.
 */

/**
 * Interfaz base para las opciones de configuración de cualquier librería de gráficos.
 * Permite la extensión de opciones específicas de cada librería de gráficos.
 * 
 * @example
 * ```typescript
 * const options: ChartLibraryOptions = {
 *   theme: 'dark',
 *   animation: true,
 *   customOption: 'value'
 * };
 * ```
 */
export interface ChartLibraryOptions {
  [key: string]: unknown;
}

/**
 * Interfaz base para series de datos en gráficos.
 * Define la estructura común para representar series de datos en cualquier tipo de gráfico.
 * 
 * @example
 * ```typescript
 * const series: BaseSeries = {
 *   name: 'Ventas 2024',
 *   color: '#FF0000',
 *   visible: true,
 *   data: [100, 200, 300],
 *   smooth: true,
 *   stacking: 'total',
 *   chartType: 'line',
 *   symbol: 'circle',
 *   symbolSize: 6,
 *   lineStyle: {
 *     width: 2,
 *     type: 'solid'
 *   }
 * };
 * ```
 */
export interface BaseSeries {
  /** Nombre de la serie */
  name: string;
  /** Color de la serie en formato hexadecimal o nombre de color */
  color?: string;
  /** Indica si la serie es visible en el gráfico */
  visible?: boolean;
  /** Datos de la serie. Puede ser un array de números, pares [x,y] u objetos con valor */
  data: Array<number | [number, number] | { value: number }>;
  /** Indica si la serie debe mostrarse con líneas suaves (curvas) */
  smooth?: boolean;
  /** Indica si la serie debe apilarse con otras series y el nombre del grupo de apilamiento */
  stacking?: string;
  /** Tipo de gráfico asociado a la serie (ej: 'line', 'bar', 'pie') */
  chartType?: string;
  /** Símbolo para los puntos de la serie (ej: 'circle', 'rect', 'triangle') */
  symbol?: string;
  /** Tamaño del símbolo en píxeles */
  symbolSize?: number;
  /** Estilo de la línea para gráficos de línea */
  lineStyle?: {
    /** Ancho de la línea en píxeles */
    width?: number;
    /** Tipo de línea (ej: 'solid', 'dashed', 'dotted') */
    type?: string;
  };
}

/**
 * Interfaz base para configuración de tooltip en gráficos.
 * Define las opciones comunes para mostrar información al pasar el mouse sobre los datos.
 * 
 * @example
 * ```typescript
 * const tooltip: BaseTooltipConfig = {
 *   showTotal: true,
 *   decimals: 2,
 *   suffix: '%',
 *   format: '{value}%',
 *   shared: true
 * };
 * ```
 */
export interface BaseTooltipConfig {
  /** Indica si se debe mostrar el total en el tooltip cuando hay múltiples series */
  showTotal?: boolean;
  /** Número de decimales a mostrar en los valores numéricos */
  decimals?: number;
  /** Sufijo para los valores (ej: '%', '€', 'kg') */
  suffix?: string;
  /** Formato personalizado para los valores usando placeholders */
  format?: string;
  /** Indica si el tooltip es compartido entre series o individual para cada serie */
  shared?: boolean;
}

/**
 * Interfaz base para configuración de ejes en gráficos.
 * Define las opciones comunes para la personalización de ejes X e Y.
 * 
 * @example
 * ```typescript
 * const axis: BaseAxisConfig = {
 *   title: 'Año',
 *   max: 2024,
 *   rotateLabels: 45,
 *   firstLevel: 1,
 *   secondLevel: 2
 * };
 * ```
 */
export interface BaseAxisConfig {
  /** Título del eje que se muestra junto al eje */
  title: string;
  /** Valor máximo del eje (útil para establecer límites) */
  max?: number;
  /** Ángulo de rotación de las etiquetas en grados (0-360) */
  rotateLabels?: number;
  /** Nivel de agrupación primario para datos jerárquicos */
  firstLevel?: number;
  /** Nivel de agrupación secundario para datos jerárquicos */
  secondLevel?: number;
}

/**
 * Interfaz base para la configuración de leyendas en gráficos.
 * Define las opciones comunes para mostrar y posicionar las leyendas.
 * 
 * @example
 * ```typescript
 * const legend: BaseLegendConfig = {
 *   enabled: true,
 *   show: true,
 *   position: 'right'
 * };
 * ```
 */
export interface BaseLegendConfig {
  /** Indica si las leyendas están habilitadas en el gráfico */
  enabled: boolean;
  /** Indica si se muestran las leyendas (puede estar habilitado pero oculto) */
  show: boolean;
  /** Posición de las leyendas ('top', 'right', 'bottom', 'left') */
  position: string;
}

/**
 * Interfaz base para la configuración del navegador en gráficos.
 * Define las opciones para el control de zoom y navegación en los datos.
 * 
 * @example
 * ```typescript
 * const navigator: BaseNavigatorConfig = {
 *   show: true,
 *   start: 0,
 *   end: 100
 * };
 * ```
 */
export interface BaseNavigatorConfig {
  /** Indica si se muestra el navegador en el gráfico */
  show: boolean;
  /** Valor inicial del navegador (0-100) */
  start: number | null;
  /** Valor final del navegador (0-100) */
  end: number | null;
}

/**
 * Interfaz base que define las opciones de configuración para un gráfico.
 * Agrupa todas las configuraciones necesarias para personalizar un gráfico.
 * 
 * @example
 * ```typescript
 * const config: BasechartOptions = {
 *   type: 'column',
 *   title: 'Ventas 2024',
 *   stacked: 'total',
 *   xAxis: { title: 'Mes' },
 *   yAxis: { title: 'Ventas' },
 *   tooltip: { showTotal: true },
 *   legends: { enabled: true, show: true, position: 'right' },
 *   navigator: { show: true, start: 0, end: 100 },
 *   colors: ['#FF0000', '#00FF00'],
 *   width: 800,
 *   height: 400
 * };
 * ```
 */
export interface BaseChartOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;
  /** Título del gráfico que se muestra en la parte superior */
  title?: string;
  /** Indica si el gráfico está apilado y el nombre del grupo de apilamiento */
  stacked: string | null;
  /** Configuración del eje X */
  xAxis: BaseAxisConfig;
  /** Configuración del eje Y */
  yAxis: BaseAxisConfig;
  /** Configuración del tooltip */
  tooltip: BaseTooltipConfig;
  /** Configuración de las leyendas */
  legends: BaseLegendConfig;
  /** Configuración del navegador */
  navigator: BaseNavigatorConfig;
  /** Array de colores personalizados para las series */
  colors?: string[];
  /** Ancho del gráfico en píxeles */
  width: number | null;
  /** Alto del gráfico en píxeles o porcentaje */
  height: number | string | null;
}

/**
 * Clase de error personalizada para errores relacionados con gráficos.
 * Proporciona información adicional sobre el tipo de error y el error original.
 * 
 * @example
 * ```typescript
 * throw new ChartError(
 *   'No se pudo renderizar el gráfico',
 *   'RENDER_ERROR',
 *   originalError
 * );
 * ```
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