/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from "echarts";
import { ChartConfigurationOptions } from "../chart-configuration";
import { ParserOptions } from "../chart.service";
import { EC_CHART_CONFIG_PREVIEW } from "./echartsConfigurations";


export class ParserOptionsEChart implements ParserOptions {

  getPreviewOptions(config: ChartConfigurationOptions) {
    const options = this.mergeOptions({}, true);
    return this.applyChartConfigurations(config, options);
  }

  getFullOptions(config: ChartConfigurationOptions) {
    const options = this.mergeOptions({}, false);
    return this.applyChartConfigurations(config, options);
  }

  applyChartConfigurations(config: ChartConfigurationOptions, libraryConfig: EChartsOption) {
    libraryConfig["type"] = config.type
    libraryConfig.color = config.colors;
    (libraryConfig.tooltip as any).trigger = config.tooltip.shared ? 'axis' : 'item';

    if (typeof config.title === 'string') {
      libraryConfig.title = {
        text: config.title,
        show: true,
        left: 'center'
      }
    }
    (libraryConfig.dataZoom as any).show = config.navigator.show;

    (libraryConfig.tooltip as any).showTotal = config.tooltip.showTotal;
    return libraryConfig;
  }

  private mergeOptions(config: any, preview?: boolean) {
    const defaultOptions = preview ? EC_CHART_CONFIG_PREVIEW : EC_CHART_CONFIG_PREVIEW;    
    const renderOptions: EChartsOption = { ...defaultOptions, ...config };
    return renderOptions;
  }

}
