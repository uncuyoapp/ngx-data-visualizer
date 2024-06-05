import { Injectable, Type } from "@angular/core";
import { cloneDeep } from 'lodash';
import { DIMENSION_YEAR, DataProvider } from "../data-provider";
import { Dataset } from "../dataset";
import { Dimension } from "../models";
import { ChartConfiguration, ChartConfigurationOptions, DEFAULT_OPTIONS, SeriesConfig } from "./chart-configuration";
import { ChartData } from "./chart-data";
import { EchartsComponent } from "./echart/echarts.component";
import { ParserOptionsEChart } from "./echart/parser-options";

export interface ParserOptions {
  getPreviewOptions(config: ChartConfigurationOptions): object;
  getFullOptions(config: ChartConfigurationOptions): object;
  applyChartConfigurations(config: ChartConfigurationOptions, libraryConfig: object): object;
}


@Injectable({
  providedIn: 'root'
})
export class ChartService {

  private parserOptions: ParserOptions;
  private chartRenderEngine: Type<EchartsComponent>;

  constructor() {
    this.parserOptions = new ParserOptionsEChart();
    this.chartRenderEngine = EchartsComponent;
  }

  public getChartConfiguration(dataset: Dataset, options: ChartConfigurationOptions): ChartConfiguration {
    const chartConfiguration = { dataset } as ChartConfiguration;
    chartConfiguration.options = { ...cloneDeep(DEFAULT_OPTIONS), ...options };
    this.configureFiltersAndData(chartConfiguration);
    chartConfiguration.libraryOptions = this.getLibraryOptions(chartConfiguration.options, chartConfiguration.options.isPreview);
    chartConfiguration.chartRenderType = this.chartRenderEngine;
    return chartConfiguration;
  }

  public getSplitConfiguration(dataset: Dataset, options: ChartConfigurationOptions, dimension: Dimension): ChartConfiguration[] {

    const configurationReturns: ChartConfiguration[] = [];
    dimension.items.filter(i => i.selected).forEach(item => {
      const datasetCopy = new Dataset(dataset);
      datasetCopy.dataProvider.filters = JSON.parse(JSON.stringify(dataset.dataProvider.filters));
      const chartConfiguration = { dataset: datasetCopy, options: { ...cloneDeep(DEFAULT_OPTIONS), ...options } } as ChartConfiguration;

      chartConfiguration.dataset.dataProvider.filters.rollUp.push(dimension.nameView);
      chartConfiguration.dataset.dataProvider.filters.filter.push({
        name: dimension.nameView,
        items: [item.name]
      });
      chartConfiguration.options.height = 400;
      chartConfiguration.options.title = item.name;
      chartConfiguration.options.legends.show = false;
      this.configureFiltersAndData(chartConfiguration);

      chartConfiguration.libraryOptions = this.getLibraryOptions(chartConfiguration.options, chartConfiguration.options.isPreview);
      chartConfiguration.chartRenderType = this.chartRenderEngine;
      this.updateSeriesConfig(chartConfiguration);
      configurationReturns.push(chartConfiguration);
    });

    return configurationReturns;
  }

  public updateLibraryConfig(chartConfiguration: ChartConfiguration) {
    chartConfiguration.libraryOptions = this.parserOptions.applyChartConfigurations(chartConfiguration.options, chartConfiguration.libraryOptions);
  }

  public updateSeriesConfig(chartConfiguration: ChartConfiguration) {
    const chartData = chartConfiguration.chartData;
    const seriesConfig = chartConfiguration.seriesConfig;
    const rollUp = chartData.dataProvider.filters.rollUp;

    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error('An error occurred when generating the series configuration.');
    }

    chartData.seriesConfig = {
      x1: '',
      x2: undefined,
      stack: seriesConfig.stack,
      measure: seriesConfig.measure
    };

    //the first x-axis can be use
    if (rollUp.indexOf(seriesConfig.x1) === -1) {
      chartData.seriesConfig.x1 = seriesConfig.x1;
      //the second x-axis can be use
      if (seriesConfig.x2 && rollUp.indexOf(seriesConfig.x2) === -1) {
        chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    }

    //the first x-axis cannot be use
    //the second x-axis can be use
    else if (seriesConfig.x2 && rollUp.indexOf(seriesConfig.x2) === -1) {
      chartData.seriesConfig.x1 = seriesConfig.x1;
      chartData.seriesConfig.x2 = undefined;
    }

    //the first and second x-axis cannot be use
    //DIMENSION_YEAR can be use
    else if (rollUp.indexOf(DIMENSION_YEAR) === -1) {
      chartData.seriesConfig.x1 = DIMENSION_YEAR;
    }

    //the first and second x-axis cannot be use
    //DIMENSION_YEAR cannot be use
    //find a dimension for the x-axis
    else {
      const dimensionFree = chartConfiguration.dataset.dimensions.filter(dimension => rollUp.indexOf(dimension.nameView) === -1);
      if (dimensionFree.length) {
        chartData.seriesConfig.x1 = dimensionFree[0].nameView;
        chartData.seriesConfig.x2 = undefined;
      }
      //no free dimension for the x-axis
      else {
        throw new Error('An error occurred when generating the series configuration.');
      }
    }
  }

  private getLibraryOptions(options: ChartConfigurationOptions, isPreview: boolean) {
    return isPreview
      ? this.parserOptions.getPreviewOptions(options)
      : this.parserOptions.getFullOptions(options);
  }

  private resetFilters(arrayData: DataProvider) {
    arrayData.filters = {
      rollUp: [],
      filter: []
    };
  }

  private configureFiltersAndData(chartConfiguration: ChartConfiguration) {
    //filter the last period
    if (chartConfiguration.options?.filterLastYear) {
      const items = chartConfiguration.dataset.dataProvider.getItems(DIMENSION_YEAR).slice(-1);
      if (items.length) {
        chartConfiguration.dataset.dataProvider.filters.filter.push({ name: DIMENSION_YEAR, items: [items[0]] });
      }
    }

    //set up the default series config
    const seriesConfig: SeriesConfig = {
      x1: chartConfiguration.dataset.dataProvider.dimensions.find(d => d.id === chartConfiguration.options?.xAxis?.firstLevel)?.nameView ?? '',
      x2: chartConfiguration.dataset.dataProvider.dimensions.find(d => d.id === chartConfiguration.options?.xAxis?.secondLevel)?.nameView,
      measure: chartConfiguration.options.measureUnit,
      stack: chartConfiguration.options.stacked ?? ''
    };

    //create the chart data
    const chartData = new ChartData(chartConfiguration.dataset.dataProvider, seriesConfig);

    //save the copy of the config series
    chartConfiguration.seriesConfig = cloneDeep(seriesConfig);
    chartConfiguration.chartData = chartData;
    this.updateSeriesConfig(chartConfiguration);
  }

}
