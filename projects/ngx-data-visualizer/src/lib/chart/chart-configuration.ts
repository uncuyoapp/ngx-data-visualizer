import { Type } from "@angular/core";
import { Dataset } from "../dataset";
import { ChartData } from "./chart-data";
import { EchartsComponent } from "./echart/echarts.component";

export interface ChartConfigurationOptions {
  type: string;
  title?: string;
  stacked: string | null;
  xAxis: {
    title: string,
    rotateLabels: number | null,
    firstLevel: number,
    secondLevel: number | null
  },
  yAxis: {
    title: string,
    max: number | null
  },
  tooltip: {
    shared: boolean,
    decimals: number | null,
    suffix: string | null,
    format: string | null,
    showTotal: boolean
  },
  legends: {
    enabled: boolean,
    show: boolean,
    position: string
  },
  navigator: {
    show: boolean,
    start: number | null,
    end: number | null
  },
  colors?: string[],
  width: number | null,
  height: number | string | null,
  filterLastYear: boolean,
  showYearsLegend: boolean,
  toPercent: boolean,
  measureUnit: string;
  isPreview: boolean;
}

export const DEFAULT_OPTIONS: ChartConfigurationOptions = {
  type: 'column',
  title: '',
  stacked: null,
  xAxis: {
    title: '',
    rotateLabels: null,
    firstLevel: 0,
    secondLevel: null
  },
  yAxis: {
    title: '',
    max: null
  },
  tooltip: {
    shared: false,
    decimals: null,
    suffix: null,
    format: null,
    showTotal: false
  },
  legends: {
    enabled: true,
    show: false,
    position: ''
  },
  navigator: {
    show: false,
    start: null,
    end: null
  },
  colors: ['#5CA7FC', '#7F93F1', '#C089E8', '#E683CC', '#B18AEC', '#EB6083', '#F1626A', '#EF8069', '#F1A973', '#ECDE5F'],
  width: null,
  height: null,
  filterLastYear: false,
  showYearsLegend: false,
  toPercent: false,
  measureUnit: '',
  isPreview: false
}

export interface SeriesConfig {
  x1: string;
  x2?: string;
  stack: string | null;
  measure?: string;
}

export interface ChartConfiguration {
  chartRenderType: Type<EchartsComponent>;
  dataset: Dataset;
  chartData: ChartData;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  libraryOptions: any;
  options: ChartConfigurationOptions;
  preview: boolean;
  seriesConfig: SeriesConfig;
}
