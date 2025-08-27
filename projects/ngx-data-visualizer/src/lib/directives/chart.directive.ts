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

/**
 * Directiva que permite incrustar un gráfico en un componente contenedor.
 * Maneja la creación y configuración del componente de gráfico.
 */
@Directive({
  selector: "libChart, [libChart]",
  standalone: true,
  exportAs: "libChart",
})
export class ChartDirective implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /** Conjunto de datos para el gráfico. */
  dataset = input.required<Dataset>();

  /** Opciones de configuración del gráfico. */
  chartOptions = input.required<ChartOptions>();

  /** Evento que se emite cuando cambian las series del gráfico. */
  seriesChange = output<Series[]>();

  private chartRenderComponentRef!: ComponentRef<ChartComponent>;

  /** Referencia al componente de gráfico creado. */
  chartComponent!: ChartComponent;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly chartService: ChartService,
  ) {
    // Crear el componente UNA SOLA VEZ al inicio.
    this.createChartComponent();

    // Reaccionar a los cambios para ACTUALIZAR el componente.
    this.initializeChartUpdates();
    this.initializeSeriesEffect();
  }

  /**
   * Inicializa el efecto para las series.
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
   * Crea y configura el componente de gráfico con la configuración actual.
   */
  private createChartComponent(): void {
    this.viewContainerRef.clear();
    this.chartRenderComponentRef =
      this.viewContainerRef.createComponent<ChartComponent>(ChartComponent);
    this.chartComponent = this.chartRenderComponentRef.instance;
  }

  /**
   * Inicializa las actualizaciones del gráfico cuando los inputs cambian.
   */
  private initializeChartUpdates(): void {
    effect(() => {
      const chartConfiguration = this.chartService.getChartConfiguration(
        this.dataset(),
        this.chartOptions(),
      );
      this.chartRenderComponentRef.setInput(
        "chartConfiguration",
        chartConfiguration,
      );
    });
  }

  /**
   * Cambia la visualización del gráfico a modo porcentual.
   */
  toPercentage() {
    this.chartComponent?.mainChart?.togglePercentMode();
  }

  /**
   * Exporta el gráfico actual a un formato específico.
   * @param type Formato de exportación ('svg' o 'jpg').
   * @returns El gráfico en el formato especificado.
   */
  export(type: "svg" | "jpg") {
    return this.chartComponent?.mainChart?.export(type);
  }

  /**
   * Alterna la visibilidad de una meta específica en el gráfico.
   * @param goal Objeto Goal que representa la meta a mostrar/ocultar.
   */
  toggleShowGoal(goal: Goal) {
    if (this.chartComponent) {
      this.chartComponent.toggleShowGoal(goal);
    }
  }

  /**
   * Limpia los recursos al destruir la directiva.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.viewContainerRef.clear();
  }
}