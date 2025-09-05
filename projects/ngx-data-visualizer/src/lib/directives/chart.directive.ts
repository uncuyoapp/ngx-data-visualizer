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
import { Chart } from "../chart/types/chart";
import { ChartFactory } from "../chart/services/chart-factory.service";
import { ChartOptions, Goal, Series } from "../types/data.types";
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
    private readonly chartFactory: ChartFactory,
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
      const chartConfiguration = this.chartFactory.getChartConfiguration(
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
  toPercentage(): void {
    this._executeOnChart((chart) => chart.togglePercentMode());
  }

  /**
   * Exporta el gráfico actual a un formato específico.
   * @param type Formato de exportación ('svg' o 'jpg').
   * @returns El gráfico en el formato especificado.
   */
  export(type: "svg" | "jpg"): string | void {
    return this._executeOnChart((chart) => chart.export(type));
  }

  /**
   * Alterna la visibilidad de una meta específica en el gráfico.
   * @param goal Objeto Goal que representa la meta a mostrar/ocultar.
   */
  toggleShowGoal(goal: Goal): void {
    // Este método tiene una lógica de validación más simple (solo necesita el componente wrapper),
    // por lo que no utiliza el executor para no sobre-complicarlo.
    if (!this.chartComponent) {
      console.warn("El componente de gráfico no está inicializado.");
      return;
    }
    this.chartComponent.toggleShowGoal(goal);
  }

  /**
   * Ejecuta una acción en la instancia principal del gráfico si está lista.
   * @param action La función a ejecutar con la instancia del gráfico como argumento.
   * @returns El resultado de la función de acción, o `void` si el gráfico no está listo.
   * @private
   */
  private _executeOnChart<T>(action: (chart: Chart) => T): T | void {
    if (this.chartComponent && this.chartComponent.mainChart) {
      return action(this.chartComponent.mainChart);
    }
    console.warn(
      "El componente de gráfico o su instancia principal no están inicializados. Acción omitida.",
    );
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
