import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  inject,
  input,
} from "@angular/core";
import { ChartOptions } from "../chart/types/chart-configuration";
import { MultipleChartComponent } from "../multiple-chart/multiple-chart.component";
import { Dataset } from "../services/dataset";
import { Dimension } from "../types/data.types";

/**
 * Directiva "lanzadora" para la funcionalidad de múltiples gráficos.
 * Su única responsabilidad es crear el MultipleChartComponent y mantener
 * sus inputs actualizados de forma reactiva.
 */
@Directive({
  selector: "libMultipleChart, [libMultipleChart]",
  standalone: true,
  exportAs: "libMultipleChart",
})
export class MultipleChartDirective implements OnDestroy {
  /** Conjunto de datos para los gráficos. */
  dataset = input.required<Dataset>();
  /** Opciones de configuración para los gráficos. */
  options = input.required<ChartOptions>();
  /** Dimensión que se utilizará para dividir los datos en múltiples gráficos. */
  splitDimension = input.required<Dimension>();

  private readonly viewContainerRef = inject(ViewContainerRef);
  private componentRef: ComponentRef<MultipleChartComponent>;

  constructor() {
    // Crear el componente hijo una sola vez.
    this.viewContainerRef.clear();
    this.componentRef = this.viewContainerRef.createComponent(
      MultipleChartComponent,
    );

    // Usar un efecto para mantener los inputs del componente hijo sincronizados
    // con los inputs de la directiva. Este es un patrón de "passthrough" reactivo.
    effect(() => {
      this.componentRef.setInput("dataset", this.dataset());
      this.componentRef.setInput("options", this.options());
      this.componentRef.setInput("splitDimension", this.splitDimension());
    });
  }

  /**
   * Limpia los recursos al destruir la directiva.
   */
  ngOnDestroy(): void {
    // No hay suscripciones directas que limpiar aquí, ya que el efecto se limpia automáticamente.
    // El componente hijo (MultipleChartComponent) es responsable de su propia limpieza.
    this.viewContainerRef.clear();
  }
}
