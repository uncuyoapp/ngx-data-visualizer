/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from 'echarts';

/**
 * Interfaz para los parámetros del tooltip
 */
export interface TooltipParams {
  name: string;
  value: number;
  seriesName: string;
  dataIndex: number;
  marker: string;
  [key: string]: string | number;
}

/**
 * Interfaz para la configuración del tooltip
 */
interface TooltipConfig {
  showTotal?: boolean;
}

/**
 * Clase encargada de manejar la lógica de los tooltips en los gráficos ECharts
 */
export class TooltipManager {
  constructor(
    private decimals?: number | null,
    private suffix?: string | null
  ) {}

  /**
   * Formatea el tooltip según los parámetros recibidos
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
   */
  private formatTooltipTitle(params: TooltipParams | TooltipParams[], options: EChartsOption): string {
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
            Math.floor(
              dataIndex /
                (xAxis0.data.length /
                  xAxis1.data.length)
            )
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
            Math.floor(
              dataIndex /
                (yAxis0.data.length /
                  yAxis1.data.length)
            )
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
   */
  private formatSingleParamTooltip(param: TooltipParams, title: string): string {
    try {
      if (!param) {
        throw new Error('Parámetro del tooltip no válido');
      }

      const value = param.value !== null && param.value !== undefined
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

      let list = params
        .map(
          (param) =>
            `${param.marker}
            <label class="series-name">${
              param.seriesName
            }</label>:<label class="value">${
                param.value !== null && param.value !== undefined
                  ? this.formatValue(param.value)
                  : '-'
              }</label>`
        )
        .join('<br>');

      const tooltipConfig = options.tooltip as TooltipConfig;
      if (tooltipConfig?.showTotal) {
        const showTotal = params.reduce((total, param) => {
          if (typeof param.value !== 'number') {
            throw new Error('Valor no numérico encontrado al calcular el total');
          }
          return total + param.value;
        }, 0);
        list += `<hr><label class="summation">Total</label>:<label class="value">${this.formatValue(
          showTotal
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
   */
  private formatValue(value: number): string {
    try {
      if (value === null || value === undefined) {
        return '-';
      }

      if (isNaN(value)) {
        throw new Error('Valor no numérico');
      }

      const returnValue =
        this.decimals !== null && this.decimals !== undefined
          ? value.toLocaleString('es-AR', {
              minimumFractionDigits: this.decimals,
              maximumFractionDigits: this.decimals,
              useGrouping: true,
            })
          : value.toLocaleString('es-AR', {
              useGrouping: true,
            });
      return this.suffix ? returnValue + ' ' + this.suffix : returnValue;
    } catch (error) {
      console.error('Error al formatear valor:', error);
      return 'Error';
    }
  }
}
