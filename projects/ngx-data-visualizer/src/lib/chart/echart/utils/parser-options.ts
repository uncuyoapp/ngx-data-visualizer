/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from "echarts";
import { cloneDeep } from 'lodash';
import { ChartConfigurationOptions } from "../../types/chart-configuration";
import { ParserOptions } from "../../types/parser-options";
import { EC_CHART_CONFIG_PREVIEW } from "../types/echartsConfigurations";

/**
 * Clase encargada de analizar y configurar las opciones de los gráficos ECharts.
 * Implementa la interfaz ParserOptions para proporcionar funcionalidades de
 * configuración tanto para vista previa como para visualización completa.
 */
export class ParserOptionsEChart implements ParserOptions {

  /**
   * Obtiene las opciones para la vista previa del gráfico
   * @param config - Configuración de opciones del gráfico
   * @returns Objeto con las opciones para la vista previa
   */
  getPreviewOptions(config: ChartConfigurationOptions): unknown {
    const options = this.mergeOptions({}, true);
    return this.applyChartConfigurations(config, options);
  }

  /**
   * Obtiene las opciones completas para el gráfico
   * @param config - Configuración de opciones del gráfico
   * @returns Objeto con las opciones completas
   */
  getFullOptions(config: ChartConfigurationOptions): unknown {
    const options = this.mergeOptions({}, false);
    return this.applyChartConfigurations(config, options);
  }

  /**
   * Aplica configuraciones adicionales al gráfico
   * @param config - Configuración de opciones del gráfico
   * @param libraryConfig - Configuración actual de la biblioteca de gráficos
   * @returns Configuración actualizada de la biblioteca
   */
  applyChartConfigurations(config: ChartConfigurationOptions, libraryConfig: unknown): unknown {
    const echartsConfig = libraryConfig as EChartsOption;
    echartsConfig["type"] = config.type;

    if (config.colors) {
      echartsConfig.color = config.colors;
    }

    (echartsConfig.tooltip as any).trigger = config.tooltip.shared ? 'axis' : 'item';

    if (typeof config.title === 'string') {
      echartsConfig.title = {
        text: config.title,
        show: true,
        left: 'center'
      };
    }
    (echartsConfig.dataZoom as any).show = config.navigator.show;
    (echartsConfig.tooltip as any).showTotal = config.tooltip.showTotal;
    return echartsConfig;
  }

  /**
   * Combina las opciones por defecto con las opciones personalizadas
   * @param config - Configuración personalizada
   * @param preview - Indica si se deben usar las opciones de vista previa
   * @returns Opciones combinadas
   * @private
   */
  private mergeOptions(config: any, preview?: boolean) {
    const defaultOptions = preview ? EC_CHART_CONFIG_PREVIEW : EC_CHART_CONFIG_PREVIEW;
    const renderOptions: EChartsOption = { ...cloneDeep(defaultOptions), ...config };
    return renderOptions;
  }

}
