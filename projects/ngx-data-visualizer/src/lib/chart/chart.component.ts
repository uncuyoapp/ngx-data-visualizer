import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LegendComponent } from '../legend/legend.component';
import { Filters } from '../types/data.types';
import { EchartsComponent } from './echart/echarts.component';
import { ChartService } from './services/chart.service';
import { Chart } from './types/chart';
import { ChartConfiguration } from './types/chart-configuration';
import { Goal, Series } from './types/chart-models';
import { GoalChartHelper } from './utils/goal-chart.helper';

/**
 * Componente principal de gráficos que encapsula la lógica de visualización
 * y manejo de datos para diferentes tipos de gráficos.
 */
@Component({
  standalone: true,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  imports: [CommonModule, EchartsComponent, LegendComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnDestroy {
  // Inyección de dependencias
  private readonly chartService = inject(ChartService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  private goalChartHelper!: GoalChartHelper;

  // Inputs y referencias
  chartConfiguration = input<ChartConfiguration | null>(null);
  series = signal<Series[]>([]);

  @ViewChild(EchartsComponent, { static: true })
  private readonly echart!: EchartsComponent;

  mainChart: Chart | null = null;
  showingGoal = false;

  // Estado interno
  private resizeObserver: ResizeObserver | null = null;
  private isInitialized = false;

  /**
   * Efecto reactivo que se dispara cuando cambia la configuración del gráfico
   */
  private readonly configEffect = effect(() => {
    const config = this.chartConfiguration();
    if (config && this.echart) {
      if (!this.isInitialized) {
        this.setupAutoUpdate(config);
        this.setupResizeObserver();
        this.isInitialized = true;
      }
      this.ngOnConfigChange(config);
    }
  });

  /**
   * Configura la actualización automática del gráfico cuando cambian los datos
   * @private
   */
  private setupAutoUpdate(config: ChartConfiguration): void {
    if (!config.options.disableAutoUpdate) {
      config.dataset.dataUpdated
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.handleDataUpdate());
    }
  }

  /**
   * Configura el observador de redimensionamiento
   * @private
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.echart) {
          this.echart.updateChart();
        }
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  /**
   * Maneja los cambios en la configuración del gráfico
   * @param config Nueva configuración del gráfico
   * @private
   */
  private ngOnConfigChange(config: ChartConfiguration): void {
    this.chartService.updateSeriesConfig(config);
    this.goalChartHelper = new GoalChartHelper(config);

    // Usar requestAnimationFrame para agrupar actualizaciones
    requestAnimationFrame(() => {
      if (this.echart) {
        this.echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  /**
   * Maneja las actualizaciones de datos
   * @private
   */
  private handleDataUpdate(): void {
    const config = this.chartConfiguration();
    if (!config) return; // Guard against null config
    this.chartService.updateChartData(config);

    // Usar requestAnimationFrame para agrupar actualizaciones
    requestAnimationFrame(() => {
      if (this.echart) {
        this.echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  /**
   * Limpieza de recursos al destruir el componente
   */
  public ngOnDestroy(): void {
    // Limpiar el observador de redimensionamiento
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Limpiar referencias
    if (this.mainChart) {
      this.mainChart.dispose();
      this.mainChart = null;
    }
  }

  /**
   * Maneja la selección de una serie en el gráfico
   * @param seriesElement - Serie seleccionada
   */
  public onSelectSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.selectSeries(seriesElement);
    }
  }

  /**
   * Maneja el evento de hover sobre una serie
   * @param seriesElement - Serie sobre la que se hace hover
   */
  public onHoverSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.hoverSeries(seriesElement);
    }
  }

  /**
   * Maneja el cambio en las series del gráfico
   * @param series - Array de series actualizadas
   */
  public onSeriesChange(series: Series[]) {
    this.series.set(series);
  }

  /**
   * Alterna la visualización de la meta en el gráfico
   * @param goal - Objeto Goal que contiene la configuración de la meta
   */
  public toggleShowGoal(goal: Goal) {
    this.showingGoal = !this.showingGoal;
    if (this.showingGoal) {
      this.showGoal(goal);
    } else {
      this.hideGoal();
    }
  }

  /**
   * Muestra la meta en el gráfico
   * @param goal - Objeto Goal que contiene la configuración de la meta
   * @private
   */
  private showGoal(goal: Goal): void {
    const goalChartData = this.goalChartHelper.showGoal(goal);
    if (goalChartData && this.mainChart) {
      const goalSeries = this.echart.getGoalSeries(
        goalChartData,
        goal.chartType
      );
      let isFirstEmission = true;

      // Suscribirse al evento chartUpdated para asegurar que el gráfico se ha actualizado
      const subscription = this.echart.chartUpdated.subscribe(() => {
        if (this.mainChart && isFirstEmission) {
          // Usar requestAnimationFrame para asegurar que estamos fuera del ciclo de renderizado principal
          requestAnimationFrame(() => {
            if (this.mainChart && isFirstEmission) {
              isFirstEmission = false;
              this.mainChart.addSeries(goalSeries);
              subscription.unsubscribe(); // Limpiar la suscripción después de agregar la serie
            }
          });
        }
      });
    }
  }

  /**
   * Oculta la meta del gráfico y restaura la configuración original
   * @private
   */
  private hideGoal() {
    const { savedSeriesConfig, savedFilters } = this.goalChartHelper.hideGoal();
    const config = this.chartConfiguration();
    if (!config) return; // Guard against null config

    // Restaurar la configuración de series guardada
    config.seriesConfig = { ...savedSeriesConfig };

    // Crear una nueva instancia de Filters con los valores guardados
    if (savedFilters) {
      const filters = new Filters();
      filters.rollUp = [...(savedFilters.rollUp || [])];
      filters.filter = [...(savedFilters.filter || [])];
      config.dataset.applyFilters(filters);
    } else {
      // Si no hay filtros guardados, aplicar un objeto Filters vacío
      config.dataset.applyFilters(new Filters());
    }
  }
}
