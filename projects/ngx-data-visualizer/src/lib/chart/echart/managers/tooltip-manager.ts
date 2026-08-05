import { EChartsOption } from 'echarts';
import { ECharts } from '../../../types/constants';

/**
 * @description Interfaz para definir la estructura de los parámetros del tooltip en ECharts.
 */
export interface TooltipParams {
  /** @description Nombre del punto de datos */
  name: string;
  /** @description Valor del punto de datos (escalar o diccionario estructurado) */
  value: number | string | Record<string, unknown>;
  /** @description Nombre de la serie */
  seriesName: string;
  /** @description Índice de la serie */
  seriesIndex: number;
  /** @description Índice del punto de datos */
  dataIndex: number;
  /** @description Marcador visual HTML de la serie */
  marker: string;
  /** @description Objeto de datos nativo o personalizado provisto por ECharts */
  data?: Record<string, unknown> | unknown[];
  /** @description Propiedades dinámicas adicionales provistas por ECharts */
  [key: string]: unknown;
}

/**
 * @description
 * Clase administradora encargada de manejar y gestionar la lógica reactiva de los tooltips
 * (cuadros de información flotantes) en los gráficos generados con ECharts.
 * Proporciona el mecanismo principal para formatear y personalizar la visualización de datos numéricos
 * o textuales interactivamente al hacer hover sobre un elemento del gráfico, proveyendo sufijos y
 * cantidad variable de decimales.
 */
export class TooltipManager {
  private hoveredSeriesIndex: number | null = null;

  /**
   * @description Crea una instancia de TooltipManager.
   * @param decimals - Número opcional de decimales a mostrar en los valores.
   * @param suffix - Sufijo opcional a agregar a los valores (ej: %, $, etc.).
   */
  constructor(
    private decimals?: number | null,
    private suffix?: string | null
  ) { }

  /**
   * @description Actualiza el índice de la serie sobre la que está posicionado el cursor.
   * @param index - Índice numérico de la serie o null cuando se quita el foco.
   * @public
   */
  setHoveredSeriesIndex(index: number | null): void {
    this.hoveredSeriesIndex = index;
  }

  /**
   * @description Obtiene el índice de la serie sobre la que está posicionado el cursor.
   * @returns El índice numérico de la serie seleccionada o null si no hay foco.
   * @public
   */
  getHoveredSeriesIndex(): number | null {
    return this.hoveredSeriesIndex;
  }

  /**
   * @description Actualiza el sufijo a utilizar en los valores del tooltip.
   * @param newSuffix - Nuevo sufijo a utilizar o null para removerlo.
   * @public
   */
  updateSuffix(newSuffix: string | null): void {
    this.suffix = newSuffix;
  }

  /**
   * @description Actualiza la cantidad de decimales a mostrar en los valores del tooltip.
   * @param newDecimals - Nueva cantidad de decimales o null para formato por defecto.
   * @public
   */
  updateDecimals(newDecimals: number | null): void {
    this.decimals = newDecimals;
  }

  /**
   * @description Formatea el contenido completo del tooltip según los parámetros y opciones recibidos.
   * @param params - Parámetros del punto de datos o arreglo de parámetros en gráficos múltiples/compartidos.
   * @param options - Opciones de configuración del gráfico ECharts.
   * @returns Cadena de texto HTML formateada lista para renderizar en el tooltip.
   * @public
   */
  formatTooltip(
    params: TooltipParams | TooltipParams[],
    options: EChartsOption
  ): string {
    try {
      if (!params) {
        throw new Error('Los parámetros del tooltip son requeridos');
      }

      if (!options) {
        throw new Error('Las opciones del gráfico son requeridas');
      }

      const isPie = this.isPieChart(options);
      const isShared = this.isTooltipShared(options);

      if (isPie && isShared) {
        return this.formatPieSharedTooltip(params, options);
      }

      const title = this.formatTooltipTitle(params, options);
      return Array.isArray(params)
        ? this.formatMultipleParamsTooltip(params, title, options)
        : this.formatSingleParamTooltip(params, title, options);
    } catch (error) {
      console.error('Error al formatear el tooltip:', error);
      return '<div class="ec-tooltip-error">Error al mostrar el tooltip</div>';
    }
  }

  /**
   * @description Normaliza la propiedad series de EChartsOption a un arreglo de objetos.
   * @param options - Opciones de configuración de ECharts.
   * @returns Arreglo de series normalizadas como objetos.
   * @private
   */
  private getSeriesArray(options: EChartsOption): Record<string, unknown>[] {
    if (!options.series) {
      return [];
    }
    return Array.isArray(options.series)
      ? (options.series as Record<string, unknown>[])
      : [options.series as Record<string, unknown>];
  }

  /**
   * @description Determina si las opciones de ECharts corresponden a un gráfico de torta (pie).
   * @param options - Opciones de configuración de ECharts.
   * @returns True si el gráfico es de tipo torta, False en caso contrario.
   * @private
   */
  private isPieChart(options: EChartsOption): boolean {
    if ((options as Record<string, unknown>)?.['type'] === 'pie') {
      return true;
    }
    const seriesArray = this.getSeriesArray(options);
    return seriesArray.some((s) => s?.['type'] === 'pie');
  }

  /**
   * @description Determina si el tooltip está configurado como compartido (trigger axis o shared).
   * @param options - Opciones de configuración de ECharts.
   * @returns True si el tooltip es compartido, False en caso contrario.
   * @private
   */
  private isTooltipShared(options: EChartsOption): boolean {
    const tooltipConfig = options.tooltip as Record<string, unknown> | undefined;
    return tooltipConfig?.['trigger'] === 'axis' || !!tooltipConfig?.['shared'];
  }

  /**
   * @description Obtiene la serie principal de tipo torta (pie) a partir de las opciones.
   * @param options - Opciones de configuración de ECharts.
   * @returns Objeto de configuración de la serie de tipo pie o undefined.
   * @private
   */
  private getPieSeries(options: EChartsOption): Record<string, unknown> | undefined {
    const seriesArray = this.getSeriesArray(options);
    if (seriesArray.length === 0) {
      return undefined;
    }
    return seriesArray.find((s) => s?.['type'] === 'pie') ?? seriesArray[0];
  }

  /**
   * @description Formatea un valor porcentual numérico a formato de texto es-AR (ej: "12,50").
   * @param percentage - Valor numérico del porcentaje.
   * @returns Porcentaje formateado con 2 decimales.
   * @private
   */
  private formatPercentageValue(percentage: number): string {
    if (Number.isNaN(percentage) || !Number.isFinite(percentage)) {
      return '0,00';
    }
    return percentage.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * @description Genera la estructura HTML para la fila del total acumulado en el pie del tooltip.
   * @param totalSum - Suma total acumulada a mostrar.
   * @returns Cadena HTML del bloque total o cadena vacía si no aplica.
   * @private
   */
  private formatTotalHtml(totalSum: number): string {
    return `
      <div class="ec-tooltip-footer">
        <hr>
        <div class="total-row">
          <span class="summation">Total</span>:
          <span class="value">${this.formatValue(totalSum)}</span>
        </div>
      </div>
    `;
  }

  /**
   * @description Formatea un tooltip consolidado completo para todas las porciones de un gráfico de torta.
   * @param params - Parámetros recibidos del tooltip.
   * @param options - Opciones de configuración de ECharts.
   * @returns Cadena HTML del tooltip completo del gráfico de torta.
   * @private
   */
  private formatPieSharedTooltip(
    params: TooltipParams | TooltipParams[],
    options: EChartsOption
  ): string {
    const pieSeries = this.getPieSeries(options);
    const pieData = pieSeries?.['data'];
    if (!pieSeries || !Array.isArray(pieData)) {
      const title = this.formatTooltipTitle(params, options);
      return Array.isArray(params)
        ? this.formatMultipleParamsTooltip(params, title, options)
        : this.formatSingleParamTooltip(params, title, options);
    }

    const seriesName = (pieSeries['name'] as string) || (Array.isArray(params) ? params[0]?.seriesName : params?.seriesName) || 'Torta';
    const tooltipConfig = options.tooltip as Record<string, unknown> | undefined;
    const showPercentage = !!tooltipConfig?.['showPercentage'];
    const showTotal = !!tooltipConfig?.['showTotal'];

    const totalSum = this.calculatePieTotal(pieData as unknown[]);

    const palette = Array.isArray(options.color)
      ? (options.color as string[])
      : (ECharts.DEFAULT_PALETTE as string[]);

    const itemsHtml = (pieData as unknown[])
      .map((item, idx) => this.formatPieSliceItem(item, idx, totalSum, showPercentage, palette))
      .join('');

    const totalHtml = showTotal ? this.formatTotalHtml(totalSum) : '';

    return `
      <div class="ec-tooltip">
        <div class="ec-tooltip-header">
          <span class="title">${seriesName}</span>
        </div>
        <div class="ec-tooltip-body">
          ${itemsHtml}
        </div>
        ${totalHtml}
      </div>
    `;
  }

  /**
   * @description Calcula el total acumulado numérico de las porciones de un gráfico de torta.
   * @param pieData - Arreglo de elementos de datos de la serie de torta.
   * @returns Suma total numérica de los valores válidos.
   * @private
   */
  private calculatePieTotal(pieData: unknown[]): number {
    let totalSum = 0;
    pieData.forEach(item => {
      const val = typeof item === 'object' && item !== null ? (item as Record<string, unknown>)['value'] : item;
      const num = this.parseNumericValue(val);
      if (!Number.isNaN(num)) {
        totalSum += num;
      }
    });
    return totalSum;
  }

  /**
   * @description Formatea un elemento individual (porción) en la lista del tooltip de torta.
   * @param item - Datos de la porción.
   * @param idx - Índice de la porción.
   * @param totalSum - Suma total de las porciones.
   * @param showPercentage - Indica si se debe calcular y mostrar el porcentaje.
   * @param palette - Paleta de colores configurada para las series.
   * @returns Estructura HTML de la porción formateada.
   * @private
   */
  private formatPieSliceItem(
    item: unknown,
    idx: number,
    totalSum: number,
    showPercentage: boolean,
    palette: string[]
  ): string {
    const itemObj = (typeof item === 'object' && item !== null) ? (item as Record<string, unknown>) : null;
    const rawName = itemObj?.['name'];
    const sliceName =
      typeof rawName === 'string' || typeof rawName === 'number'
        ? String(rawName)
        : `Porción ${idx + 1}`;
    const rawVal = itemObj ? itemObj['value'] : item;
    const val = this.parseNumericValue(rawVal);

    const valueText = this.formatPieSliceValueText(val, totalSum, showPercentage);

    const itemStyle = itemObj?.['itemStyle'] as Record<string, unknown> | undefined;
    const rawColor = itemStyle?.['color'];
    const color = typeof rawColor === 'string' ? rawColor : palette[idx % palette.length];

    const marker = `<span class="marker" style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;

    return `
      <div class="ec-tooltip-item">
        ${marker}
        <span class="series-name">${sliceName}:</span>
        <span class="value">${valueText}</span>
      </div>
    `;
  }

  /**
   * @description Formatea el texto del valor de una porción de torta, incluyendo opcionalmente el porcentaje.
   * @param val - Valor numérico de la porción.
   * @param totalSum - Suma total acumulada de las porciones.
   * @param showPercentage - Indica si se debe incluir el porcentaje.
   * @returns Cadena de texto formateada para el valor de la porción.
   * @private
   */
  private formatPieSliceValueText(val: number, totalSum: number, showPercentage: boolean): string {
    if (Number.isNaN(val)) {
      return '-';
    }

    const valFormatted = this.formatValue(val);
    if (!showPercentage) {
      return valFormatted;
    }

    const percentage = totalSum !== 0 ? (val / totalSum) * 100 : 0;
    const percentageStr = this.formatPercentageValue(percentage);

    return `${valFormatted} (${percentageStr}%)`;
  }

  /**
   * @description Formatea el título o encabezado principal del tooltip.
   * @param params - Parámetro único o arreglo de parámetros del tooltip.
   * @param options - Opciones de configuración de ECharts.
   * @returns Título formateado del tooltip.
   * @private
   */
  private formatTooltipTitle(
    params: TooltipParams | TooltipParams[],
    options: EChartsOption
  ): string {
    try {
      const title = Array.isArray(params) ? params[0].name : params.name;
      const dataIndex = Array.isArray(params) ? params[0].dataIndex : params.dataIndex;

      // Intentar obtener la categoría padre si existe una jerarquía de doble eje (en X o Y)
      const parentX = this.getParentCategoryValue(options.xAxis as Record<string, unknown>[], dataIndex, 'X');
      if (parentX !== null) {
        return `${parentX} - ${title}`;
      }

      const parentY = this.getParentCategoryValue(options.yAxis as Record<string, unknown>[], dataIndex, 'Y');
      if (parentY !== null) {
        return `${parentY} - ${title}`;
      }

      return title;
    } catch (error) {
      console.error('Error al formatear el título del tooltip:', error);
      return 'Error en el título';
    }
  }

  /**
   * @description Resuelve el valor de la categoría padre (primer nivel) en una configuración de doble eje.
   * Realiza el cálculo del índice proporcional según la relación de tamaños entre el eje primario y secundario.
   * Asume una relación uniforme de múltiplo entero entre la cantidad de elementos del eje 0 y eje 1.
   * @param axes - Arreglo de ejes (xAxis o yAxis).
   * @param dataIndex - Índice del punto de datos actual.
   * @param axisName - Nombre identificatorio del eje ('X' o 'Y') para trazabilidad de errores.
   * @returns El nombre de la categoría del primer nivel, o null si no existe una configuración de doble eje.
   * @private
   */
  private getParentCategoryValue(
    axes: Record<string, unknown>[] | undefined,
    dataIndex: number,
    axisName: 'X' | 'Y'
  ): string | null {
    if (!Array.isArray(axes) || axes.length <= 1) {
      return null;
    }

    const axis0 = axes[0];
    const axis1 = axes[1];
    const axis0Data = axis0?.['data'] as unknown[] | undefined;
    const axis1Data = axis1?.['data'] as unknown[] | undefined;
    if (!axis0Data || !axis1Data) {
      throw new Error(`Datos de eje ${axisName} no disponibles`);
    }

    const ratio = axis0Data.length / axis1Data.length;
    const parentIndex = Math.floor(dataIndex / ratio);
    return axis1Data[parentIndex] !== undefined ? String(axis1Data[parentIndex]) : null;
  }

  /**
   * @description Formatea la estructura HTML del tooltip para un único punto de datos.
   * @param param - Parámetro único del punto de datos.
   * @param title - Título formateado a mostrar en el encabezado.
   * @param options - Opciones de configuración de ECharts.
   * @returns Estructura HTML formateada del tooltip.
   * @private
   */
  private formatSingleParamTooltip(
    param: TooltipParams,
    title: string,
    options?: EChartsOption
  ): string {
    try {
      if (!param) {
        throw new Error('Parámetro del tooltip no válido');
      }

      const tooltipConfig = options?.tooltip as Record<string, unknown> | undefined;
      const showPercentage = !!tooltipConfig?.['showPercentage'];
      const showTotal = !!tooltipConfig?.['showTotal'];
      const isPie = options ? this.isPieChart(options) : false;

      const pieSeries = (isPie && options && (showPercentage || showTotal)) ? this.getPieSeries(options) : null;
      const pieData = pieSeries?.['data'];
      const totalSum = pieData && Array.isArray(pieData) ? this.calculatePieTotal(pieData as unknown[]) : 0;

      const rawVal = this.parseNumericValue(param.data ?? param.value);
      let valueText = '-';

      if (!Number.isNaN(rawVal)) {
        const valFormatted = this.formatValue(rawVal);
        if (showPercentage && isPie && options) {
          const percentageStr = this.calculatePercentageString(param, rawVal, totalSum);
          valueText = `${valFormatted} (${percentageStr}%)`;
        } else {
          valueText = valFormatted;
        }
      }

      const totalHtml = (showTotal && isPie && options) ? this.formatTotalHtml(totalSum) : '';

      return `
        <div class="ec-tooltip">
          <div class="ec-tooltip-header">
            <span class="title">${title}</span>
          </div>
          <div class="ec-tooltip-body">
            <div class="ec-tooltip-item">
              <span class="marker">${param.marker}</span>
              <span class="series-name">${param.seriesName}:</span>
              <span class="value">${valueText}</span>
            </div>
          </div>
          ${totalHtml}
        </div>
      `;
    } catch (error) {
      console.error('Error al formatear tooltip de parámetro único:', error);
      return '<div class="ec-tooltip-error">Error en el tooltip</div>';
    }
  }

  /**
   * @description Calcula el texto del porcentaje para una serie de tipo torta.
   * Utiliza la propiedad `percent` provista nativamente por ECharts si está presente en el parámetro;
   * de lo contrario, la calcula en base a la suma total de la serie.
   * @param param - Parámetro del tooltip a evaluar.
   * @param rawVal - Valor numérico crudo del punto de datos.
   * @param totalSum - Suma total acumulada.
   * @returns Cadena formateada del porcentaje.
   * @private
   */
  private calculatePercentageString(param: TooltipParams, rawVal: number, totalSum: number): string {
    let percentage: number;
    if (typeof param['percent'] === 'number') {
      percentage = param['percent'] as number;
    } else if (totalSum !== 0) {
      percentage = (rawVal / totalSum) * 100;
    } else {
      percentage = 0;
    }

    return this.formatPercentageValue(percentage);
  }

  /**
   * @description Formatea la estructura HTML del tooltip para múltiples puntos de datos (gráficos apilados o compartidos).
   * @param params - Arreglo de parámetros de los puntos de datos del tooltip.
   * @param title - Título formateado a mostrar en el encabezado.
   * @param options - Opciones de configuración de ECharts.
   * @returns Estructura HTML formateada del tooltip múltiple.
   * @private
   */
  private formatMultipleParamsTooltip(
    params: TooltipParams[],
    title: string,
    options: EChartsOption
  ): string {
    try {
      if (!Array.isArray(params) || params.length === 0) {
        throw new Error('Parámetros del tooltip no válidos');
      }

      // Resolver de forma segura las series del gráfico actuales
      const seriesArray = this.getSeriesArray(options);

      // 1. Obtener la serie y pila sobre la que está posicionado el cursor (Foco)
      // Si el usuario tiene seleccionado el hover en una serie particular, priorizamos esa serie.
      // Si no, o si no hay valor para esa serie, tomamos la primera serie con valor válido.
      let focusParam: TooltipParams | undefined;

      if (this.hoveredSeriesIndex !== null && this.hoveredSeriesIndex !== undefined) {
        focusParam = params.find(p => p.seriesIndex === this.hoveredSeriesIndex);
      }

      focusParam ??= params.find(p => p.value !== null && p.value !== undefined && p.value !== '') ?? params[0];

      const focusSeriesConfig = seriesArray[focusParam.seriesIndex];
      const activeStack = focusSeriesConfig?.['stack'];

      // 2. Filtrado Físico de Series 
      // Filtramos las series que se deben ocultar basándonos en el stack sobre el que está el cursor.
      const filteredParams = params.filter(param => {
        const seriesConfig = seriesArray[param.seriesIndex];
        if (!seriesConfig) return true;

        // Regla de Excepción: Las líneas de referencia globales (líneas sin stack) se muestran siempre.
        if (this.isReferenceSeries(seriesConfig)) {
          return true;
        }

        // Regla de Stack: Si hay una pila activa, solo mostrar las series que pertenezcan a esa misma pila.
        if (activeStack && seriesConfig['stack'] !== activeStack) {
          return false;
        }

        return true;
      });

      // 3. Separación y ordenamiento de series (Líneas de referencia al final)
      const normalParams = filteredParams.filter(param => !this.isReferenceSeries(seriesArray[param.seriesIndex]));
      const referenceParams = filteredParams.filter(param => this.isReferenceSeries(seriesArray[param.seriesIndex]));
      const sortedParams = [...normalParams, ...referenceParams];

      // 4. Cálculo de la sumatoria total 
      // Calculamos la sumatoria para porcentajes y totales usando únicamente series normales visibles (no de referencia).
      let totalSum = 0;
      normalParams.forEach(param => {
        const numericValue = this.parseNumericValue(param.data ?? param.value);
        if (!Number.isNaN(numericValue)) {
          totalSum += numericValue;
        }
      });

      // 5. Lectura de directivas visuales de configuración
      const tooltipConfig = options.tooltip as Record<string, unknown> | undefined;
      const showPercentage = !!tooltipConfig?.['showPercentage'];
      const showTotal = !!tooltipConfig?.['showTotal'];
      const threshold = (tooltipConfig?.['columnThreshold'] as number | undefined) ?? 10;
      const maxCols = (tooltipConfig?.['maxColumns'] as number | undefined) ?? 3;

      // 6. Cálculo adaptativo del número de columnas 
      const totalItems = sortedParams.length;
      const columnsCount = Math.min(maxCols, Math.max(1, Math.ceil(totalItems / threshold)));
      const multicolClass = columnsCount > 1 ? 'ec-tooltip-multicol' : '';
      const colsClass = `ec-tooltip-cols-${columnsCount}`;

      // 7. Construcción de items HTML individuales
      const itemsHtml = sortedParams.map(param => {
        const seriesConfig = seriesArray[param.seriesIndex];
        const isReferenceLine = this.isReferenceSeries(seriesConfig);
        const val = this.parseNumericValue(param.data ?? param.value);

        let valueText = '-';
        if (!Number.isNaN(val)) {
          const valFormatted = this.formatValue(val);

          // Si se solicita porcentaje y no es una línea de referencia, calculamos su cuota sobre el total
          if (showPercentage && !isReferenceLine) {
            let percentage: number;
            const paramDataObj = param.data as Record<string, unknown> | undefined;
            if (paramDataObj && typeof paramDataObj === 'object' && 'value' in paramDataObj && typeof paramDataObj['value'] === 'number') {
              percentage = paramDataObj['value'] as number;
            } else {
              percentage = totalSum !== 0 ? (val / totalSum) * 100 : 0;
            }
            const percentageStr = this.formatPercentageValue(percentage);
            valueText = `${valFormatted} (${percentageStr}%)`;
          } else {
            valueText = valFormatted;
          }
        }

        return `
          <div class="ec-tooltip-item">
            <span class="marker">${param.marker}</span>
            <span class="series-name">${param.seriesName}:</span>
            <span class="value">${valueText}</span>
          </div>
        `;
      }).join('');

      // 8. Footer del Total (Alineado a la derecha ocupando 100% del ancho)
      let totalHtml = '';
      if (showTotal) {
        totalHtml = `
          <div class="ec-tooltip-footer">
            <hr>
            <div class="total-row">
              <span class="summation">Total</span>:
              <span class="value">${this.formatValue(totalSum)}</span>
            </div>
          </div>
        `;
      }

      // 9. Renderizado Final Autocontenido
      return `
        <div class="ec-tooltip ${multicolClass} ${colsClass}" style="--tooltip-cols: ${columnsCount};">
          <div class="ec-tooltip-header">
            <span class="title">${title}</span>
          </div>
          <div class="ec-tooltip-body">
            ${itemsHtml}
          </div>
          ${totalHtml}
        </div>
      `;
    } catch (error) {
      console.error('Error al formatear tooltip múltiple:', error);
      return '<div class="ec-tooltip-error">Error en el tooltip</div>';
    }
  }

  /**
   * @description Extrae y convierte el valor numérico desde un objeto de datos (revisando `nominalValue` o `value`).
   * @param obj - Objeto de entrada de datos.
   * @returns El valor numérico extraído o NaN si no es convertible.
   * @private
   */
  private parseObjectValue(obj: Record<string, unknown>): number {
    const rawVal = obj['nominalValue'] ?? obj['value'];
    if (typeof rawVal === 'number') return rawVal;
    if (typeof rawVal === 'string') {
      return Number.parseFloat(rawVal.replace(/[^\d.-]/g, ''));
    }
    if (typeof rawVal === 'object' && rawVal !== null && rawVal !== obj) {
      return this.parseObjectValue(rawVal as Record<string, unknown>);
    }
    return Number.NaN;
  }

  /**
   * @description Convierte un valor de tipo texto, numérico u objeto de datos a su equivalente numérico flotante.
   * Si recibe un objeto, extrae `nominalValue` o `value`.
   * Remueve caracteres no numéricos excepto signos y puntos decimales si recibe un string formateado.
   * @param value - Valor de entrada a convertir.
   * @returns El número flotante resultante o NaN si la conversión no es posible.
   * @private
   */
  private parseNumericValue(value: unknown): number {
    if (value == null) return Number.NaN;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      return Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    }
    if (typeof value === 'object') {
      return this.parseObjectValue(value as Record<string, unknown>);
    }

    return Number.NaN;
  }

  /**
   * @description Determina si una serie representa una línea de referencia global o meta (goal).
   * Se evalúa únicamente mediante la propiedad explícita `isReferenceSeries`.
   * @param seriesConfig - Objeto de configuración de la serie a evaluar.
   * @returns True si la serie representa una línea de referencia, False en caso contrario.
   * @private
   */
  private isReferenceSeries(seriesConfig?: Record<string, unknown>): boolean {
    return !!seriesConfig?.['isReferenceSeries'];
  }

  /**
   * @description Formatea un valor numérico o texto según la configuración de decimales y sufijos del manager.
   * @param value - Valor numérico o texto a formatear.
   * @returns Valor formateado como cadena de texto en formato es-AR.
   * @public
   */
  public formatValue(value: number | string): string {
    try {
      if (value === null || value === undefined) {
        return '-';
      }

      const numericValue = this.parseNumericValue(value);

      if (Number.isNaN(numericValue)) {
        throw new TypeError('Valor no numérico');
      }

      const returnValue =
        this.decimals !== null && this.decimals !== undefined
          ? numericValue.toLocaleString('es-AR', {
            minimumFractionDigits: this.decimals,
            maximumFractionDigits: this.decimals,
            useGrouping: true,
          })
          : numericValue.toLocaleString('es-AR', {
            useGrouping: true,
          });
      return this.suffix ? returnValue + ' ' + this.suffix : returnValue;
    } catch (error) {
      console.error('Error al formatear valor:', error);
      return 'Error';
    }
  }
}
