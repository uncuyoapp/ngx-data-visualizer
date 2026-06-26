/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from 'echarts';

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

      const title = this.formatTooltipTitle(params, options);
      return Array.isArray(params)
        ? this.formatMultipleParamsTooltip(params, title, options)
        : this.formatSingleParamTooltip(params, title);
    } catch (error) {
      console.error('Error al formatear el tooltip:', error);
      return '<div class="ec-tooltip-error">Error al mostrar el tooltip</div>';
    }
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
   * @returns HTML formateado del tooltip para un solo parámetro
   * @private
   */
  private formatSingleParamTooltip(
    param: TooltipParams,
    title: string
  ): string {
    try {
      if (!param) {
        throw new Error('Parámetro del tooltip no válido');
      }

      const value =
        param.value !== null && param.value !== undefined
          ? this.formatValue(param.value)
          : '-';

      return `
        <div class="ec-tooltip">
            <label class="title">${title}</label><br>
            ${param.marker}
            <label class="series-name">${param.seriesName}</label>:<label class="value">${value}</label>
        </div>
      `;
    } catch (error) {
      console.error('Error al formatear tooltip de parámetro único:', error);
      return '<div class="ec-tooltip-error">Error en el tooltip</div>';
    }
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
      const seriesArray = Array.isArray(options.series)
        ? options.series
        : (options.series ? [options.series] : []);

      // 1. Obtener la serie y pila sobre la que está posicionado el cursor (Foco)
      // Si el usuario tiene seleccionado el hover en una serie particular, priorizamos esa serie.
      // Si no, o si no hay valor para esa serie, tomamos la primera serie con valor válido.
      let focusParam: TooltipParams | undefined;

      if (this.hoveredSeriesIndex !== null && this.hoveredSeriesIndex !== undefined) {
        focusParam = params.find(p => p.seriesIndex === this.hoveredSeriesIndex);
      }

      if (!focusParam) {
        focusParam = params.find(p => p.value !== null && p.value !== undefined && p.value !== '') || params[0];
      }

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
        if (!isNaN(numericValue)) {
          totalSum += numericValue;
        }
      });

      // 5. Lectura de directivas visuales de configuración
      const tooltipConfig = options.tooltip as any;
      const showPercentage = !!tooltipConfig?.showPercentage;
      const showTotal = !!tooltipConfig?.showTotal;

      // 6. Construcción de los items HTML individuales del tooltip
      let list = sortedParams
        .map(
          (param) => {
            const seriesConfig = seriesArray[param.seriesIndex] as any;
            const isReferenceLine = this.isReferenceSeries(seriesConfig);
            const val = this.parseNumericValue(param.value);

            let valueText = '-';
            if (!isNaN(val)) {
              const valFormatted = this.formatValue(val);

              // Si se solicita porcentaje y no es una línea de referencia, calculamos su cuota sobre el total
              if (showPercentage && !isReferenceLine) {
                const percentage = totalSum !== 0 ? (val / totalSum) * 100 : 0;
                const percentageStr = (isNaN(percentage) || !isFinite(percentage))
                  ? '0.00'
                  : percentage.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                valueText = `${valFormatted} (${percentageStr}%)`;
              } else {
                valueText = valFormatted;
              }
            }

            return `${param.marker} <label class="series-name">${param.seriesName}</label>:<label class="value">${valueText}</label>`;
          }
        )
        .join('<br>');

      // 7. Anexar el bloque del total acumulado si corresponde
      if (showTotal) {
        list += `<hr><label class="summation">Total</label>:<label class="value">${this.formatValue(
          totalSum
        )}</label>`;
      }

      return `
        <div class="ec-tooltip">
            <label class="title">${title}</label><br>
            ${list}
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
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? NaN : parsed;
  }

  /**
   * Determina si una serie representa una línea de referencia global.
   * Las líneas de referencia se caracterizan por ser de tipo 'line' y no tener una pila asignada (stack).
   * @param seriesConfig - Configuración de la serie a evaluar
   * @returns True si es una línea de referencia, False en caso contrario.
   * @private
   */
  private isReferenceSeries(seriesConfig: any): boolean {
    return !!(seriesConfig && seriesConfig.type === 'line' && !seriesConfig.stack);
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

      if (isNaN(numericValue)) {
        throw new Error('Valor no numérico');
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
