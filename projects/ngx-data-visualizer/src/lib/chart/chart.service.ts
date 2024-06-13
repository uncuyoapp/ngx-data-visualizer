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
    chartConfiguration.libraryOptions = this.getLibraryOptions(chartConfiguration.options);
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

      chartConfiguration.libraryOptions = this.getLibraryOptions(chartConfiguration.options);
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
    const { chartData, seriesConfig, options, dataset } = chartConfiguration;
    const { rollUp } = chartData.dataProvider.filters;

    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error('An error occurred when generating the series configuration.');
    }

    if (options?.filterLastYear) {
      this.filterLastPeriod(chartConfiguration);
    }

    chartData.seriesConfig = this.initializeSeriesConfig(seriesConfig);

    //the first x-axis can be use
    if (this.canUseAxis(seriesConfig.x1, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x1;
      //the second x-axis can be use
      if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
        chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    }
    //the first x-axis cannot be use
    //the second x-axis can be use
    else if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x2;
      chartData.seriesConfig.x2 = undefined;
    }
    //the first and second x-axis cannot be use
    //DIMENSION_YEAR can be use 
    else if (this.canUseAxis(DIMENSION_YEAR, rollUp)) {
      chartData.seriesConfig.x1 = DIMENSION_YEAR;
    }
    //the first and second x-axis cannot be use
    //DIMENSION_YEAR cannot be use
    //find a dimension for the x-axis 
    else {
      const availableDimension = this.findAvailableDimension(dataset.dimensions, rollUp);
      if (availableDimension) {
        chartData.seriesConfig.x1 = availableDimension;
        chartData.seriesConfig.x2 = undefined;
      }
      //no free dimension for the x-axis
      else {
        throw new Error('An error occurred when generating the series configuration: no free dimension for the x-axis.');
      }
    }
  }

  private initializeSeriesConfig(seriesConfig: SeriesConfig): SeriesConfig {
    return {
      x1: '',
      x2: undefined,
      stack: seriesConfig.stack,
      measure: seriesConfig.measure
    };
  }

  private canUseAxis(axis: string, rollUp: string[]): boolean {
    return rollUp.indexOf(axis) === -1;
  }

  private findAvailableDimension(dimensions: Dimension[], rollUp: string[]): string | null {
    const dimensionFree = dimensions.filter(dimension => rollUp.indexOf(dimension.nameView) === -1);
    return dimensionFree.length ? dimensionFree[0].nameView : null;
  }

  private getLibraryOptions(options: ChartConfigurationOptions) {
    return options.isPreview
      ? this.parserOptions.getPreviewOptions(options)
      : this.parserOptions.getFullOptions(options);
  }

  private resetFilters(arrayData: DataProvider) {
    arrayData.filters = {
      rollUp: [],
      filter: []
    };
  }

  private filterLastPeriod(chartConfiguration: ChartConfiguration) {
    //filter the last period
    const items = chartConfiguration.dataset.dataProvider.getItems(DIMENSION_YEAR).slice(-1);
    if (items.length) {
      const filter = chartConfiguration.dataset.dataProvider.filters.filter.find(f => f.name === DIMENSION_YEAR);
      if (filter) {
        filter.items = [items[0]];
      } else {
        chartConfiguration.dataset.dataProvider.filters.filter.push({ name: DIMENSION_YEAR, items: [items[0]] });
      }
    }
  }

  private configureFiltersAndData(chartConfiguration: ChartConfiguration) {
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
