/**
 * Tipo que define los valores permitidos en una fila de datos.
 * Representa todos los tipos de datos que pueden ser almacenados en una celda.
 */
export type DataValue = string | number | null;

/**
 * Interfaz base que representa una fila de datos genérica.
 * Cada clave en el objeto representa una columna y su valor puede ser de cualquier tipo DataValue.
 */
export interface RowData {
  [key: string]: DataValue;
}

/**
 * Interfaz que representa una dimensión en el conjunto de datos
 */
export interface Dimension {
  /** Identificador único de la dimensión */
  id: number;

  /** Nombre interno de la dimensión */
  name: string;

  /** Nombre para mostrar de la dimensión */
  nameView: string;

  /** Elementos que componen la dimensión */
  items: Item[];

  /** Tipo de dimensión (opcional) */
  type?: number;

  /** Indica si la dimensión puede desagregarse en múltiples gráficos (opcional) */
  enableMulti?: boolean;

  /** Indica si la dimensión está seleccionada (opcional) */
  selected?: boolean;
}

/**
 * Interfaz que representa un ítem dentro de una dimensión
 */
export interface Item {
  /** Identificador único del ítem */
  id: number;

  /** Nombre del ítem */
  name: string;

  /** Color asociado al ítem (opcional) */
  color?: string;

  /** Orden de visualización del ítem (opcional) */
  order?: number;

  /** Indica si el ítem está seleccionado */
  selected: boolean;
}

/**
 * Configuración para un filtro de dimensión. Permite usar el id o el nombre de la dimensión.
 */
export interface DimensionFilterConfig {
  name: string | number;
  items: (string | number)[];
}

/**
 * Objeto para la configuración de filtros y agrupaciones (roll-up).
 */
export interface FiltersConfig {
  rollUp?: (string | number)[];
  filter?: DimensionFilterConfig[];
}

/**
 * Interfaz para la configuración del ordenamiento de dimensiones
 */
export interface TableSorter {
  /** Nombre o ID de la dimensión a ordenar */
  name: string | number;
  /** Lista de ítems con su orden específico */
  items: {
    /** Nombre del ítem */
    name: string;
    /** Orden del ítem */
    order: number;
  }[];
}

/**
 * Interfaz para la configuración de una tabla
 */
export interface TableOptions {
  /** Número de decimales a mostrar */
  digitsAfterDecimal: number;
  /** Configuración de ordenamiento para cada dimensión */
  sorters: TableSorter[];
  /** Indica si se debe mostrar la fila de totales */
  totalRow: boolean;
  /** Indica si se debe mostrar la columna de totales */
  totalCol: boolean;
  /** Lista de nombres o IDs de columnas */
  cols: (string | number)[];
  /** Lista de nombres o IDs de filas */
  rows: (string | number)[];
  /** Sufijo opcional para los valores numéricos */
  suffix?: string;
  /** Define el modo de visualización de los valores en la tabla */
  valueDisplay?:
    | "nominal"
    | "percentOfTotal"
    | "percentOfRow"
    | "percentOfColumn";
  /** Atributos derivados para la tabla pivot */
  derivedAttributes?: Record<
    string,
    (record: Record<string, unknown>) => unknown
  >;
}

/**
 * Interfaz principal que define las opciones de configuración para un gráfico.
 * Esta es la interfaz utilizada en toda la librería para la configuración de gráficos.
 * Proporciona opciones completas para personalizar el comportamiento y apariencia
 * de los gráficos generados.
 *
 * @example
 * ```typescript
 * const chartConfig: ChartOptions = {
 *   type: 'column',
 *   title: 'Ventas por Mes',
 *   stacked: null,
 *   xAxis: {
 *     title: 'Mes',
 *     rotateLabels: 45,
 *     firstLevel: 0,
 *     secondLevel: null
 *   },
 *   yAxis: {
 *     title: 'Ventas (€)',
 *     max: null
 *   },
 *   tooltip: {
 *     shared: true,
 *     decimals: 2,
 *     suffix: '€',
 *     format: null,
 *     showTotal: true
 *   },
 *   legends: {
 *     enabled: true,
 *     show: true,
 *     position: 'right'
 *   },
 *   navigator: {
 *     show: false,
 *     start: null,
 *     end: null
 *   },
 *   colors: ['#3498db', '#e74c3c', '#2ecc71'],
 *   width: 800,
 *   height: 400,
 *   filterLastYear: false,
 *   showYearsLegend: false,
 *   toPercent: false,
 *   measureUnit: '€',
 *   isPreview: false,
 *   disableAutoUpdate: false
 * };
 * ```
 */
export interface ChartOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;
  /** Título del gráfico */
  title?: string;
  /** Indica si el gráfico está apilado y el nombre del grupo de apilamiento */
  stacked: string | null;
  /** Configuración del eje X - define títulos, rotación de etiquetas y niveles de agrupación */
  xAxis: {
    /** Título del eje X que se muestra junto al eje */
    title: string;
    /** Ángulo de rotación de las etiquetas en grados (0-360). Útil para etiquetas largas */
    rotateLabels: number | null;
    /** Nivel de agrupación primario para datos jerárquicos */
    firstLevel: number;
    /** Nivel de agrupación secundario para datos jerárquicos (opcional) */
    secondLevel: number | null;
  };
  /** Configuración del eje Y - define título y límites del eje vertical */
  yAxis: {
    /** Título del eje Y que se muestra junto al eje */
    title: string;
    /** Valor máximo del eje Y. Si es null, se calcula automáticamente */
    max: number | null;
  };
  /** Configuración del tooltip - define cómo se muestran los datos al pasar el mouse */
  tooltip: {
    /** Indica si el tooltip es compartido entre series o individual para cada serie */
    shared: boolean;
    /** Número de decimales a mostrar en los valores numéricos */
    decimals: number | null;
    /** Sufijo para los valores (ej: '%', '€', 'kg') */
    suffix: string | null;
    /** Formato personalizado para los valores usando placeholders */
    format: string | null;
    /** Indica si se debe mostrar el total en el tooltip cuando hay múltiples series */
    showTotal: boolean;
  };
  /** Configuración de las leyendas - controla la visualización y posición de las leyendas */
  legends: {
    /** Indica si las leyendas están habilitadas en el gráfico */
    enabled: boolean;
    /** Indica si se muestran las leyendas (puede estar habilitado pero oculto) */
    show: boolean;
    /** Posición de las leyendas ('top', 'right', 'bottom', 'left') */
    position: string;
  };
  /** Configuración del navegador - controla el zoom y navegación en los datos */
  navigator: {
    /** Indica si se muestra el navegador en el gráfico */
    show: boolean;
    /** Valor inicial del navegador (0-100) */
    start: number | null;
    /** Valor final del navegador (0-100) */
    end: number | null;
  };
  /** Array de colores personalizados para las series del gráfico */
  colors?: string[];
  /** Ancho del gráfico en píxeles. Si es null, se ajusta automáticamente */
  width: number | null;
  /** Alto del gráfico en píxeles o porcentaje. Si es null, se ajusta automáticamente */
  height: number | string | null;
  /** Indica si se debe filtrar automáticamente el último año de los datos */
  filterLastYear: boolean;
  /** Indica si se debe mostrar la leyenda específica de años en el gráfico */
  showYearsLegend: boolean;
  /** Indica si los valores se deben mostrar en formato porcentual */
  toPercent: boolean;
  /** Unidad de medida para mostrar junto a los valores (ej: '€', 'kg', '%') */
  measureUnit: string;
  /** Indica si el gráfico está en modo vista previa (puede afectar funcionalidades) */
  isPreview: boolean;
  /** Indica si se debe deshabilitar la actualización automática del gráfico */
  disableAutoUpdate: boolean;
}

/**
 * Interfaz que representa una meta u objetivo para visualización
 */
export interface Goal {
  /** Tipo de gráfico para representar la meta */
  chartType: string;

  /** Texto descriptivo de la meta */
  text: string;

  /** Datos asociados a la meta */
  data: RowData[];
}

/**
 * Interfaz que representa una serie temporal de datos
 */
export interface TimeSeries {
  /** Arreglo de valores de tiempo */
  arrayTime: string[] | number[];
}

/**
 * Interfaz que representa una serie de datos para gráficos
 * Extiende de BaseSeries para mantener compatibilidad con el código existente
 */
export interface Series {
  /** Color de la serie */
  color: string;
  /** Indica si la serie es visible */
  visible: boolean;
  /** Tipo de serie para ECharts (line, bar, pie, etc.) */
  type?: string;
  /** Nombre de la serie */
  name: string;
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
