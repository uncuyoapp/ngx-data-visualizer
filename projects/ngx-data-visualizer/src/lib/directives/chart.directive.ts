import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
  output,
} from "@angular/core";
import { Subject } from "rxjs";
import { ChartComponent } from "../chart/chart.component";
import { ChartService } from "../chart/services/chart.service";
import { ChartOptions } from "../chart/types/chart-configuration";
import { Goal, Series } from "../chart/types/chart-models";
import { Dataset } from "../services/dataset";

@Directive({
  selector: "libChart, [libChart]",
  standalone: true,
  exportAs: "libChart",
})
export class ChartDirective implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  dataset = input.required<Dataset>();
  chartOptions = input.required<ChartOptions>();
  seriesChange = output<Series[]>();
  private chartRenderComponentRef!: ComponentRef<ChartComponent>;
  chartComponent!: ChartComponent;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly chartService: ChartService
  ) {
    this.createChartComponent();
    this.initializeChartUpdates();
    this.initializeSeriesEffect();
  }

  private initializeSeriesEffect(): void {
    effect(() => {
      if (this.chartComponent) {
        const currentSeries = this.chartComponent.series();
        if (currentSeries) {
          this.seriesChange.emit(currentSeries);
        }
      }
    });
  }

  private createChartComponent(): void {
    this.viewContainerRef.clear();
    this.chartRenderComponentRef =
      this.viewContainerRef.createComponent<ChartComponent>(ChartComponent);
    this.chartComponent = this.chartRenderComponentRef.instance;
  }

  private initializeChartUpdates(): void {
    effect(() => {
      console.log(
        "[Debug 0] Directive effect: Creando/actualizando chartConfiguration."
      );
      const chartConfiguration = this.chartService.getChartConfiguration(
        this.dataset(),
        this.chartOptions()
      );
      this.chartRenderComponentRef.setInput(
        "chartConfiguration",
        chartConfiguration
      );
    });
  }

  toPercentage() {
    this.chartComponent?.mainChart?.togglePercentMode();
  }

  export(type: "svg" | "jpg") {
    return this.chartComponent?.mainChart?.export(type);
  }

  toggleShowGoal(goal: Goal) {
    if (this.chartComponent) {
      this.chartComponent.toggleShowGoal(goal);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.viewContainerRef.clear();
  }
}