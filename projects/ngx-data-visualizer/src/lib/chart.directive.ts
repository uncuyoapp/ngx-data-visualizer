import { ComponentRef, Directive, ViewContainerRef, effect, input, output } from '@angular/core';
import { ChartConfiguration, ChartConfigurationOptions } from './chart/chart-configuration';
import { ChartComponent } from './chart/chart.component';
import { ChartService } from './chart/chart.service';
import { Dataset } from './dataset';
import { Goal, Series } from './models';

@Directive({
  selector: 'libChart, [libChart]',
  standalone: true,
  exportAs: 'libChart',
})
export class ChartDirective {
  dataset = input.required<Dataset>();
  options = input.required<ChartConfigurationOptions>();
  seriesChange = output<Series[]>();

  private chartRenderComponentRef!: ComponentRef<ChartComponent>;
  private chartConfiguration!: ChartConfiguration;
  chartComponent!: ChartComponent;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private chartService: ChartService
  ) {

    effect(() => {
      this.createChartComponent();
    });
    effect(() => {
      if (this.chartComponent?.series()) {
        this.seriesChange.emit(this.chartComponent.series());
      }
    });
  }

  createChartComponent() {
    this.viewContainerRef.clear();
    this.chartRenderComponentRef = this.viewContainerRef.createComponent<ChartComponent>(ChartComponent);
    this.chartConfiguration = this.chartService.getChartConfiguration(this.dataset(), this.options());
    this.chartComponent = this.chartRenderComponentRef.instance;
    this.chartComponent.chartConfiguration = this.chartConfiguration;
  }


  toPercentage() {
    this.chartComponent?.mainChart?.togglePercentMode();
  }

  export(type: 'svg' | 'jpg') {
    return this.chartComponent?.mainChart?.export(type);
  }

  toggleShowGoal(goal: Goal) {
    this.chartComponent.toggleShowGoal(goal);
  }
}
