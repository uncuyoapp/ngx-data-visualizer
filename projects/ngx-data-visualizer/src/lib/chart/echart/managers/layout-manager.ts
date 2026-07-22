/**
 * @fileoverview
 * Administrador de diseño (Layout) para los gráficos del motor ECharts.
 * Se encarga de particionar y distribuir de manera secuencial los diferentes
 * componentes visuales (título, leyenda, grilla, navegador de datos/dataZoom y ejes)
 * para evitar solapamientos y maximizar el área útil de dibujo.
 *
 * Utiliza un modelo conceptual de ranuras ("slots") basado en la dimensión atómica:
 *   - marginBefore: Espacio libre/separación previa al elemento.
 *   - size: Dimensión (alto en vertical, ancho en horizontal) que consume el elemento.
 *   - marginAfter: Espacio libre/separación posterior al elemento.
 *
 * Con este modelo, el margen de la cuadrícula (grid) se expande reactiva y acumulativamente
 * según los componentes que se encuentren activos en la configuración.
 */

import { EChartsOption } from 'echarts';
import { ChartOptions } from '../../../types/data.types';
import { ChartData } from '../../utils/chart-data';

/**
 * Representa la configuración atómica de dimensiones para un elemento individual de diseño.
 * Cada elemento visual se modela como una "ranura" con sus respectivos márgenes.
 */
export interface SlotConfig {
  /** Espacio libre en píxeles antes del elemento (ej. margen superior para apilado vertical). */
  marginBefore: number;
  /** Tamaño nominal en píxeles que ocupa el componente (alto o ancho según la orientación). */
  size: number;
  /** Espacio de separación en píxeles posterior al elemento (ej. margen inferior). */
  marginAfter: number;
}

/**
 * Configuración centralizada de todos los espaciados, alturas, anchos y márgenes
 * de diseño que rigen las dimensiones de los elementos del gráfico.
 */
export interface AxisLayoutConfig {
  /** Slot y límites para el título del eje de categorías (X en estándar, Y en barras). */
  categoryTitle: SlotConfig & {
    maxTruncateWidth: number;
  };
  /** Slot y límites para el título del eje de valores (Y en estándar, X en barras). */
  valueTitle: SlotConfig & {
    maxTruncateWidth: number;
  };
  /** Configuración para gráficos de doble nivel (eje dual). */
  dualLevel: {
    /** Desplazamiento base en píxeles para el segundo eje para evitar colisiones. */
    baseOffset: number | 'auto';
    /** Separación extra (aire) en píxeles entre el primer y segundo nivel. */
    levelGap?: number;
  };
}

/**
 * Configuración centralizada de todos los espaciados, alturas, anchos y márgenes
 * de diseño que rigen las dimensiones de los elementos del gráfico.
 */
export interface LayoutConfig {
  /** Márgenes base externos (padding del contenedor principal hacia la grilla). */
  grid: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };

  /** Configuración del slot para el título del gráfico. */
  title: SlotConfig & {
    /** Ancho máximo en píxeles permitido antes de truncar el texto con puntos suspensivos. */
    maxTruncateWidth: number;
  };

  /** Configuración del slot para las leyendas del gráfico. */
  legend: {
    /** Dimensiones aplicadas cuando la leyenda se posiciona horizontalmente (ej. bottom). */
    bottom: SlotConfig;
    /** Dimensiones aplicadas cuando la leyenda se posiciona en los laterales (ej. left/right en pie charts). */
    lateral: SlotConfig;
  };

  /** Configuración del slot para el slider de navegación (navigator/dataZoom). */
  navigator: SlotConfig;

  /** Límites globales de dimensiones de las etiquetas (labels) de los ejes. */
  labels: {
    /** Ancho máximo en píxeles de etiquetas del primer nivel antes de truncar. */
    maxWidth1stLevel: number;
    /** Ancho máximo en píxeles de etiquetas del segundo nivel antes de truncar. */
    maxWidth2ndLevel: number;
    /** Altura base estimada de una etiqueta estándar horizontal. */
    baseHeight: number;
  };

  /** Estrategia de diseño para gráficos estándar (Column/Line/Area/etc). */
  column: AxisLayoutConfig;

  /** Estrategia de diseño para gráficos de barras horizontales (Bar). */
  bar: AxisLayoutConfig;

  /** Configuración específica de espaciado para el gráfico de torta (Pie). */
  pie: {
    /** Coeficiente multiplicador (0.0 a 1.0) para ajustar el tamaño del radio del Pie al espacio libre. */
    radiusFactor: number;
  };
}

/**
 * Configuración por defecto del sistema de layout.
 * Define la estructura espacial inicial que se usará para realizar las sumas secuenciales de slots.
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  grid: {
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    marginBefore: 5,
    size: 30,
    marginAfter: 10,
    maxTruncateWidth: 500,
  },
  legend: {
    bottom: {
      marginBefore: 10,
      size: 10,
      marginAfter: 5,
    },
    lateral: {
      marginBefore: 10,
      size: 80,
      marginAfter: 10,
    },
  },
  navigator: {
    marginBefore: 10,
    size: 30,
    marginAfter: 5,
  },
  labels: {
    maxWidth1stLevel: 80,
    maxWidth2ndLevel: 120,
    baseHeight: 20,
  },
  column: {
    categoryTitle: {
      marginBefore: 30,
      size: 15,
      marginAfter: 10,
      maxTruncateWidth: 280,
    },
    valueTitle: {
      marginBefore: 10,
      size: 15,
      marginAfter: 10,
      maxTruncateWidth: 240,
    },
    dualLevel: {
      baseOffset: 30,
    },
  },
  bar: {
    categoryTitle: {
      marginBefore: 10,
      size: 15,
      marginAfter: 20,
      maxTruncateWidth: 280,
    },
    valueTitle: {
      marginBefore: 10,
      size: 15,
      marginAfter: 10,
      maxTruncateWidth: 240,
    },
    dualLevel: {
      baseOffset: 'auto',
      levelGap: 20,
    },
  },
  pie: {
    radiusFactor: 0.80,
  },
};

/**
 * Orientaciones posibles de los componentes visuales en ECharts.
 */
export type LayoutOrientation = 'horizontal' | 'vertical';

/**
 * Representa un valor de coordenadas en ECharts que puede ser numérico (píxeles absolutos)
 * o de tipo texto (porcentajes o cadenas clave de posición como 'center', 'middle').
 */
export type CoordinateValue = string | number;

/**
 * Interfaz resultante del cálculo del layout.
 * Contiene todas las directrices, márgenes y posiciones computadas de manera unificada
 * que serán aplicadas en ECharts y consumidas por otros manejadores (como AxisManager).
 */
export interface LayoutResult {
  grid: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    /** Modo en que se restringe el desbordamiento de la cuadrícula (ECharts 6+). */
    outerBoundsMode: 'none' | 'same';
    /** Qué elementos se incluyen dentro del bounding box del grid (ECharts 6+). */
    outerBoundsContain: 'axisLabel' | 'all' | 'none';
  };

  /** Configuración y posición resultante para el título principal. */
  title: {
    show: boolean;
    top: number;
    left: string;
    maxWidth: number;
  };

  /** Configuración resultante de posicionamiento para la leyenda del gráfico. */
  legend: {
    show: boolean;
    orient: LayoutOrientation;
    left?: CoordinateValue;
    right?: CoordinateValue;
    top?: CoordinateValue;
    bottom?: CoordinateValue;
  };

  /** Configuración resultante de posicionamiento y visualización para el control de dataZoom (navigator). */
  navigator: {
    show: boolean;
    orient: LayoutOrientation;
    bottom?: number;
    left?: number;
    height?: number;
    width?: number;
    axisIndex: number | number[];
  };

  /** Valores calculados para el dimensionamiento y distancias de los ejes. */
  axis: {
    /** Separación del título del eje de categorías respecto a su línea de eje. */
    categoryNameGap: number;
    /** Separación del título del eje de valores respecto a su línea de eje. */
    valueNameGap: number;
    /** Offset/desplazamiento vertical u horizontal para ubicar el eje secundario en doble nivel. */
    dualLevelOffset: number;
    /** Ancho máximo permitido para el título del eje de categorías. */
    categoryTitleMaxWidth: number;
    /** Ancho máximo permitido para el título del eje de valores. */
    valueTitleMaxWidth: number;
    /** Ancho máximo permitido para las etiquetas del primer nivel. */
    firstLevelLabelMaxWidth: number;
    /** Ancho máximo permitido para las etiquetas del segundo nivel. */
    secondLevelLabelMaxWidth: number;
  };

  /** Coordenadas de posicionamiento específicos para gráficos radiales (Pie Chart). */
  pie?: {
    /** Punto de coordenadas del centro de la torta: [X%, Y%] */
    center: [string, string];
    /** Radio exterior resultante en formato porcentaje: 'X%' */
    radius: string;
  };
}

/**
 * Función utilitaria pura que calcula la suma total del espacio que ocupa un slot.
 * Representa la fórmula matemática: marginBefore + size + marginAfter
 * 
 * @param slot Estructura del slot a calcular.
 * @returns Ancho o alto total del slot en píxeles.
 */
function slotTotal(slot: SlotConfig): number {
  return slot.marginBefore + slot.size + slot.marginAfter;
}

/**
 * Gestor encargado de la orquestación, cálculo y asignación de layouts para gráficos de ECharts.
 * Divide los flujos de dibujo en dos grandes estrategias:
 *   - Cartesianos (Grupo A estándar y Grupo B horizontal de barras): Comparten lógica a través de inversión de slots.
 *   - Radiales (Grupo C de torta/Pie): Se posicionan en base a centro y radio sin utilizar cuadrícula de grilla.
 */
export class LayoutManager {
  /** Configuración final de espaciados (fusión de valores por defecto y personalizados). */
  public readonly config: LayoutConfig;

  /**
   * Inicializa la clase y realiza una copia profunda para mezclar configuraciones de layout.
   * 
   * @param config Objeto parcial de configuración para sobreescribir los valores por defecto.
   */
  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = {
      grid: {
        ...DEFAULT_LAYOUT_CONFIG.grid,
        ...(config.grid || {}),
      },
      title: {
        ...DEFAULT_LAYOUT_CONFIG.title,
        ...(config.title || {}),
      },
      legend: {
        bottom: {
          ...DEFAULT_LAYOUT_CONFIG.legend.bottom,
          ...(config.legend?.bottom || {}),
        },
        lateral: {
          ...DEFAULT_LAYOUT_CONFIG.legend.lateral,
          ...(config.legend?.lateral || {}),
        },
      },
      navigator: {
        ...DEFAULT_LAYOUT_CONFIG.navigator,
        ...(config.navigator || {}),
      },
      labels: {
        ...DEFAULT_LAYOUT_CONFIG.labels,
        ...(config.labels || {}),
      },
      column: {
        categoryTitle: {
          ...DEFAULT_LAYOUT_CONFIG.column.categoryTitle,
          ...(config.column?.categoryTitle || {}),
        },
        valueTitle: {
          ...DEFAULT_LAYOUT_CONFIG.column.valueTitle,
          ...(config.column?.valueTitle || {}),
        },
        dualLevel: {
          ...DEFAULT_LAYOUT_CONFIG.column.dualLevel,
          ...(config.column?.dualLevel || {}),
        },
      },
      bar: {
        categoryTitle: {
          ...DEFAULT_LAYOUT_CONFIG.bar.categoryTitle,
          ...(config.bar?.categoryTitle || {}),
        },
        valueTitle: {
          ...DEFAULT_LAYOUT_CONFIG.bar.valueTitle,
          ...(config.bar?.valueTitle || {}),
        },
        dualLevel: {
          ...DEFAULT_LAYOUT_CONFIG.bar.dualLevel,
          ...(config.bar?.dualLevel || {}),
        },
      },
      pie: {
        ...DEFAULT_LAYOUT_CONFIG.pie,
        ...(config.pie || {}),
      },
    };
  }

  /**
   * Método de orquestación principal del layout.
   * Ejecuta el análisis espacial de acuerdo al tipo de gráfico y mapea el resultado 
   * de vuelta en las opciones nativas de ECharts.
   * 
   * @param libraryOptions Opciones de ECharts que serán modificadas de forma directa.
   * @param options Opciones de configuración provistas por el usuario.
   * @param chartData Estructuras procesadas de datos y agrupaciones de la serie.
   * @returns Un objeto `LayoutResult` con los datos calculados de distribución espacial.
   */
  public configureLayout(
    libraryOptions: EChartsOption,
    options: ChartOptions,
    chartData: ChartData
  ): LayoutResult {
    const isPie = options.type === 'pie';
    const result = isPie
      ? this.configurePieLayout(options)
      : this.configureCartesianLayout(options, chartData);

    if (libraryOptions) {
      this.applyToEChartsOptions(libraryOptions, result, options);
    }

    return result;
  }

  /**
   * Estrategia de cálculo de diseño para gráficos cartesianos (estándar y barras horizontales).
   * Determina los espacios ocupados por el título, la leyenda inferior, el navigator (dataZoom)
   * y los títulos de los ejes. Realiza la rotación/inversión de los slots según corresponda si 
   * es un gráfico de barras horizontales (ejes Y e X invertidos).
   * 
   * @param options Opciones del gráfico.
   * @param chartData Datos del gráfico para determinar el eje dual.
   * @returns Resultado del cálculo de layout.
   * @private
   */
  private configureCartesianLayout(options: ChartOptions, chartData: ChartData): LayoutResult {
    const cfg = this.config;
    const isBar = options.type === 'bar';
    const hasTitle = typeof options.title === 'string' && options.title.trim().length > 0;
    const hasLegend = !!(options.legends?.enabled && options.legends?.show);
    const hasNavigator = !!options.navigator?.show;
    const hasCategoryTitle = !options.xAxis?.disableAutoTitle;
    const hasValueTitle = typeof options.yAxis?.title === 'string' && options.yAxis.title.trim().length > 0;
    const hasDualAxis = !!chartData.seriesConfig.x2;

    // 1. Obtener la dimensión que consumirá cada ranura/slot activo
    const axisCfg = isBar ? cfg.bar : cfg.column;
    const titleSpace = hasTitle ? slotTotal(cfg.title) : 0;
    const legendSpace = hasLegend ? slotTotal(cfg.legend.bottom) : 0;
    const navSpace = hasNavigator ? slotTotal(cfg.navigator) : 0;
    const catTitleSpace = hasCategoryTitle ? slotTotal(axisCfg.categoryTitle) : 0;
    const valTitleSpace = hasValueTitle ? slotTotal(axisCfg.valueTitle) : 0;

    const grid = {
      top: cfg.grid.marginTop + titleSpace,
      bottom: cfg.grid.marginBottom,
      left: cfg.grid.marginLeft,
      right: cfg.grid.marginRight,
      outerBoundsMode: 'same' as const,
      outerBoundsContain: 'axisLabel' as const,
    };

    // 2. Calcular offsets y gaps de ejes
    const rotateLabels = options.xAxis?.rotateLabels ?? 0;
    const extraOffset = this.calculateExtraOffset(rotateLabels);
    const dualLevelOffset = this.calculateDualLevelOffset(hasDualAxis, axisCfg, extraOffset, chartData);

    const categoryNameGap = this.calculateCategoryNameGap(hasDualAxis, isBar, axisCfg, dualLevelOffset, chartData);
    const valueNameGap = isBar
      ? cfg.labels.baseHeight + axisCfg.valueTitle.marginBefore
      : axisCfg.valueTitle.marginBefore;

    // 3. Inversión de Slots en Barras (sin duplicar el espacio de etiquetas)
    if (isBar) {
      // Gráfico de Barras: El eje de categorías es vertical (LEFT) y el de valores horizontal (BOTTOM)
      grid.left += navSpace + catTitleSpace;
      grid.bottom += valTitleSpace + legendSpace;
    } else {
      // Gráfico Estándar: El eje de categorías es horizontal (BOTTOM) y el de valores vertical (LEFT)
      grid.bottom += catTitleSpace + navSpace + legendSpace;
      grid.left += valTitleSpace;
    }

    // 4. Computar posiciones específicas
    const titleTop = cfg.title.marginBefore;
    const titleLeft = 'center';

    const navigatorBottom = this.calculateNavigatorBottom(isBar, valTitleSpace, legendSpace);

    return {
      grid,
      title: {
        show: hasTitle,
        top: titleTop,
        left: titleLeft,
        maxWidth: cfg.title.maxTruncateWidth,
      },
      legend: {
        show: hasLegend,
        orient: 'horizontal',
        left: 'center',
        bottom: cfg.grid.marginBottom,
      },
      navigator: {
        show: hasNavigator,
        orient: isBar ? 'vertical' : 'horizontal',
        bottom: isBar ? undefined : navigatorBottom,
        left: isBar ? cfg.grid.marginLeft : undefined,
        axisIndex: hasDualAxis ? [0, 1] : 0,
      },
      axis: {
        categoryNameGap,
        valueNameGap,
        dualLevelOffset,
        categoryTitleMaxWidth: axisCfg.categoryTitle.maxTruncateWidth,
        valueTitleMaxWidth: axisCfg.valueTitle.maxTruncateWidth,
        firstLevelLabelMaxWidth: cfg.labels.maxWidth1stLevel,
        secondLevelLabelMaxWidth: cfg.labels.maxWidth2ndLevel,
      },
    };
  }

  /**
   * Calcula la posición inferior (coordenada 'bottom') para el navigator de datos (dataZoom).
   * 
   * @param isBar Indica si el gráfico es de tipo barra horizontal.
   * @param valTitleSpace Altura/ancho consumido por el título del eje de valores.
   * @param legendSpace Espacio consumido por la leyenda.
   * @returns Posición vertical final en píxeles.
   * @private
   */
  private calculateNavigatorBottom(isBar: boolean, valTitleSpace: number, legendSpace: number): number {
    if (isBar) {
      return this.config.grid.marginBottom + valTitleSpace + legendSpace;
    }
    return this.config.grid.marginBottom + legendSpace + this.config.navigator.marginBefore;
  }

  /**
   * Calcula de forma trigonométrica el espacio extra que requieren las etiquetas
   * cuando sufren una rotación (inclinación) para evitar que salgan de los bordes.
   * 
   * @param rotateLabels Grados de inclinación de la etiqueta.
   * @returns Margen adicional en píxeles.
   * @private
   */
  private calculateExtraOffset(rotateLabels: number): number {
    if (rotateLabels === 0) {
      return 0;
    }
    const angleRad = (Math.abs(rotateLabels) * Math.PI) / 180;
    return Math.max(0, Math.sin(angleRad) * this.config.labels.maxWidth1stLevel - this.config.labels.baseHeight);
  }

  /**
   * Computa el offset (desplazamiento) exacto requerido para posicionar el eje secundario
   * (segundo nivel) en gráficos con doble eje.
   * 
   * @param hasDualAxis Indica si el gráfico cuenta con un eje secundario activo.
   * @param axisCfg Configuración de diseño del eje correspondiente (column o bar).
   * @param extraOffset Margen extra calculado previamente por inclinación de etiquetas.
   * @param chartData Datos del gráfico para estimación en barras.
   * @returns Offset final del eje secundario en píxeles.
   * @private
   */
  private calculateDualLevelOffset(
    hasDualAxis: boolean,
    axisCfg: AxisLayoutConfig,
    extraOffset: number,
    chartData: ChartData
  ): number {
    if (!hasDualAxis) {
      return 0;
    }

    let baseOffset = axisCfg.dualLevel.baseOffset;
    if (baseOffset === 'auto') {
      const items1 = chartData.getItems(chartData.seriesConfig.x1);
      const maxChars = items1.length > 0
        ? Math.max(...items1.map(item => String(item).length))
        : 0;
      const gap = axisCfg.dualLevel.levelGap ?? 10;
      baseOffset = Math.max(30, Math.min(
        this.config.labels.maxWidth1stLevel,
        maxChars * 7 + gap
      ));
    }
    return baseOffset + Math.round(extraOffset);
  }

  /**
   * Estima el ancho en píxeles del primer nivel de etiquetas en gráficos de barra.
   * 
   * @private
   */
  private estimateFirstLevelWidth(chartData: ChartData): number {
    const items1 = chartData.getItems(chartData.seriesConfig.x1);
    const maxChars = items1.length > 0
      ? Math.max(...items1.map(item => String(item).length))
      : 0;
    return Math.max(30, Math.min(
      this.config.labels.maxWidth1stLevel,
      maxChars * 7 + 10
    ));
  }

  /**
   * Estima el ancho en píxeles del segundo nivel de etiquetas en gráficos de barra.
   * 
   * @private
   */
  private estimateSecondLevelWidth(chartData: ChartData): number {
    const x2 = chartData.seriesConfig.x2;
    if (!x2) {
      return 0;
    }
    const items2 = chartData.getItems(x2);
    const maxChars = items2.length > 0
      ? Math.max(...items2.map(item => String(item).length))
      : 0;
    return Math.max(30, Math.min(
      this.config.labels.maxWidth2ndLevel,
      maxChars * 7 + 10
    ));
  }

  /**
   * Calcula el nameGap para el título del eje de categorías. Toma en cuenta
   * si existe un doble eje para evitar que se dibuje encima de las etiquetas del segundo nivel.
   * 
   * @param hasDualAxis Indica si hay un eje secundario.
   * @param isBar Indica si es un gráfico de barras horizontales.
   * @param axisCfg Configuración de diseño del eje correspondiente.
   * @param dualLevelOffset Offset calculado previamente para el doble eje.
   * @param chartData Datos del gráfico para estimar anchos de etiquetas en barras.
   * @returns Gap final de separación en píxeles.
   * @private
   */
  private calculateCategoryNameGap(
    hasDualAxis: boolean,
    isBar: boolean,
    axisCfg: AxisLayoutConfig,
    dualLevelOffset: number,
    chartData: ChartData
  ): number {
    const marginBefore = axisCfg.categoryTitle.marginBefore;

    if (hasDualAxis) {
      const secondLevelHeight = isBar ? this.estimateSecondLevelWidth(chartData) : this.config.labels.baseHeight;
      return dualLevelOffset + secondLevelHeight + marginBefore;
    }

    const labelWidth = isBar
      ? this.estimateFirstLevelWidth(chartData)
      : this.config.labels.baseHeight;

    return labelWidth + marginBefore;
  }

  /**
   * Estrategia de cálculo de diseño para gráficos radiales (Pie Chart / Torta).
   * En este caso no se utiliza grilla/grid. El pie se posiciona ajustando dinámicamente
   * su coordenada de centro [X, Y] y su radio en función del espacio ocupado por el
   * título y la leyenda (que puede posicionarse en 'left', 'bottom' o 'right').
   * 
   * @param options Opciones del gráfico.
   * @returns Resultado del cálculo de layout para Pie.
   * @private
   */
  private configurePieLayout(options: ChartOptions): LayoutResult {
    const cfg = this.config;
    const hasTitle = typeof options.title === 'string' && options.title.trim().length > 0;
    const hasLegend = !!(options.legends?.enabled && options.legends?.show);
    const legendPosition = (options.legends?.position || 'bottom').toLowerCase();

    // 1. Calcular espacio libre consumido por cada lado
    // 1. Calcular porcentaje de ocupación vertical de título y leyenda
    const topPct = hasTitle ? 12 : 5;
    const bottomPct = (hasLegend && legendPosition === 'bottom') ? 15 : 5;

    // 2. Calcular el centro Y en el espacio disponible exacto entre arriba (título/borde) y abajo (leyenda/borde)
    const availableVertPct = 100 - topPct - bottomPct;
    const centerYPct = Math.round(topPct + (availableVertPct / 2));
    const centerXPct = 50;

    // 3. Radio dinámico optimizado
    const radiusPct = Math.min(65, Math.max(35, Math.round((availableVertPct / 2) * 0.82)));

    let orient: LayoutOrientation;
    let left: CoordinateValue;
    let right: CoordinateValue | undefined = undefined;
    let top: CoordinateValue | undefined = undefined;
    let bottom: CoordinateValue | undefined = undefined;

    if (legendPosition === 'left') {
      orient = 'vertical';
      left = cfg.grid.marginLeft;
      top = 'middle';
    } else if (legendPosition === 'right') {
      orient = 'vertical';
      left = 'auto';
      right = cfg.grid.marginRight;
      top = 'middle';
    } else {
      orient = 'horizontal';
      left = 'center';
      bottom = cfg.grid.marginBottom;
    }

    return {
      grid: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        outerBoundsMode: 'none' as const,
        outerBoundsContain: 'none' as const
      },
      title: {
        show: hasTitle,
        top: cfg.title.marginBefore,
        left: 'center',
        maxWidth: cfg.title.maxTruncateWidth,
      },
      legend: {
        show: hasLegend,
        orient,
        left,
        right,
        top,
        bottom,
      },
      navigator: {
        show: false,
        orient: 'horizontal',
        axisIndex: 0,
      },
      axis: {
        categoryNameGap: 0,
        valueNameGap: 0,
        dualLevelOffset: 0,
        categoryTitleMaxWidth: 0,
        valueTitleMaxWidth: 0,
        firstLevelLabelMaxWidth: 0,
        secondLevelLabelMaxWidth: 0,
      },
      pie: {
        center: [`${centerXPct}%`, `${centerYPct}%`],
        radius: `${radiusPct}%`,
      },
    };
  }

  /**
   * Mapea y aplica los valores calculados del LayoutResult sobre el objeto nativo 
   * de opciones de configuración de la librería ECharts.
   * 
   * @param libraryOptions Objeto de configuración a mutar de ECharts.
   * @param result Directrices del layout calculadas previamente.
   * @param options Configuración original del gráfico.
   * @private
   */
  private applyToEChartsOptions(libraryOptions: EChartsOption, result: LayoutResult, options: ChartOptions): void {
    const isPie = options.type === 'pie';
    this.applyGridOptions(libraryOptions, result, isPie);
    this.applyTitleOptions(libraryOptions, result);
    this.applyLegendOptions(libraryOptions, result);
    this.applyNavigatorOptions(libraryOptions, result);
  }

  /**
   * Aplica los márgenes de grid calculados al objeto de opciones de ECharts.
   * Si es gráfico de Pie, elimina la propiedad grid ya que no corresponde.
   * 
   * @private
   */
  private applyGridOptions(libraryOptions: EChartsOption, result: LayoutResult, isPie: boolean): void {
    if (isPie) {
      delete libraryOptions.grid;
      return;
    }

    if (Array.isArray(libraryOptions.grid)) {
      if (libraryOptions.grid.length === 0) {
        libraryOptions.grid.push({});
      }
      const g = libraryOptions.grid[0] as any;
      g.top = result.grid.top;
      g.bottom = result.grid.bottom;
      g.left = result.grid.left;
      g.right = result.grid.right;
      g.outerBoundsMode = result.grid.outerBoundsMode;
      g.outerBoundsContain = result.grid.outerBoundsContain;
      delete g.containLabel;
    } else {
      libraryOptions.grid = libraryOptions.grid || {};
      const g = libraryOptions.grid as any;
      g.top = result.grid.top;
      g.bottom = result.grid.bottom;
      g.left = result.grid.left;
      g.right = result.grid.right;
      g.outerBoundsMode = result.grid.outerBoundsMode;
      g.outerBoundsContain = result.grid.outerBoundsContain;
      delete g.containLabel;
    }
  }

  /**
   * Aplica el posicionamiento y formato del título al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyTitleOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.title.show) {
      libraryOptions.title = libraryOptions.title || {};
      const t = libraryOptions.title as any;
      t.show = true;
      t.top = result.title.top;
      t.left = result.title.left;
      t.textStyle = t.textStyle || {};
      t.textStyle.width = result.title.maxWidth;
      t.textStyle.overflow = 'truncate';
      t.textStyle.ellipsis = '...';
    } else if (libraryOptions.title) {
      (libraryOptions.title as any).show = false;
    }
  }

  /**
   * Aplica la orientación, visibilidad y posiciones exactas de la leyenda al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyLegendOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.legend.show) {
      libraryOptions.legend = libraryOptions.legend || {};
      const l = libraryOptions.legend as any;
      l.show = true;
      l.orient = result.legend.orient;
      l.left = result.legend.left;

      if (result.legend.right === undefined) {
        delete l.right;
      } else {
        l.right = result.legend.right;
      }

      if (result.legend.top === undefined) {
        delete l.top;
      } else {
        l.top = result.legend.top;
      }

      if (result.legend.bottom === undefined) {
        delete l.bottom;
      } else {
        l.bottom = result.legend.bottom;
      }
    } else if (libraryOptions.legend) {
      (libraryOptions.legend as any).show = false;
    }
  }

  /**
   * Configura y aplica los parámetros del navegador (dataZoom slider) al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyNavigatorOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.navigator.show) {
      libraryOptions.dataZoom = libraryOptions.dataZoom || [];
      const dataZoomArray = Array.isArray(libraryOptions.dataZoom)
        ? libraryOptions.dataZoom
        : [libraryOptions.dataZoom];

      const sliderIndex = dataZoomArray.findIndex(
        (dz: any) => dz.type === 'slider' || dz.type === undefined
      );

      const navConfig: any = {
        show: true,
        orient: result.navigator.orient,
      };

      if (result.navigator.orient === 'vertical') {
        navConfig.left = result.navigator.left;
        navConfig.yAxisIndex = result.navigator.axisIndex;
        delete navConfig.bottom;
      } else {
        navConfig.bottom = result.navigator.bottom;
        navConfig.xAxisIndex = result.navigator.axisIndex;
        delete navConfig.left;
      }

      if (sliderIndex >= 0) {
        dataZoomArray[sliderIndex] = { ...dataZoomArray[sliderIndex], ...navConfig };
      } else {
        dataZoomArray.push(navConfig);
      }

      libraryOptions.dataZoom = dataZoomArray;
    } else if (libraryOptions.dataZoom) {
      const dataZoomArray = Array.isArray(libraryOptions.dataZoom)
        ? libraryOptions.dataZoom
        : [libraryOptions.dataZoom];
      dataZoomArray.forEach((dz: any) => {
        dz.show = false;
      });
      libraryOptions.dataZoom = dataZoomArray;
    }
  }
}
