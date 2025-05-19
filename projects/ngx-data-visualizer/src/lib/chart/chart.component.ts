import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  input,
  signal,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import {
  DIMENSION_VALUE,
  DIMENSION_YEAR,
  DataProvider,
} from '../data-provider';
import { Filters, Goal, Series } from '../models';
import { LegendComponent } from '../legend/legend.component';
import { Chart } from './chart';
import { ChartConfiguration, SeriesConfig } from './chart-configuration';
import { ChartData } from './chart-data';
import { ChartService } from './chart.service';
import { EchartsComponent } from './echart/echarts.component';

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
export class ChartComponent implements OnInit, OnDestroy {
  // Inyección de dependencias
  private readonly chartService = inject(ChartService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  // Inputs y referencias
  chartConfiguration = input.required<ChartConfiguration>();
  series = signal<Series[]>([]);

  @ViewChild(EchartsComponent, { static: true })
  private echart!: EchartsComponent;

  mainChart!: Chart;
  showingGoal = false;

  // Estado interno
  private savedSeriesConfiguration!: SeriesConfig;
  private savedFilters!: Filters;
  private goalChartData!: ChartData;
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Efecto reactivo que se dispara cuando cambia la configuración del gráfico
   */
  private readonly configEffect = effect(() => {
    const config = this.chartConfiguration();
    if (config && this.echart) {
      this.ngOnConfigChange(config);
    }
  });

  /**
   * Inicialización del componente
   */
  public ngOnInit(): void {
    this.setupAutoUpdate();
    this.setupResizeObserver();
  }

  /**
   * Configura la actualización automática del gráfico cuando cambian los datos
   * @private
   */
  private setupAutoUpdate(): void {
    const config = this.chartConfiguration();

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
    this.chartService.updateSeriesConfig(config);

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
      this.mainChart = null as any;
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
    this.mainChart.hoverSeries(seriesElement);
  }

  onSeriesChange(series: Series[]) {
    this.series.set(series);
  }

  toggleShowGoal(goal: Goal) {
    this.showingGoal = !this.showingGoal;
    if (this.showingGoal) {
      console.log('Series antes de mostrar meta:', this.mainChart?.getSeries());
      this.showGoal(goal);
    } else {
      console.log('Series antes de ocultar meta:', this.mainChart?.getSeries());
      this.hideGoal();
    }
  }

  public showGoal(goal: Goal): void {
    console.log('Iniciando showGoal con meta:', goal);
    if (!goal) {
      console.warn('No se proporcionó una meta válida');
      return;
    }

    try {
      console.log('Generando goalChartData...');
      this.generateGoalChartData(goal);
      console.log('goalChartData generado:', this.goalChartData);

      if (!this.goalChartData) {
        console.warn('No se pudo generar los datos de meta');
        return;
      }

      console.log('Actualizando configuración de series...');
      this.updateSeriesConfig(this.goalChartData.seriesConfig);
      console.log('Suscribiéndose a dataUpdated...');

      // Suscribirse al evento dataUpdated para asegurar que los datos se han actualizado
      const subscription = this.chartConfiguration().dataset.dataUpdated
        .pipe(take(1)) // Tomar solo la primera emisión
        .subscribe((updated) => {
          console.log('Datos actualizados:', updated);
          if (this.mainChart) {
            console.log('Generando serie de meta...');
            const goalSeries = this.echart.getGoalSeries(this.goalChartData, goal.chartType);
            console.log('Serie de meta generada:', goalSeries);
            this.mainChart.addSeries(goalSeries);
            console.log('Serie de meta agregada al gráfico');
          } else {
            console.warn('No hay instancia de EChart disponible');
          }
          subscription.unsubscribe(); // Limpiar la suscripción
        });
    } catch (error) {
      console.error('Error al mostrar la meta:', error);
    }
  }

  private hideGoal() {
    const { savedSeriesConfiguration, savedFilters } = this;
    const config = this.chartConfiguration();

    // Restaurar la configuración de series guardada
    config.seriesConfig = { ...savedSeriesConfiguration };

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

  private generateGoalChartData(goal: Goal) {
    console.log('Generando datos de meta con:', goal);
    const dataProvider = new DataProvider();
    dataProvider.setData(goal.data);
    const goalDimensions = dataProvider
      .getDimensionsNames()
      .filter((dim) => dim !== DIMENSION_VALUE && dim !== DIMENSION_YEAR);
    const seriesConfig: SeriesConfig = {
      x1: DIMENSION_YEAR,
      x2: goalDimensions.length ? goalDimensions[0] : undefined,
      stack: null,
      measure: this.chartConfiguration().seriesConfig.measure,
    };

    this.goalChartData = new ChartData(dataProvider, seriesConfig);
    console.log('Datos de meta generados:', this.goalChartData);
  }

  private updateSeriesConfig(seriesConfig: SeriesConfig) {
    console.log('Actualizando configuración de series con:', seriesConfig);
    const chartConfiguration = this.chartConfiguration();
    const { dataset } = chartConfiguration;
    const { dimensions } = dataset;

    // Crear una nueva instancia de Filters
    const filters = new Filters();

    // Configurar rollUp con las dimensiones que no son x1 ni x2
    filters.rollUp = dimensions
      .filter(
        (dimension) =>
          dimension.nameView !== seriesConfig.x1 &&
          dimension.nameView !== seriesConfig.x2
      )
      .map((dimension) => dimension.nameView);

    console.log('Filtros configurados:', filters);

    // Guardar la configuración actual
    this.savedSeriesConfiguration = { ...chartConfiguration.seriesConfig };
    console.log('Configuración guardada:', this.savedSeriesConfiguration);

    // Guardar una copia de los filtros actuales
    if (dataset.dataProvider.filters) {
      this.savedFilters = new Filters();
      this.savedFilters.rollUp = [...(dataset.dataProvider.filters.rollUp || [])];
      this.savedFilters.filter = [...(dataset.dataProvider.filters.filter || [])];
    } else {
      this.savedFilters = new Filters();
    }
    console.log('Filtros guardados:', this.savedFilters);

    // Actualizar la configuración de series y aplicar los filtros
    chartConfiguration.seriesConfig = seriesConfig;
    console.log('Nueva configuración de series:', chartConfiguration.seriesConfig);

    // Aplicar los filtros y forzar una actualización
    dataset.applyFilters(filters);
    console.log('Filtros aplicados, forzando actualización...');

    // Forzar una actualización de datos con el valor booleano correcto
    dataset.dataUpdated.next(true);
  }
}
