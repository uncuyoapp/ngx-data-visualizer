import { ChartConfiguration } from "./chart-configuration";
import { ChartData } from "./chart-data";

export abstract class Chart {

  abstract name: string;
  enabled = true;
  protected abstract series: object[];

  constructor(protected data: ChartData, public options: object, public configuration?: ChartConfiguration) { }

  abstract set instance(instance: object);
  abstract get instance(): object;

  abstract setChartData(data: ChartData): void;
  abstract setOptions(options: object): void;

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
  abstract toPercentage(): void;
  abstract setExtremes(): void;
  abstract export(type: 'svg' | 'jpg'): string|void;

}
