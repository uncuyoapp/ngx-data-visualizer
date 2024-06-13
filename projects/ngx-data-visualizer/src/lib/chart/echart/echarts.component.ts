import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ECharts } from 'echarts';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { Series } from '../../models';
import { Chart } from '../chart';
import { ChartConfiguration } from '../chart-configuration';
import { ChartData } from '../chart-data';
import { EChart } from './echarts';

@Component({
  standalone: true,
  selector: 'lib-app-echarts',
  templateUrl: './echarts.component.html',
  styleUrls: ['./echarts.component.scss'],
  imports: [
    NgxEchartsModule,
    CommonModule
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') }),
    },
  ],
})
export class EchartsComponent implements OnInit {
  @Input()
  chartConfiguration!: ChartConfiguration;

  @Output()
  seriesChange: EventEmitter<Series[]> = new EventEmitter<Series[]>();

  @Output()
  chartCreated: EventEmitter<Chart> = new EventEmitter<Chart>();

  mainChart!: EChart;
  initOptions = {
    // width: '100%',
    // height: 100,
    locale: 'es',
    renderer: 'svg',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  id: number = Math.floor(Math.random() * 100);


  ngOnInit(): void {
    this.configInitOptions();
    this.createChart();
  }

  configInitOptions() {
    if (this.chartConfiguration.options.height) {
      this.initOptions.height = this.chartConfiguration.options.height + 'px';
    }
    if (this.chartConfiguration.options.width) {
      this.initOptions.width = this.chartConfiguration.options.width + 'px';
    }

  }

  createChart(): void {
    this.mainChart = new EChart(
      this.chartConfiguration
    );
    this.mainChart.render();
    this.chartCreated.emit(this.mainChart);
  }

  updateChart(): void {
    this.mainChart.render();
    this.emitSeries();
  }

  setChartInstance(instance: ECharts) {
    this.mainChart.instance = instance;

    setTimeout(() => {
      this.emitSeries();
    });

  }

  emitSeries() {
    this.seriesChange.emit(this.mainChart.getSeries());
  }

  getGoalSeries(chartData: ChartData, type: string) {
    const series = chartData.getSeries();
    return {
      ...series[0],
      name: 'Meta',
      color: 'black',
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (series[0] as Series).data.map((v: any[]) => v[1]),
      smooth: true,
      stacking: undefined
    };
  }
}
