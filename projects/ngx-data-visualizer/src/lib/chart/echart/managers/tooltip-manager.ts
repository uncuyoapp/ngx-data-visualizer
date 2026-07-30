/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from 'echarts';
import { ECharts } from '../../../types/constants';

/**
 * Interfaz para los parámetros del tooltip
 */
export interface TooltipParams {
  /** Nombre del punto de datos */
  name: string;
  /** Valor del punto de datos */
  value: number | string;
  /** Nombre de la serie */
  seriesName: string;
  /** Índice de la serie */
  seriesIndex: number;
  /** Índice del punto de datos */
  dataIndex: number;
  /** Marcador visual de la serie */
  marker: string;
  /** Propiedades adicionales */
  [key: string]: string | number;
}


/**
 * Clase administradora encargada de manejar y gestionar la lógica reactiva de los tooltips
 * (cuadros de información flotantes) en los gráficos generados con ECharts.
 * Proporciona el mecanismo principal para formatear y personalizar la visualización de datos numéricos
 * o textuales interactivamente al hacer hover sobre un elemento del gráfico, proveyendo sufijos y
 * cantidad variable de decimales.
 */
export class TooltipManager {
  private hoveredSeriesIndex: number | null = null;

  /**
   * Constructor de la clase
   * @param decimals - Número de decimales a mostrar en los valores
   * @param suffix - Sufijo a agregar a los valores (ej: %, $, etc.)
   */
  constructor(
    private decimals?: number | null,
    private suffix?: string | null
  ) { }

  /**
   * Actualiza el índice de la serie sobre la que está el mouse
   * @param index - Índice de la serie o null
   */
  setHoveredSeriesIndex(index: number | null): void {
    this.hoveredSeriesIndex = index;
  }

  /**
   * Obtiene el índice de la serie sobre la que está el mouse
   */
  getHoveredSeriesIndex(): number | null {
    return this.hoveredSeriesIndex;
  }

  /**
   * Actualiza el sufijo del tooltip
   * @param newSuffix - Nuevo sufijo a utilizar
   */
  updateSuffix(newSuffix: string | null): void {
    this.suffix = newSuffix;
  }

  /**
   * Actualiza la cantidad de decimales a mostrar en el tooltip
   * @param newDecimals - Nueva cantidad de decimales
   */
  updateDecimals(newDecimals: number | null): void {
    this.decimals = newDecimals;
  }

  /**
   * Formatea el tooltip según los parámetros recibidos
   * @param params - Parámetros del tooltip (puede ser uno o múltiples)
   * @param options - Opciones de configuración del gráfico
   * @returns HTML formateado del tooltip
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
   * Normaliza la propiedad series de EChartsOption a un array.
   * @param options Opciones de ECharts
   * @private
   */
  private getSeriesArray(options: EChartsOption): any[] {
    if (!options.series) {
      return [];
    }
    return Array.isArray(options.series) ? options.series : [options.series];
  }

  /**
   * Determina si las opciones corresponden a un gráfico de torta.
   * @param options Opciones de ECharts
   * @private
   */
  private isPieChart(options: EChartsOption): boolean {
    if ((options as any)?.type === 'pie') {
      return true;
    }
    const seriesArray = this.getSeriesArray(options);
    return seriesArray.some((s: any) => s?.type === 'pie');
  }

  /**
   * Determina si el tooltip está configurado como compartido.
   * @param options Opciones de ECharts
   * @private
   */
  private isTooltipShared(options: EChartsOption): boolean {
    const tooltipConfig = options.tooltip as any;
    return tooltipConfig?.trigger === 'axis' || !!tooltipConfig?.shared;
  }

  /**
   * Obtiene la serie principal de tipo pie.
   * @param options Opciones de ECharts
   * @private
   */
  private getPieSeries(options: EChartsOption): any {
    const seriesArray = this.getSeriesArray(options);
    if (seriesArray.length === 0) {
      return undefined;
    }
    return seriesArray.find((s: any) => s?.type === 'pie') ?? seriesArray[0];
  }

  /**
   * Formatea un valor porcentual como string en formato es-AR (ej: "12,50").
   * @param percentage - Valor numérico del porcentaje
   * @returns Porcentaje formateado con 2 decimales
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
   * Genera la estructura HTML para la fila del total acumulado.
   * @param totalSum - Suma total a mostrar
   * @returns String HTML del bloque total o cadena vacía si no aplica.
   * @private
   */
  private formatTotalHtml(totalSum: number): string {
    return `<hr><label class="summation">Total</label>:<label class="value">${this.formatValue(totalSum)}</label>`;
  }

  /**
   * Formatea un tooltip consolidado completo para todas las porciones de un gráfico de torta.
   * @param params Parámetros recibidos del tooltip
   * @param options Opciones de ECharts
   * @private
   */
  private formatPieSharedTooltip(
    params: TooltipParams | TooltipParams[],
    options: EChartsOption
  ): string {
    const pieSeries = this.getPieSeries(options);
    if (!pieSeries || !Array.isArray(pieSeries.data)) {
      const title = this.formatTooltipTitle(params, options);
      return Array.isArray(params)
        ? this.formatMultipleParamsTooltip(params, title, options)
        : this.formatSingleParamTooltip(params, title, options);
    }

    const seriesName = pieSeries.name || (Array.isArray(params) ? params[0]?.seriesName : params?.seriesName) || 'Torta';
    const tooltipConfig = options.tooltip as any;
    const showPercentage = !!tooltipConfig?.showPercentage;
    const showTotal = !!tooltipConfig?.showTotal;

    const pieData: any[] = pieSeries.data;
    const totalSum = this.calculatePieTotal(pieData);

    const palette = Array.isArray(options.color)
      ? (options.color as string[])
      : (ECharts.DEFAULT_PALETTE as string[]);

    const list = pieData
      .map((item, idx) => this.formatPieSliceItem(item, idx, totalSum, showPercentage, palette))
      .join('<br>');

    const totalHtml = showTotal ? this.formatTotalHtml(totalSum) : '';

    return `
      <div class="ec-tooltip">
          <label class="title">${seriesName}</label><br>
          ${list}
          ${totalHtml}
      </div>
    `;
  }

  /**
   * Calcula el total acumulado de las porciones de un gráfico de torta
   * @param pieData - Arreglo de elementos de la serie de torta
   * @returns Suma total numérica de los valores válidos
   * @private
   */
  private calculatePieTotal(pieData: any[]): number {
    let totalSum = 0;
    pieData.forEach(item => {
      const val = typeof item === 'object' && item !== null ? item.value : item;
      const num = this.parseNumericValue(val);
      if (!Number.isNaN(num)) {
        totalSum += num;
      }
    });
    return totalSum;
  }

  /**
   * Formatea un elemento individual (porción) en la lista del tooltip de torta
   * @param item - Datos de la porción
   * @param idx - Índice de la porción
   * @param totalSum - Suma total de las porciones
   * @param showPercentage - Indica si se debe mostrar el porcentaje
   * @param palette - Paleta de colores configurada
   * @returns Marcador HTML formateado de la porción
   * @private
   */
  private formatPieSliceItem(
    item: any,
    idx: number,
    totalSum: number,
    showPercentage: boolean,
    palette: string[]
  ): string {
    const sliceName = (typeof item === 'object' && item !== null && item.name != null) ? item.name : `Porción ${idx + 1}`;
    const rawVal = typeof item === 'object' && item !== null ? item.value : item;
    const val = this.parseNumericValue(rawVal);

    const valueText = this.formatPieSliceValueText(val, totalSum, showPercentage);

    const color = (typeof item === 'object' && item?.itemStyle?.color)
      ? item.itemStyle.color
      : palette[idx % palette.length];

    const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;

    return `${marker} <label class="series-name">${sliceName}</label>:<label class="value">${valueText}</label>`;
  }

  /**
   * Formatea el texto del valor de una porción de torta, incluyendo opcionalmente el porcentaje
   * @param val - Valor numérico de la porción
   * @param totalSum - Suma total de las porciones
   * @param showPercentage - Indica si se debe mostrar el porcentaje
   * @returns Cadena de texto formateada para el valor
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
   * Formatea el título del tooltip
   * @param params - Parámetros del tooltip
   * @param options - Opciones de configuración del gráfico
   * @returns Título formateado del tooltip
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
      const parentX = this.getParentCategoryValue(options.xAxis as any[], dataIndex, 'X');
      if (parentX !== null) {
        return `${parentX} - ${title}`;
      }

      const parentY = this.getParentCategoryValue(options.yAxis as any[], dataIndex, 'Y');
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
   * Resuelve el valor de la categoría padre (primer nivel) en una configuración de doble eje.
   * Realiza el cálculo del índice proporcional según la relación de tamaños entre el eje primario y secundario.
   * Asume una relación uniforme de múltiplo entero entre la cantidad de elementos del eje 0 y eje 1.
   * @param axes - Array de ejes (xAxis o yAxis)
   * @param dataIndex - Índice del punto de datos actual
   * @param axisName - Nombre identificatorio del eje ('X' o 'Y') para trazabilidad de errores
   * @returns El nombre de la categoría del primer nivel, o null si no existe una configuración de doble eje.
   * @private
   */
  private getParentCategoryValue(
    axes: any[] | undefined,
    dataIndex: number,
    axisName: 'X' | 'Y'
  ): string | null {
    if (!Array.isArray(axes) || axes.length <= 1) {
      return null;
    }

    const axis0 = axes[0];
    const axis1 = axes[1];
    if (!axis0?.data || !axis1?.data) {
      throw new Error(`Datos de eje ${axisName} no disponibles`);
    }

    const ratio = axis0.data.length / axis1.data.length;
    const parentIndex = Math.floor(dataIndex / ratio);
    return axis1.data[parentIndex] !== undefined ? String(axis1.data[parentIndex]) : null;
  }

  /**
   * Formatea el tooltip para un solo parámetro
   * @param param - Parámetro único del tooltip
   * @param title - Título del tooltip
   * @param options - Opciones de configuración del gráfico
   * @returns HTML formateado del tooltip para un solo parámetro
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

      const tooltipConfig = options?.tooltip as any;
      const showPercentage = !!tooltipConfig?.showPercentage;
      const showTotal = !!tooltipConfig?.showTotal;
      const isPie = options ? this.isPieChart(options) : false;

      const pieSeries = (isPie && options && (showPercentage || showTotal)) ? this.getPieSeries(options) : null;
      const totalSum = pieSeries ? this.calculatePieTotal(pieSeries?.data || []) : 0;

      const rawVal = this.parseNumericValue(param.value);
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
            <label class="title">${title}</label><br>
            ${param.marker}
            <label class="series-name">${param.seriesName}</label>:<label class="value">${valueText}</label>
            ${totalHtml}
            </div>
      `;
    } catch (error) {
      console.error('Error al formatear tooltip de parámetro único:', error);
      return '<div class="ec-tooltip-error">Error en el tooltip</div>';
    }
  }

  /**
   * Calcula el texto del porcentaje para una serie de tipo pie.
   * Utiliza la propiedad `percent` provista nativamente por ECharts si está presente en el parámetro;
   * de lo contrario, la calcula en base a la suma total de la serie.
   * @private
   */
  private calculatePercentageString(param: TooltipParams, rawVal: number, totalSum: number): string {
    let percentage: number;
    if (typeof param['percent'] === 'number') {
      percentage = param['percent'];
    } else if (totalSum !== 0) {
      percentage = (rawVal / totalSum) * 100;
    } else {
      percentage = 0;
    }

    return this.formatPercentageValue(percentage);
  }

  /**
   * Formatea el tooltip para múltiples parámetros
   * @param params - Array de parámetros del tooltip
   * @param title - Título del tooltip
   * @param options - Opciones de configuración del gráfico
   * @returns HTML formateado del tooltip para múltiples parámetros
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

      const focusSeriesConfig = seriesArray[focusParam.seriesIndex] as any;
      const activeStack = focusSeriesConfig?.stack;

      // 2. Filtrado Físico de Series (DEC-012)
      // Filtramos las series que se deben ocultar basándonos en el stack sobre el que está el cursor.
      const filteredParams = params.filter(param => {
        const seriesConfig = seriesArray[param.seriesIndex] as any;
        if (!seriesConfig) return true;

        // Regla de Excepción: Las líneas de referencia globales (líneas sin stack) se muestran siempre.
        if (this.isReferenceSeries(seriesConfig)) {
          return true;
        }

        // Regla de Stack: Si hay una pila activa, solo mostrar las series que pertenezcan a esa misma pila.
        if (activeStack && seriesConfig.stack !== activeStack) {
          return false;
        }

        return true;
      });

      // 3. Separación y ordenamiento de series (Líneas de referencia al final)
      const normalParams = filteredParams.filter(param => !this.isReferenceSeries(seriesArray[param.seriesIndex]));
      const referenceParams = filteredParams.filter(param => this.isReferenceSeries(seriesArray[param.seriesIndex]));
      const sortedParams = [...normalParams, ...referenceParams];

      // 4. Cálculo de la sumatoria total (DEC-006)
      // Calculamos la sumatoria para porcentajes y totales usando únicamente series normales visibles (no de referencia).
      let totalSum = 0;
      normalParams.forEach(param => {
        const numericValue = this.parseNumericValue(param.value);
        if (!Number.isNaN(numericValue)) {
          totalSum += numericValue;
        }
      });

      // 5. Lectura de directivas visuales de configuración
      const tooltipConfig = options.tooltip as any;
      const showPercentage = !!tooltipConfig?.showPercentage;
      const showTotal = !!tooltipConfig?.showTotal;
      const threshold = tooltipConfig?.columnThreshold ?? 10;
      const maxCols = tooltipConfig?.maxColumns ?? 3;

      // 6. Cálculo adaptativo del número de columnas (DEC-014)
      const totalItems = sortedParams.length;
      const columnsCount = Math.min(maxCols, Math.max(1, Math.ceil(totalItems / threshold)));
      const multicolClass = columnsCount > 1 ? 'ec-tooltip-multicol' : '';
      const colsClass = `ec-tooltip-cols-${columnsCount}`;

      // 7. Construcción de items HTML individuales
      const itemsHtml = sortedParams.map(param => {
        const seriesConfig = seriesArray[param.seriesIndex] as any;
        const isReferenceLine = this.isReferenceSeries(seriesConfig);
        const val = this.parseNumericValue(param.value);

        let valueText = '-';
        if (!Number.isNaN(val)) {
          const valFormatted = this.formatValue(val);

          // Si se solicita porcentaje y no es una línea de referencia, calculamos su cuota sobre el total
          if (showPercentage && !isReferenceLine) {
            const percentage = totalSum !== 0 ? (val / totalSum) * 100 : 0;
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
   * Convierte un valor de tipo texto o numérico a su equivalente numérico flotante.
   * Remueve caracteres que no sean dígitos, signos o puntos decimales si recibe un string formateado.
   * @param value - Valor de entrada
   * @returns El número flotante o NaN si la conversión no es posible.
   * @private
   */
  private parseNumericValue(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return Number.NaN;
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  /**
   * Determina si una serie representa una línea de referencia global o meta (goal).
   * Se evalúa únicamente mediante la propiedad explícita `isReferenceSeries`.
   * @param seriesConfig - Configuración de la serie a evaluar
   * @returns True si la serie tiene la propiedad isReferenceSeries en true, False en caso contrario.
   * @private
   */
  private isReferenceSeries(seriesConfig: any): boolean {
    return !!seriesConfig?.isReferenceSeries;
  }

  /**
   * Formatea un valor numérico según la configuración
   * @param value - Valor a formatear
   * @returns Valor formateado como string
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

