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
  /** Índice del punto de datos */
  dataIndex: number;
  /** Marcador visual de la serie */
  marker: string;
  /** Propiedades adicionales */
  [key: string]: string | number;
}

/**
 * Interfaz para la configuración del tooltip
 */
interface TooltipConfig {
  /** Indica si se debe mostrar el total en el tooltip */
  showTotal?: boolean;
}

/**
 * Clase encargada de manejar la lógica de los tooltips en los gráficos ECharts.
 * Proporciona funcionalidades para formatear y personalizar la visualización
 * de información al hacer hover sobre los elementos del gráfico.
 */
export class TooltipManager {
  /**
   * Constructor de la clase
   * @param decimals - Número de decimales a mostrar en los valores
   * @param suffix - Sufijo a agregar a los valores (ej: %, $, etc.)
   */
  constructor(
    private decimals?: number | null,
    private suffix?: string | null
  ) {}

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
      let title = Array.isArray(params) ? params[0].name : params.name;
      const dataIndex = Array.isArray(params)
        ? params[0].dataIndex
        : params.dataIndex;

      if (Array.isArray(options.xAxis) && options.xAxis.length > 1) {
        const xAxis1 = options.xAxis[1] as any;
        const xAxis0 = options.xAxis[0] as any;
        if (!xAxis1?.data || !xAxis0?.data) {
          throw new Error('Datos de eje X no disponibles');
        }
        title = `${
          xAxis1.data[
            Math.floor(dataIndex / (xAxis0.data.length / xAxis1.data.length))
          ]
        } - ${title}`;
      } else if (Array.isArray(options.yAxis) && options.yAxis.length > 1) {
        const yAxis1 = options.yAxis[1] as any;
        const yAxis0 = options.yAxis[0] as any;
        if (!yAxis1?.data || !yAxis0?.data) {
          throw new Error('Datos de eje Y no disponibles');
        }
        title = `${
          yAxis1.data[
            Math.floor(dataIndex / (yAxis0.data.length / yAxis1.data.length))
          ]
        } - ${title}`;
      }

      return title;
    } catch (error) {
      console.error('Error al formatear el título del tooltip:', error);
      return 'Error en el título';
    }
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

      // Calcular el total primero, antes de formatear los valores
      let total = 0;
      const tooltipConfig = options.tooltip as TooltipConfig;
      if (tooltipConfig?.showTotal) {
        total = params.reduce((sum, param) => {
          // Convertir el valor a número si es string
          const numericValue =
            typeof param.value === 'string'
              ? parseFloat(param.value.replace(/[^\d.-]/g, ''))
              : param.value;

          if (isNaN(numericValue)) {
            throw new Error(
              'Valor no numérico encontrado al calcular el total'
            );
          }
          return sum + numericValue;
        }, 0);
      }

      // Ahora formatear los valores para mostrar
      let list = params
        .map(
          (param) =>
            `${param.marker}
            <label class="series-name">${
              param.seriesName
            }</label>:<label class="value">${
              param.value !== null && param.value !== undefined
                ? this.formatValue(
                    typeof param.value === 'string'
                      ? parseFloat(param.value.replace(/[^\d.-]/g, ''))
                      : param.value
                  )
                : '-'
            }</label>`
        )
        .join('<br>');

      // Agregar el total formateado si es necesario
      if (tooltipConfig?.showTotal) {
        list += `<hr><label class="summation">Total</label>:<label class="value">${this.formatValue(
          total
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
   * Formatea un valor numérico según la configuración
   * @param value - Valor a formatear
   * @returns Valor formateado como string
   * @private
   */
  private formatValue(value: number | string): string {
    try {
      if (value === null || value === undefined) {
        return '-';
      }

      // Convertir el valor a número si es string
      const numericValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/[^\d.-]/g, ''))
          : value;

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
