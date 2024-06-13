import { ChartConfiguration, ChartConfigurationOptions } from "./chart-configuration";
import { ChartData } from "./chart-data";

export abstract class Chart {

  abstract name: string;
  enabled = true;
  protected abstract series: object[];
  public chartData: ChartData;
  public libraryOptions: object;
  public chartOptions: ChartConfigurationOptions;

  constructor(public configuration: ChartConfiguration) { 
    this.chartData = configuration.chartData;
    this.libraryOptions = configuration.libraryOptions;
    this.chartOptions = configuration.options;
  }

  abstract set instance(instance: object);
  abstract get instance(): object;

  abstract getSeries(): object[];
  abstract addSeries(series: object): void;
  abstract delSeries(series: object): void;

  abstract hoverSeries(series: object): void;
  abstract selectSeries(series: object): void;

  abstract render(): void;
  abstract getOptions(): object;
  abstract expand(width: number | string): void;
  abstract condense(): void;
  abstract hide(): void;
  abstract togglePercentMode(): void;
  abstract setExtremes(): void;
  abstract export(type: 'svg' | 'jpg'): string|void;

}
