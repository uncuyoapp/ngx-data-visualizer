import { ComponentRef, Directive, ViewContainerRef, effect, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartConfiguration, ChartConfigurationOptions, Dimension } from '../public-api';
import { ChartService } from './chart/chart.service';
import { Dataset } from './dataset';
import { MultipleChartComponent } from './multiple-chart/multiple-chart.component';

@Directive({
  selector: 'libMultipleChart, [libMultipleChart]',
  standalone: true,
  exportAs: 'libMultipleChart'
})
export class MultipleChartDirective {
  dataset = input.required<Dataset>();
  options = input.required<ChartConfigurationOptions>();
  splitDimension = input.required<Dimension>();

  private multipleChartRenderComponentRef!: ComponentRef<MultipleChartComponent>;
  private multipleChartComponent!: MultipleChartComponent;
  private multipleChartConfiguration!: ChartConfiguration[];

  subscription!: Subscription;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private chartService: ChartService
  ) {
    effect(() => {
      this.createMultipleChartComponent();
      this.subscription = this.dataset()?.dataUpdated.subscribe(() => {
        this.createMultipleChartComponent();
      });
    });


  }

  createMultipleChartComponent() {
    this.viewContainerRef.clear();
    this.multipleChartRenderComponentRef = this.viewContainerRef.createComponent<MultipleChartComponent>(MultipleChartComponent);
    this.multipleChartComponent = this.multipleChartRenderComponentRef.instance;
    this.multipleChartConfiguration = this.chartService.getSplitConfiguration(this.dataset(), this.options(), this.splitDimension());
    this.multipleChartComponent.chartConfigurations = this.multipleChartConfiguration;
  }

}
