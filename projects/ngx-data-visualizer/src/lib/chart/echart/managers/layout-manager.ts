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

import {
  EChartsOption,
  GridComponentOption,
  LegendComponentOption,
  SliderDataZoomComponentOption,
  TitleComponentOption,
} from 'echarts';
import { ECharts } from '../../../types/constants';
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
 * Configuración de diseño específica para los ejes (categoría, valor y nivel dual).
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
      baseOffset: 0,
      levelGap: 10,
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
 * Función utilitaria pura para garantizar la conversión segura de una propiedad a Array.
 * 
 * @param item Elemento individual, array o undefined a normalizar.
 * @returns Array siempre inicializado.
 */
function ensureArray<T>(item: T | T[] | undefined): T[] {
  if (item === undefined || item === null) {
    return [];
  }
  return Array.isArray(item) ? item : [item];
}

/**
 * Estima la anchura horizontal en píxeles que ocupará un conjunto de etiquetas de texto.
 * 
 * @param items Lista de elementos a evaluar.
 * @param maxWidth Límite máximo permitido.
 * @returns Ancho estimado en píxeles.
 */
function estimateTextWidth(items: (string | number)[], maxWidth: number): number {
  const maxChars = items.length > 0
    ? Math.max(...items.map(item => String(item).length))
    : 0;
  return Math.max(30, Math.min(maxWidth, maxChars * 7 + 10));
}

/**
 * Contexto inmutable de entrada transmitido a las estrategias de maquetado cartesiano.
 */
export interface LayoutContext {
  options: ChartOptions;
  chartData: ChartData;
  config: LayoutConfig;
  axisCfg: AxisLayoutConfig;
  spaces: {
    titleSpace: number;
    legendSpace: number;
    navSpace: number;
    catTitleSpace: number;
    valTitleSpace: number;
  };
  dualLevelOffset: number;
  hasDualAxis: boolean;
  containerWidth?: number;
  rotateLabels: number;
}

/**
 * Contrato de la Estrategia de Maquetado Cartesiano por Tipo de Gráfico (Patrón Estrategia).
 */
export interface ICartesianLayoutStrategy {
  /**
   * Calcula el desplazamiento offset necesario para el eje secundario en agrupaciones de doble nivel.
   * 
   * @param ctx Contexto actual de diseño.
   * @param estimateSecondWidth Función opcional para estimar el ancho del 2do nivel.
   * @returns Offset en píxeles.
   */
  calculateDualLevelOffset(
    ctx: LayoutContext,
    estimateSecondWidth?: (chartData: ChartData) => number
  ): number;

  /**
   * Calcula las dimensiones del contenedor principal del gráfico (Grid).
   * 
   * @param ctx Contexto actual de diseño.
   * @param estimateFirstWidth Función opcional para estimar el ancho del 1er nivel.
   * @returns Objeto de márgenes top, bottom, left, right y restricciones de ECharts 6.
   */
  calculateGrid(
    ctx: LayoutContext,
    estimateFirstWidth?: (chartData: ChartData) => number
  ): {
    top: number;
    bottom: number;
    left: number;
    right: number;
    outerBoundsMode: 'same';
    outerBoundsContain: 'axisLabel';
  };

  /**
   * Calcula la posición y orientación del navegador de datos (dataZoom).
   * 
   * @param ctx Contexto actual de diseño.
   * @returns Configuración del componente navigator.
   */
  calculateNavigator(ctx: LayoutContext): {
    show: boolean;
    orient: LayoutOrientation;
    bottom?: number;
    left?: number;
    axisIndex: number | number[];
  };

  /**
   * Calcula la separación `nameGap` del título del eje de categorías respecto a su línea de eje.
   * 
   * @param ctx Contexto actual de diseño.
   * @param estimateFirstWidth Función opcional para estimar el ancho del 1er nivel.
   * @returns Distancia en píxeles para `nameGap`.
   */
  calculateCategoryNameGap(
    ctx: LayoutContext,
    estimateFirstWidth?: (chartData: ChartData) => number
  ): number;

  /**
   * Calcula la separación `nameGap` del título del eje de valores respecto a su línea de eje.
   * 
   * @param ctx Contexto actual de diseño.
   * @returns Distancia en píxeles para `nameGap`.
   */
  calculateValueNameGap(ctx: LayoutContext): number;

  /**
   * Calcula el ancho máximo permitido antes de truncar etiquetas del primer nivel.
   * 
   * @param ctx Contexto actual de diseño.
   * @param grid Dimensiones calculadas del grid.
   * @returns Ancho máximo en píxeles.
   */
  calculateFirstLevelLabelMaxWidth(
    ctx: LayoutContext,
    grid: { left: number; right: number }
  ): number;
}

/**
 * Estrategia de maquetado para gráficos de columnas verticales (y derivados: line, area).
 */
export class ColumnLayoutStrategy implements ICartesianLayoutStrategy {
  calculateDualLevelOffset(ctx: LayoutContext): number {
    if (!ctx.hasDualAxis) {
      return 0;
    }

    const items1 = ctx.chartData.getItems(ctx.chartData.seriesConfig.x1);
    const estimatedWidth = estimateTextWidth(items1, ctx.config.labels.maxWidth1stLevel);

    let baseOffset = ctx.axisCfg.dualLevel.baseOffset;
    if (baseOffset === 'auto') {
      const gap = ctx.axisCfg.dualLevel.levelGap ?? 10;
      baseOffset = Math.max(30, Math.min(
        ctx.config.labels.maxWidth1stLevel,
        estimatedWidth + gap
      ));
    }

    if (ctx.rotateLabels !== 0) {
      const angleRad = (Math.abs(ctx.rotateLabels) * Math.PI) / 180;
      const rotatedHeight = Math.sin(angleRad) * estimatedWidth;
      const gap = ctx.axisCfg.dualLevel.levelGap ?? 12;
      const rotatedOffset = Math.round(rotatedHeight + gap);

      return Math.max(baseOffset as number, rotatedOffset);
    }

    return baseOffset as number;
  }

  calculateGrid(ctx: LayoutContext) {
    const cfg = ctx.config;
    return {
      top: cfg.grid.marginTop + ctx.spaces.titleSpace,
      bottom: cfg.grid.marginBottom + ctx.spaces.catTitleSpace + ctx.spaces.navSpace + ctx.spaces.legendSpace,
      left: cfg.grid.marginLeft + ctx.spaces.valTitleSpace,
      right: cfg.grid.marginRight,
      outerBoundsMode: 'same' as const,
      outerBoundsContain: 'axisLabel' as const,
    };
  }

  calculateNavigator(ctx: LayoutContext) {
    const bottom = ctx.config.grid.marginBottom + ctx.spaces.legendSpace + ctx.config.navigator.marginBefore;
    return {
      show: !!ctx.options.navigator?.show,
      orient: 'horizontal' as const,
      bottom,
      left: undefined,
      axisIndex: ctx.hasDualAxis ? [0, 1] : 0,
    };
  }

  calculateCategoryNameGap(ctx: LayoutContext): number {
    const marginBefore = ctx.axisCfg.categoryTitle.marginBefore;
    if (ctx.hasDualAxis) {
      return ctx.dualLevelOffset + ctx.config.labels.baseHeight + marginBefore;
    }
    return ctx.config.labels.baseHeight + marginBefore;
  }

  calculateValueNameGap(ctx: LayoutContext): number {
    return ctx.axisCfg.valueTitle.marginBefore;
  }

  calculateFirstLevelLabelMaxWidth(
    ctx: LayoutContext,
    grid: { left: number; right: number }
  ): number {
    const cfg = ctx.config;
    const containerWidth = ctx.containerWidth;
    const rotateLabels = ctx.rotateLabels;
    const chartData = ctx.chartData;

    const availableContainerWidth =
      containerWidth && containerWidth > 0
        ? containerWidth
        : ECharts.DEFAULT_DIMENSIONS.WIDTH;
    const usefulGridWidth = Math.max(100, availableContainerWidth - (grid.left + grid.right));

    const x1 = chartData.seriesConfig.x1;
    const x2 = chartData.seriesConfig.x2;
    const items1 = x1 ? chartData.getItems(x1) : [];
    const items2 = x2 ? chartData.getItems(x2) : [];
    const categoryCount = x2 ? items1.length * items2.length : items1.length;

    if (categoryCount <= 0) {
      return cfg.labels.maxWidth1stLevel;
    }

    const cellWidth = usefulGridWidth / categoryCount;
    const padding = 4;
    const minWidth = 15;

    if (rotateLabels === 0) {
      return Math.max(
        minWidth,
        Math.min(cfg.labels.maxWidth1stLevel, Math.floor(cellWidth - padding))
      );
    }

    const angleRad = (Math.abs(rotateLabels) * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const projectedWidth = cosAngle > 0.1
      ? (cellWidth / cosAngle) - padding
      : cfg.labels.maxWidth1stLevel;

    return Math.max(
      minWidth,
      Math.min(cfg.labels.maxWidth1stLevel, Math.floor(projectedWidth))
    );
  }
}

/**
 * Estrategia de maquetado para gráficos de barras horizontales (Bar).
 * Calcula el offset de eje secundario en función del ancho real de las etiquetas del 2do nivel
 * para evitar colisiones horizontales con el 1er nivel.
 */
export class BarLayoutStrategy implements ICartesianLayoutStrategy {
  calculateDualLevelOffset(
    ctx: LayoutContext,
    estimateSecondWidth: (chartData: ChartData) => number
  ): number {
    if (!ctx.hasDualAxis) {
      return 0;
    }
    const secondLevelWidth = estimateSecondWidth(ctx.chartData);
    const gap = ctx.axisCfg.dualLevel.levelGap ?? 15;
    return Math.max(45, Math.round(secondLevelWidth + gap));
  }

  calculateGrid(
    ctx: LayoutContext
  ) {
    const cfg = ctx.config;

    // En barras, el título de categoría está rotado 90°. Su huella horizontal
    // es solo la altura de la fuente (size) + la separación con las etiquetas (marginBefore),
    // NO el slotTotal completo que asume un layout horizontal.
    const hasCatTitle = !ctx.options.xAxis?.disableAutoTitle;
    const rotatedTitleFootprint = hasCatTitle
      ? ctx.axisCfg.categoryTitle.size + ctx.axisCfg.categoryTitle.marginBefore
      : 0;

    return {
      top: cfg.grid.marginTop + ctx.spaces.titleSpace,
      bottom: cfg.grid.marginBottom + ctx.spaces.valTitleSpace + ctx.spaces.legendSpace,
      left: cfg.grid.marginLeft + ctx.spaces.navSpace + rotatedTitleFootprint,
      right: cfg.grid.marginRight,
      outerBoundsMode: 'same' as const,
      outerBoundsContain: 'axisLabel' as const,
    };
  }

  calculateNavigator(ctx: LayoutContext) {
    return {
      show: !!ctx.options.navigator?.show,
      orient: 'vertical' as const,
      bottom: undefined,
      left: ctx.config.grid.marginLeft,
      axisIndex: ctx.hasDualAxis ? [0, 1] : 0,
    };
  }

  calculateCategoryNameGap(
    ctx: LayoutContext,
    estimateFirstWidth?: (chartData: ChartData) => number
  ): number {
    const marginBefore = ctx.axisCfg.categoryTitle.marginBefore;
    const estFirst = estimateFirstWidth ? estimateFirstWidth(ctx.chartData) : 0;

    if (ctx.hasDualAxis) {
      return ctx.dualLevelOffset + estFirst + marginBefore;
    }
    return estFirst + marginBefore;
  }

  calculateValueNameGap(ctx: LayoutContext): number {
    return ctx.config.labels.baseHeight + ctx.axisCfg.valueTitle.marginBefore;
  }

  calculateFirstLevelLabelMaxWidth(ctx: LayoutContext): number {
    return ctx.config.labels.maxWidth1stLevel;
  }
}

/**
 * Registro y fábrica de estrategias de maquetado por tipo de gráfico.
 */
export class LayoutStrategyRegistry {
  private static readonly strategies: Record<string, ICartesianLayoutStrategy> = {
    bar: new BarLayoutStrategy(),
    column: new ColumnLayoutStrategy(),
    line: new ColumnLayoutStrategy(),
    area: new ColumnLayoutStrategy(),
  };

  public static getStrategy(type: string): ICartesianLayoutStrategy {
    return this.strategies[type] || this.strategies['column'];
  }
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
    chartData: ChartData,
    containerWidth?: number
  ): LayoutResult {
    const isPie = options.type === 'pie';
    const result = isPie
      ? this.configurePieLayout(options)
      : this.configureCartesianLayout(options, chartData, containerWidth);

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
   * @param containerWidth Ancho del contenedor del gráfico en píxeles.
   * @returns Resultado del cálculo de layout.
   * @private
   */
  private configureCartesianLayout(
    options: ChartOptions,
    chartData: ChartData,
    containerWidth?: number
  ): LayoutResult {
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

    const rotateLabels = options.xAxis?.rotateLabels ?? 0;
    const strategy = LayoutStrategyRegistry.getStrategy(options.type || 'column');

    const initialCtx: LayoutContext = {
      options,
      chartData,
      config: cfg,
      axisCfg,
      spaces: {
        titleSpace,
        legendSpace,
        navSpace,
        catTitleSpace,
        valTitleSpace,
      },
      dualLevelOffset: 0,
      hasDualAxis,
      containerWidth,
      rotateLabels,
    };

    const dualLevelOffset = strategy.calculateDualLevelOffset(
      initialCtx,
      (data) => this.estimateSecondLevelWidth(data)
    );

    const ctx: LayoutContext = {
      ...initialCtx,
      dualLevelOffset,
    };

    const grid = strategy.calculateGrid(ctx, (data) => this.estimateFirstLevelWidth(data));
    const navigator = strategy.calculateNavigator(ctx);

    const categoryNameGap = strategy.calculateCategoryNameGap(
      ctx,
      (data) => this.estimateFirstLevelWidth(data)
    );
    const valueNameGap = strategy.calculateValueNameGap(ctx);
    const firstLevelLabelMaxWidth = strategy.calculateFirstLevelLabelMaxWidth(ctx, grid);

    return {
      grid,
      title: {
        show: hasTitle,
        top: cfg.title.marginBefore,
        left: 'center',
        maxWidth: cfg.title.maxTruncateWidth,
      },
      legend: {
        show: hasLegend,
        orient: 'horizontal',
        left: 'center',
        bottom: cfg.grid.marginBottom,
      },
      navigator: {
        show: navigator.show,
        orient: navigator.orient,
        bottom: navigator.bottom,
        left: navigator.left,
        axisIndex: navigator.axisIndex,
      },
      axis: {
        categoryNameGap,
        valueNameGap,
        dualLevelOffset,
        categoryTitleMaxWidth: axisCfg.categoryTitle.maxTruncateWidth,
        valueTitleMaxWidth: axisCfg.valueTitle.maxTruncateWidth,
        firstLevelLabelMaxWidth,
        secondLevelLabelMaxWidth: cfg.labels.maxWidth2ndLevel,
      },
    };
  }





  /**
   * Estima el ancho en píxeles que ocupará horizontalmente un conjunto de etiquetas de texto.
   * Basado en la longitud máxima de caracteres (~7px/carácter) y acotado por el límite configurado.
   * 
   * @param items Lista de etiquetas a evaluar.
   * @param maxWidth Ancho máximo permitido por la configuración.
   * @returns Ancho estimado en píxeles.
   * @private
   */
  private estimateLabelWidth(items: (string | number)[], maxWidth: number): number {
    return estimateTextWidth(items, maxWidth);
  }

  /**
   * Estima el ancho en píxeles del primer nivel de etiquetas en gráficos de barra.
   * 
   * @param chartData Datos procesados del gráfico.
   * @returns Ancho estimado en píxeles.
   * @private
   */
  private estimateFirstLevelWidth(chartData: ChartData): number {
    const items1 = chartData.getItems(chartData.seriesConfig.x1);
    return this.estimateLabelWidth(items1, this.config.labels.maxWidth1stLevel);
  }

  /**
   * Estima el ancho en píxeles del segundo nivel de etiquetas en gráficos de barra.
   * 
   * @param chartData Datos procesados del gráfico.
   * @returns Ancho estimado en píxeles (o 0 si no hay eje dual).
   * @private
   */
  private estimateSecondLevelWidth(chartData: ChartData): number {
    const x2 = chartData.seriesConfig.x2;
    if (!x2) {
      return 0;
    }
    const items2 = chartData.getItems(x2);
    return this.estimateLabelWidth(items2, this.config.labels.maxWidth2ndLevel);
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

    // 1. Calcular porcentaje de ocupación vertical de título y leyenda
    const topPct = hasTitle ? 12 : 5;
    const bottomPct = (hasLegend && legendPosition === 'bottom') ? 15 : 5;

    // 2. Calcular el centro Y en el espacio disponible exacto entre arriba (título/borde) y abajo (leyenda/borde)
    const availableVertPct = 100 - topPct - bottomPct;
    const centerYPct = Math.round(topPct + (availableVertPct / 2));
    const centerXPct = 50;

    // 3. Radio dinámico optimizado
    const radiusFactor = cfg.pie.radiusFactor || 0.80;
    const radiusPct = Math.min(65, Math.max(35, Math.round((availableVertPct / 2) * radiusFactor)));

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

    const gridArray = ensureArray<GridComponentOption>(libraryOptions.grid as GridComponentOption | GridComponentOption[]);
    if (gridArray.length === 0) {
      gridArray.push({});
    }
    const g = gridArray[0];

    g.top = result.grid.top;
    g.bottom = result.grid.bottom;
    g.left = result.grid.left;
    g.right = result.grid.right;
    (g as Record<string, unknown>)['outerBoundsMode'] = result.grid.outerBoundsMode;
    (g as Record<string, unknown>)['outerBoundsContain'] = result.grid.outerBoundsContain;
    delete g.containLabel;

    libraryOptions.grid = Array.isArray(libraryOptions.grid) ? gridArray : g;
  }

  /**
   * Aplica el posicionamiento y formato del título al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyTitleOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.title.show) {
      const titleArray = ensureArray<TitleComponentOption>(libraryOptions.title as TitleComponentOption | TitleComponentOption[]);
      const t = titleArray[0] || {};
      t.show = true;
      t.top = result.title.top;
      t.left = result.title.left;
      t.textStyle = t.textStyle || {};
      t.textStyle.width = result.title.maxWidth;
      t.textStyle.overflow = 'truncate';
      t.textStyle.ellipsis = '...';
      libraryOptions.title = Array.isArray(libraryOptions.title) ? titleArray : t;
    } else if (libraryOptions.title) {
      const titleArray = ensureArray<TitleComponentOption>(libraryOptions.title as TitleComponentOption | TitleComponentOption[]);
      titleArray.forEach((t) => {
        t.show = false;
      });
    }
  }

  /**
   * Aplica la orientación, visibilidad y posiciones exactas de la leyenda al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyLegendOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.legend.show) {
      const legendArray = ensureArray<LegendComponentOption>(libraryOptions.legend as LegendComponentOption | LegendComponentOption[]);
      const l = legendArray[0] || {};
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

      libraryOptions.legend = Array.isArray(libraryOptions.legend) ? legendArray : l;
    } else if (libraryOptions.legend) {
      const legendArray = ensureArray<LegendComponentOption>(libraryOptions.legend as LegendComponentOption | LegendComponentOption[]);
      legendArray.forEach((l) => {
        l.show = false;
      });
    }
  }

  /**
   * Configura y aplica los parámetros del navegador (dataZoom slider) al objeto de opciones de ECharts.
   * 
   * @private
   */
  private applyNavigatorOptions(libraryOptions: EChartsOption, result: LayoutResult): void {
    if (result.navigator.show) {
      const dataZoomArray = ensureArray<SliderDataZoomComponentOption>(libraryOptions.dataZoom as SliderDataZoomComponentOption | SliderDataZoomComponentOption[]);

      const sliderIndex = dataZoomArray.findIndex(
        (dz) => dz.type === 'slider' || dz.type === undefined
      );

      const navConfig: SliderDataZoomComponentOption = {
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
      const dataZoomArray = ensureArray<SliderDataZoomComponentOption>(libraryOptions.dataZoom as SliderDataZoomComponentOption | SliderDataZoomComponentOption[]);
      dataZoomArray.forEach((dz) => {
        dz.show = false;
      });
    }
  }
}
