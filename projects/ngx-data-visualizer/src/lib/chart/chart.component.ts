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

/**
 * Componente principal de gráficos que encapsula la lógica de visualización
 * y manejo de datos para diferentes tipos de gráficos.
 */
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

  /**
   * Referencia al componente hijo EchartsComponent, obtenida de forma reactiva.
   * `viewChild` devuelve una señal, permitiendo que los `effect` reaccionen
   * cuando el componente hijo está disponible en la vista.
   */
  echart = viewChild(EchartsComponent);

  mainChart: Chart | null = null;
  showingGoal = false;

  private resizeObserver: ResizeObserver | null = null;
  private isInitialized = false;

  /**
   * Efecto reactivo que se dispara cuando las dependencias (señales) cambian.
   * Se ejecuta cuando `chartConfiguration` o `echart` (el componente hijo) reciben un valor.
   * Este `effect` se ejecuta múltiples veces en la inicialización:
   * 1. Una vez al crear el componente (con valores `undefined`).
   * 2. Otra vez cuando `chartConfiguration` llega desde el input.
   * 3. Una tercera vez cuando `echart` está disponible en el DOM.
   * Esta es la forma declarativa de esperar a que todas las dependencias estén listas.
   */
  private readonly configEffect = effect(() => {
    const config = this.chartConfiguration();
    const echart = this.echart();

    // Solo proceder cuando ambas dependencias están listas.
    if (config && echart) {
      // La lógica de inicialización se ejecuta una sola vez.
      if (!this.isInitialized) {
        this.setupAutoUpdate(config);
        this.setupResizeObserver();
        this.isInitialized = true;
      }
      this.ngOnConfigChange(config);
    }
  });

  /**
   * Configura la suscripción a los cambios de datos del dataset.
   * Cuando el dataset notifica una actualización (ej. por un filtro), se actualiza el gráfico.
   */
  private setupAutoUpdate(config: ChartConfiguration): void {
    if (!config.options.disableAutoUpdate) {
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
