import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
} from "@angular/core";
import { Subject, Subscription, takeUntil } from "rxjs";
import { ChartConfiguration, ChartOptions } from "../../public-api";
import { ChartService } from "../chart/services/chart.service";
import { Dataset } from "../services/dataset";
import { MultipleChartComponent } from "../multiple-chart/multiple-chart.component";
import { Dimension } from "../types/data.types";

/**
 * Directiva que permite mostrar múltiples gráficos basados en una dimensión de división.
 * Crea un gráfico separado para cada valor único en la dimensión especificada.
 */
@Directive({
  selector: "libMultipleChart, [libMultipleChart]",
  standalone: true,
  exportAs: "libMultipleChart",
})
export class MultipleChartDirective implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  /** Conjunto de datos para los gráficos */
  dataset = input.required<Dataset>();

  /** Opciones de configuración para los gráficos */
  options = input.required<ChartOptions>();

  /** Dimensión que se utilizará para dividir los datos en múltiples gráficos */
  splitDimension = input.required<Dimension>();

  private multipleChartRenderComponentRef!: ComponentRef<MultipleChartComponent>;
  private multipleChartComponent!: MultipleChartComponent;

  /** Configuración de los gráficos múltiples */
  private multipleChartConfiguration!: ChartConfiguration[];

  /** Suscripción para cambios en los datos */
  subscription!: Subscription;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly chartService: ChartService,
  ) {
    this.initializeMultipleCharts();
  }

  /**
   * Inicializa los gráficos múltiples y configura las suscripciones necesarias
   */
  private initializeMultipleCharts(): void {
    effect(() => {
      const dataset = this.dataset();
      this.createMultipleChartComponent();

      // Limpiar suscripción anterior si existe
      this.cleanupSubscription();

      // Configurar nueva suscripción a cambios en los datos
      if (dataset) {
        this.subscription = dataset.dataUpdated
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.createMultipleChartComponent());
      }
    });
  }

  /**
   * Limpia la suscripción actual si existe
   */
  private cleanupSubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null!;
    }
  }

  /**
   * Crea y configura los componentes de gráficos múltiples
   * basados en la dimensión de división especificada
   */
  createMultipleChartComponent(): void {
    try {
      // Limpiar el contenedor de manera segura
      try {
        this.viewContainerRef.clear();
      } catch (error) {
        console.warn("Error al limpiar el contenedor:", error);
      }

      const dataset = this.dataset();
      const options = this.options();
      const splitDimension = this.splitDimension();

      if (!dataset || !options || !splitDimension) {
        console.warn(
          "No se pueden crear los gráficos: datos de entrada incompletos",
        );
        return;
      }

      // Crear el componente
      this.multipleChartRenderComponentRef =
        this.viewContainerRef.createComponent<MultipleChartComponent>(
          MultipleChartComponent,
        );

      this.multipleChartComponent =
        this.multipleChartRenderComponentRef.instance;

      // Obtener la configuración de gráficos múltiples
      this.multipleChartConfiguration = this.chartService.getSplitConfiguration(
        dataset,
        options,
        splitDimension,
      );

      // Configurar la entrada usando setInput
      this.multipleChartRenderComponentRef.setInput(
        "chartConfigurations",
        this.multipleChartConfiguration,
      );
    } catch (error) {
      console.error("Error al crear los gráficos múltiples:", error);
      // Intentar limpiar el contenedor de manera segura
      try {
        this.viewContainerRef.clear();
      } catch (cleanupError) {
        console.warn(
          "Error al limpiar el contenedor después del error:",
          cleanupError,
        );
      }
    }
  }

  /**
   * Limpia los recursos al destruir la directiva
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupSubscription();
    this.viewContainerRef.clear();
  }
}
