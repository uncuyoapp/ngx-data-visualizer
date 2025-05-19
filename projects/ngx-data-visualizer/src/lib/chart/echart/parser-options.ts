/* eslint-disable @typescript-eslint/no-explicit-any */
import { EChartsOption } from "echarts";
import { cloneDeep } from 'lodash';
import { ChartConfigurationOptions } from "../chart-configuration";
import { ParserOptions } from "../chart.service";
import { EC_CHART_CONFIG_PREVIEW } from "./echartsConfigurations";


export class ParserOptionsEChart implements ParserOptions {

  getPreviewOptions(config: ChartConfigurationOptions): unknown {
    const options = this.mergeOptions({}, true);
    return this.applyChartConfigurations(config, options);
  }

  getFullOptions(config: ChartConfigurationOptions): unknown {
    const options = this.mergeOptions({}, false);
    return this.applyChartConfigurations(config, options);
  }

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

  private mergeOptions(config: any, preview?: boolean) {
    const defaultOptions = preview ? EC_CHART_CONFIG_PREVIEW : EC_CHART_CONFIG_PREVIEW;
    const renderOptions: EChartsOption = { ...cloneDeep(defaultOptions), ...config };
    return renderOptions;
  }

}
