import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DIMENSION_VALUE, DIMENSION_YEAR, DataProvider } from '../data-provider';
import { LegendComponent } from '../legend/legend.component';
import { Filters, Goal, Series } from '../models';
import { Chart } from './chart';
import { ChartConfiguration, SeriesConfig } from './chart-configuration';
import { ChartData } from './chart-data';
import { ChartService } from './chart.service';
import { EchartsComponent } from './echart/echarts.component';

@Component({
  standalone: true,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  imports: [
    CommonModule,
    EchartsComponent,
    LegendComponent
  ]
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input()
  chartConfiguration!: ChartConfiguration;
  series = signal<Series[]>([]);
  @ViewChild(EchartsComponent) echart!: EchartsComponent;
  mainChart!: Chart;
  subscription!: Subscription;
  chartService = inject(ChartService);

  showingGoal = false;
  savedSeriesConfiguration!: SeriesConfig;
  savedFilters!: Filters;
  goalChartData!: ChartData;

  ngOnInit(): void {
    if (!this.chartConfiguration.options.disableAutoUpdate) {
      this.subscription = this.chartConfiguration?.dataset.dataUpdated.subscribe(() => {
        this.chartService.updateSeriesConfig(this.chartConfiguration);
        this.echart.updateChart();
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSelectSeries(seriesElement: Series) {
    this.mainChart.selectSeries(seriesElement);
  }

  onHoverSeries(seriesElement: Series) {
    this.mainChart.hoverSeries(seriesElement);
  }

  onSeriesChange(series: Series[]) {
    this.series.set(series);
  }


  toggleShowGoal(goal: Goal) {
    this.showingGoal = !this.showingGoal;
    if (this.showingGoal) {
      this.showGoal(goal);
    } else {
      this.hideGoal();
    }
  }

  private showGoal(goal: Goal) {
    if (!this.goalChartData) {
      this.generateGoalChartData(goal);
    }
    this.updateSeriesConfig(this.goalChartData.seriesConfig);
    this.mainChart.addSeries(this.echart.getGoalSeries(this.goalChartData, goal.chartType));
    this.echart.emitSeries();
  }

  private hideGoal() {
    const { savedSeriesConfiguration, savedFilters } = this;
    this.chartConfiguration.seriesConfig = { ...savedSeriesConfiguration };
    this.chartConfiguration.dataset.applyFilters({ ...savedFilters });
  }

  private generateGoalChartData(goal: Goal) {
    const dataProvider = new DataProvider();
    dataProvider.setData(goal.data);
    const goalDimensions = dataProvider.getDimensionsNames().filter(dim => dim !== DIMENSION_VALUE && dim !== DIMENSION_YEAR);
    const seriesConfig: SeriesConfig = {
      x1: DIMENSION_YEAR,
      x2: goalDimensions.length ? goalDimensions[0] : undefined,
      stack: null,
      measure: this.chartConfiguration.seriesConfig.measure
    };

    this.goalChartData = new ChartData(dataProvider, seriesConfig);
  }

  private updateSeriesConfig(seriesConfig: SeriesConfig) {
    const { chartConfiguration } = this;
    const { dataset } = chartConfiguration;
    const { dimensions } = dataset;

    const filters: Filters = {
      filter: [],
      rollUp: dimensions
        .filter(dimension => dimension.nameView !== seriesConfig.x1 && dimension.nameView !== seriesConfig.x2)
        .map(dimension => dimension.nameView)
    };
    this.savedSeriesConfiguration = { ...chartConfiguration.seriesConfig };
    this.savedFilters = { ...dataset.dataProvider.filters };
    chartConfiguration.seriesConfig = seriesConfig;
    dataset.applyFilters(filters);
  }

}
