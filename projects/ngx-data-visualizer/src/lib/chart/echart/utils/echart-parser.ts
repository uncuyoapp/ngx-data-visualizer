import { EChartsOption } from "echarts";
import cloneDeep from "lodash.clonedeep";
import { EC_CHART_CONFIG_PREVIEW, MAX_TITLE_LIMIT_PIXELS } from "../../../types/constants";
import { ChartOptions } from "../../../types/data.types";
import { ParserOptions } from "../../types/parser-options";

/**
 * Clase encargada de analizar, formatear y estructurar las opciones de los gráficos ECharts.
 * Implementa la interfaz ParserOptions para proporcionar funcionalidades de
 * configuración tanto para la vista previa rápida como para la visualización completa del gráfico.
 * 
 * Actúa como un traductor que toma las opciones de negocio genéricas de la biblioteca (`ChartOptions`)
 * y las mapea en la estructura de configuración requerida por ECharts (`EChartsOption`).
 */
export class EChartParser implements ParserOptions {
  /**
   * Obtiene las opciones específicas para renderizar la vista previa rápida del gráfico.
   * 
   * @param config Configuración de opciones del gráfico definidas por el usuario.
   * @returns Un objeto de opciones preconfigurado para vista previa.
   */
  public getPreviewOptions(config: ChartOptions): unknown {
    const options = this.mergeOptions({}, true);
    return this.applyChartConfigurations(config, options);
  }

  /**
   * Obtiene las opciones completas y detalladas necesarias para renderizar el gráfico principal.
   * 
   * @param config Configuración de opciones del gráfico definidas por el usuario.
   * @returns Un objeto con la configuración final completa del gráfico.
   */
  public getFullOptions(config: ChartOptions): unknown {
    const options = this.mergeOptions({}, false);
    return this.applyChartConfigurations(config, options);
  }

  /**
   * Orquesta la aplicación de configuraciones de negocio sobre las opciones de la biblioteca gráfica ECharts.
   * Delega el mapeo de cada componente a métodos de responsabilidad única para mejorar legibilidad y extensibilidad.
   * 
   * @param config Opciones genéricas de configuración del gráfico definidas por el usuario.
   * @param libraryConfig Objeto base de opciones de ECharts a ser modificado.
   * @returns Opciones de ECharts completamente mapeadas y listas para renderizarse.
   */
  public applyChartConfigurations(
    config: ChartOptions,
    libraryConfig: unknown,
  ): unknown {
    const echartsConfig = libraryConfig as EChartsOption & { type?: string };

    // 1. Mapear tipo de gráfico
    this.parseType(echartsConfig, config);

    // 2. Mapear colores de series
    this.parseColors(echartsConfig, config);

    // 3. Mapear título del gráfico
    this.parseTitle(echartsConfig, config);

    // 4. Mapear comportamiento del tooltip
    this.parseTooltip(echartsConfig, config);

    // 5. Mapear comportamiento y estado del navegador (dataZoom)
    this.parseNavigator(echartsConfig, config);

    return echartsConfig;
  }

  /**
   * Configura el tipo de gráfico en las opciones de ECharts.
   * 
   * @param echartsConfig Referencia al objeto de opciones nativo de ECharts extendido con la propiedad type.
   * @param config Opciones del gráfico.
   * @private
   */
  private parseType(echartsConfig: EChartsOption & { type?: string }, config: ChartOptions): void {
    echartsConfig.type = config.type;
  }

  /**
   * Configura la paleta de colores personalizada para las series en ECharts.
   * 
   * @param echartsConfig Referencia al objeto de opciones nativo de ECharts.
   * @param config Opciones del gráfico.
   * @private
   */
  private parseColors(echartsConfig: EChartsOption, config: ChartOptions): void {
    if (config.colors) {
      echartsConfig.color = config.colors;
    }
  }

  /**
   * Configura el título nativo del gráfico en ECharts.
   * 
   * @param echartsConfig Referencia al objeto de opciones nativo de ECharts.
   * @param config Opciones del gráfico.
   * @private
   */
  private parseTitle(echartsConfig: EChartsOption, config: ChartOptions): void {
    if (typeof config.title === "string" && config.title.trim().length > 0) {
      echartsConfig.title = {
        text: config.title,
        left: "center",
        top: "top",
        show: true,
        textStyle: {
          overflow: "truncate",
          width: MAX_TITLE_LIMIT_PIXELS,
          ellipsis: "...",
        },
      };
    } else {
      echartsConfig.title = {
        show: false,
      };
    }
  }

  /**
   * Configura el comportamiento y visualización de los Tooltips en ECharts.
   * 
   * @param echartsConfig Referencia al objeto de opciones nativo de ECharts.
   * @param config Opciones del gráfico.
   * @private
   */
  private parseTooltip(echartsConfig: EChartsOption, config: ChartOptions): void {
    if (echartsConfig.tooltip && !Array.isArray(echartsConfig.tooltip)) {
      const tooltip = echartsConfig.tooltip as { trigger?: string; showTotal?: boolean };
      tooltip.trigger = config.tooltip.shared ? "axis" : "item";
      tooltip.showTotal = config.tooltip.showTotal;
    }
  }

  /**
   * Inicializa y configura los parámetros funcionales del navegador (dataZoom / slider).
   * 
   * @param echartsConfig Referencia al objeto de opciones nativo de ECharts.
   * @param config Opciones del gráfico.
   * @private
   */
  private parseNavigator(echartsConfig: EChartsOption, config: ChartOptions): void {
    if (config.navigator) {
      echartsConfig.dataZoom = [
        {
          show: config.navigator.show,
          type: "slider",
          start: config.navigator.start ?? 0,
          end: config.navigator.end ?? 100,
          showDetail: false,
        }
      ];
    }
  }

  /**
   * Combina un conjunto de opciones personalizadas con las opciones por defecto de la biblioteca.
   * 
   * @param config Opciones personalizadas provistas.
   * @param preview Indica si se deben usar las opciones reducidas para la vista previa rápida.
   * @returns Un clon profundo de la combinación de opciones base y personalizadas.
   * @private
   */
  private mergeOptions(config: Partial<EChartsOption>, preview?: boolean): EChartsOption {
    const defaultOptions = preview
      ? EC_CHART_CONFIG_PREVIEW
      : EC_CHART_CONFIG_PREVIEW;

    const renderOptions: EChartsOption = {
      ...cloneDeep(defaultOptions),
      ...config,
    };
    return renderOptions;
  }
}
