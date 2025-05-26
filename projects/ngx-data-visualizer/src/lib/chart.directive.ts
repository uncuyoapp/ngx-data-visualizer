import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
  output,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ChartConfiguration,
  ChartConfigurationOptions,
} from './chart/chart-configuration';
import { ChartComponent } from './chart/chart.component';
import { ChartService } from './chart/chart.service';
import { Dataset } from './dataset';
import { Goal, Series } from './models';

/**
 * Directiva que permite incrustar un gráfico en un componente contenedor.
 * Maneja la creación y configuración del componente de gráfico.
 */
@Directive({
  selector: 'libChart, [libChart]',
  standalone: true,
  exportAs: 'libChart',
})
export class ChartDirective implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  /** Conjunto de datos para el gráfico */
  dataset = input.required<Dataset>();

  /** Opciones de configuración del gráfico */
  options = input.required<ChartConfigurationOptions>();

  /** Evento que se emite cuando cambian las series del gráfico */
  seriesChange = output<Series[]>();

  private chartRenderComponentRef!: ComponentRef<ChartComponent>;
  private chartConfiguration!: ChartConfiguration;

  /** Referencia al componente de gráfico creado */
  chartComponent!: ChartComponent;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly chartService: ChartService
  ) {
    this.initializeChart();
    this.initializeSeriesEffect();
  }

  /**
   * Inicializa el gráfico y configura las suscripciones necesarias
   */
  private initializeChart(): void {
    effect(() => {
      console.log('initializeChart');
      this.createChartComponent();
    });
  }

  /**
   * Inicializa el efecto para las series
   */
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

  /**
   * Crea y configura el componente de gráfico con la configuración actual
   */
  createChartComponent() {
    this.viewContainerRef.clear();
    this.chartConfiguration = this.chartService.getChartConfiguration(
      this.dataset(),
      this.options()
    );

    // Crear el componente
    this.chartRenderComponentRef =
      this.viewContainerRef.createComponent<ChartComponent>(ChartComponent);
    this.chartComponent = this.chartRenderComponentRef.instance;

    // Configurar la entrada usando setInput
    this.chartRenderComponentRef.setInput(
      'chartConfiguration',
      this.chartConfiguration
    );
  }

  /**
   * Cambia la visualización del gráfico a modo porcentual
   */
  toPercentage() {
    this.chartComponent?.mainChart?.togglePercentMode();
  }

  /**
   * Exporta el gráfico actual a un formato específico
   * @param type Formato de exportación ('svg' o 'jpg')
   * @returns El gráfico en el formato especificado
   */
  export(type: 'svg' | 'jpg') {
    return this.chartComponent?.mainChart?.export(type);
  }

  /**
   * Alterna la visibilidad de una meta específica en el gráfico
   * @param goal Objeto Goal que representa la meta a mostrar/ocultar
   */
  toggleShowGoal(goal: Goal) {
    if (this.chartComponent) {
      this.chartComponent.toggleShowGoal(goal);
    }
  }

  /**
   * Limpia los recursos al destruir la directiva
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.viewContainerRef.clear();
  }
}
