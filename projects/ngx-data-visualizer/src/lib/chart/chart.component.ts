import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LegendComponent } from "../legend/legend.component";
import { Filters } from "../types/data.types";
import { EchartsComponent } from "./echart/echarts.component";
import { ChartService } from "./services/chart.service";
import { Chart } from "./types/chart";
import { ChartConfiguration } from "./types/chart-configuration";
import { Goal, Series } from "./types/chart-models";
import { GoalChartHelper } from "./utils/goal-chart.helper";

@Component({
  standalone: true,
  templateUrl: "./chart.component.html",
  styleUrl: "./chart.component.scss",
  imports: [CommonModule, EchartsComponent, LegendComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnDestroy {
  private readonly chartService = inject(ChartService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  private goalChartHelper!: GoalChartHelper;

  chartConfiguration = input<ChartConfiguration | null>(null);
  series = signal<Series[]>([]);
  echart = viewChild(EchartsComponent);

  mainChart: Chart | null = null;
  showingGoal = false;

  private resizeObserver: ResizeObserver | null = null;
  private isInitialized = false;

  private readonly configEffect = effect(() => {
    const config = this.chartConfiguration();
    const echart = this.echart();
    console.log(
      "[Debug X] configEffect: Disparado. Estado ->",
      {
        config: !!config,
        echart: !!echart
      }
    );
    if (config && echart) {
      if (!this.isInitialized) {
        this.setupAutoUpdate(config);
        this.setupResizeObserver();
        this.isInitialized = true;
      }
      this.ngOnConfigChange(config);
    }
  });

  private setupAutoUpdate(config: ChartConfiguration): void {
    console.log(
      "[Debug A] setupAutoUpdate: Verificando config.options.disableAutoUpdate. Valor:",
      config.options.disableAutoUpdate
    );
    if (!config.options.disableAutoUpdate) {
      console.log(
        "[Debug B] setupAutoUpdate: Condición superada. Suscribiendo a dataUpdated..."
      );
      config.dataset.dataUpdated
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.handleDataUpdate();
        });
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        const echart = this.echart();
        if (echart) {
          echart.updateChart();
        }
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  private ngOnConfigChange(config: ChartConfiguration): void {
    this.chartService.updateSeriesConfig(config);
    this.goalChartHelper = new GoalChartHelper(config);
    requestAnimationFrame(() => {
      const echart = this.echart();
      if (echart) {
        echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  private handleDataUpdate(): void {
    console.log(
      "[Debug 3] handleDataUpdate en ChartComponent: Iniciando actualización."
    );
    const config = this.chartConfiguration();
    if (!config) return;
    this.chartService.updateChartData(config);
    requestAnimationFrame(() => {
      const echart = this.echart();
      if (echart) {
        echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  public ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mainChart) {
      this.mainChart.dispose();
      this.mainChart = null;
    }
  }

  public onSelectSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.selectSeries(seriesElement);
    }
  }

  public onHoverSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.hoverSeries(seriesElement);
    }
  }

  public onSeriesChange(series: Series[]) {
    this.series.set(series);
  }

  public toggleShowGoal(goal: Goal) {
    this.showingGoal = !this.showingGoal;
    if (this.showingGoal) {
      this.showGoal(goal);
    } else {
      this.hideGoal();
    }
  }

  private showGoal(goal: Goal): void {
    const goalChartData = this.goalChartHelper.showGoal(goal);
    const echart = this.echart();
    if (goalChartData && this.mainChart && echart) {
      const goalSeries = echart.getGoalSeries(
        goalChartData,
        goal.chartType
      );
      let isFirstEmission = true;
      const subscription = echart.chartUpdated.subscribe(() => {
        if (this.mainChart && isFirstEmission) {
          requestAnimationFrame(() => {
            if (this.mainChart && isFirstEmission) {
              isFirstEmission = false;
              this.mainChart.addSeries(goalSeries);
              subscription.unsubscribe();
            }
          });
        }
      });
    }
  }

  private hideGoal(): void {
    const { savedSeriesConfig, savedFilters } = this.goalChartHelper.hideGoal();
    const config = this.chartConfiguration();
    if (!config) return;
    config.seriesConfig = { ...savedSeriesConfig };
    if (savedFilters) {
      const filters = new Filters();
      filters.rollUp = [...(savedFilters.rollUp || [])];
      filters.filter = [...(savedFilters.filter || [])];
      config.dataset.applyFilters(filters);
    } else {
      config.dataset.applyFilters(new Filters());
    }
  }
}