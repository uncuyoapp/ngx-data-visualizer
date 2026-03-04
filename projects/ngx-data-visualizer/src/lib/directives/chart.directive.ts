import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
  output,
  signal,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";
import { ChartComponent } from "../chart/chart.component";
import { Chart } from "../chart/types/chart";
import { ChartFactory } from "../chart/services/chart-factory.service";
import { ChartOptions, Goal, Series } from "../types/data.types";
import { Dataset } from "../services/dataset";
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

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
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly chartFactory = inject(ChartFactory);
  private readonly overlay = inject(Overlay);

  /** Conjunto de datos para el gráfico. */
  dataset = input.required<Dataset>();

  /** Opciones de configuración del gráfico. */
  chartOptions = input.required<ChartOptions>();

  /** Evento que se emite cuando cambian las series del gráfico. */
  seriesChange = output<Series[]>();

  /** Instancia del componente de gráfico renderizado */
  private chartRenderComponentRef!: ComponentRef<ChartComponent>;

  /** Referencia al componente del editor de configuración */
  private configEditorComponentRef?: ComponentRef<any>;

  /** Referencia al overlay de CDK para el editor */
  private overlayRef?: OverlayRef;

  /** Referencia al componente de gráfico creado. */
  public chartComponent!: ChartComponent;

  /** Opciones internas "en vivo" para el gráfico */
  internalOptions = signal<ChartOptions | null>(null);

  /** Indica si se debe mostrar el editor de configuración */
  enableEditor = input<boolean>(false);

  /** Evento que emite los cambios en la configuración */
  optionsChange = output<ChartOptions>();

  /** Evento que emite cuando la configuración cambia desde el editor */
  onConfigChange = output<ChartOptions>();

  /** Evento que emite cuando se cierra el editor */
  close = output<void>();

  /**
   * Inicializa la directiva, configurando la creación del gráfico y sus actualizaciones.
   */
  constructor() {
    // Sincronizar internalOptions cuando el input chartOptions cambie desde afuera
    effect(() => {
      this.internalOptions.set(this.chartOptions());
    }, { allowSignalWrites: true });

    // Crear el componente UNA SOLA VEZ al inicio.
    this.createChartComponent();

    // Reaccionar a los cambios para ACTUALIZAR el componente.
    this.initializeChartUpdates();
    this.initializeSeriesEffect();
  }

  /**
   * Alterna la visibilidad del editor de configuración.
   */
  public toggleEditor(): void {
    if (this.overlayRef) {
      this.destroyEditorComponent();
    } else {
      this.createEditorComponent();
    }
  }



  /**
   * Crea dinámicamente el componente del editor usando Overlay
   */
  private async createEditorComponent() {
    if (this.overlayRef) return;

    const { ChartConfigEditorComponent } = await import('../config-editor/chart-config-editor/chart-config-editor.component');

    // Crear el overlay
    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.chartComponent.configToggleButton()!.nativeElement)
        .withPush(false)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'top',
            offsetX: -12
          }
        ])
    });

    const portal = new ComponentPortal(ChartConfigEditorComponent);
    this.configEditorComponentRef = this.overlayRef.attach(portal);

    this.configEditorComponentRef.setInput('dataset', this.dataset());
    this.configEditorComponentRef.setInput('options', this.internalOptions());

    this.configEditorComponentRef.instance.optionsChange
      .subscribe((newOptions: ChartOptions) => {
        // Actualizar estado interno para impacto inmediato (Live Preview)
        this.internalOptions.set(newOptions);
        this.optionsChange.emit(newOptions);
        this.onConfigChange.emit(newOptions);
      });

    this.configEditorComponentRef.instance.close
      .subscribe(() => {
        this.close.emit();
        this.destroyEditorComponent();
      });
  }

  /**
   * Destruye el componente del editor y limpia el overlay.
   * @private
   */
  private destroyEditorComponent() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.configEditorComponentRef = undefined;
    }
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
      const options = this.internalOptions();
      if (!options) return;

      const chartConfiguration = this.chartFactory.getChartConfiguration(
        this.dataset(),
        options,
      );
      this.chartRenderComponentRef.setInput(
        "chartConfiguration",
        chartConfiguration,
      );
      this.chartRenderComponentRef.setInput("showConfigToggle", this.enableEditor());

      if (this.configEditorComponentRef) {
        this.configEditorComponentRef.setInput('options', options);
        this.configEditorComponentRef.setInput('dataset', this.dataset());
      }
    });

    // Escuchar el evento de alternancia de configuración
    this.chartComponent.toggleConfig.subscribe(() => {
      this.toggleEditor();
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
    this.viewContainerRef.clear();
  }
}
