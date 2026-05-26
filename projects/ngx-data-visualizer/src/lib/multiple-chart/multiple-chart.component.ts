import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  computed,
  inject,
  input,
  signal
} from "@angular/core";
import { ChartFactory } from "../chart/services/chart-factory.service";
import { Dataset } from "../services/dataset";
import { ChartOptions, Dimension } from "../types/data.types";
import { injectAutoUpdate } from "../utils/auto-update.helper";
import { ChartWrapperComponent } from "./components/chart-wrapper/chart-wrapper.component";

/**
 * Componente principal orquestador para la vista de múltiples gráficos.
 * 
 * Se mantiene el selector y la exportación retrocompatible para evitar breaking-changes.
 */
@Component({
  selector: "libMultipleChart, [libMultipleChart]",
  standalone: true,
  exportAs: "libMultipleChart",
  imports: [CommonModule, ChartWrapperComponent],
  templateUrl: "./multiple-chart.component.html",
  styleUrl: "./multiple-chart.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleChartComponent implements OnDestroy {
  /** Conjunto de datos para los gráficos. */
  dataset = input.required<Dataset>();

  /** Opciones de configuración para los gráficos. */
  options = input.required<ChartOptions>();

  /** Dimensión que se utilizará para dividir los datos en múltiples gráficos. */
  splitDimension = input.required<Dimension>();

  /** Permite deshabilitar la actualización automática directamente desde el input, teniendo prioridad sobre la configuración. */
  disableAutoUpdate = input<boolean>(false);

  /** Referencias a los elementos DOM de los ChartWrapperComponent hijos para scroll. */
  @ViewChildren(ChartWrapperComponent, { read: ElementRef })
  private chartElements!: QueryList<ElementRef>;

  private readonly chartFactory = inject(ChartFactory);

  /** Señal trigger reactiva para forzar la re-evaluación del computed al actualizar datos. */
  private readonly dataUpdateTrigger = signal<number>(0);

  constructor() {
    // Registrar la suscripción automática para actualizar los gráficos al recibir cambios de datos
    injectAutoUpdate(
      () => this.dataset(),
      () => {
        const customDisable = this.disableAutoUpdate();
        const configDisable = this.options()?.disableAutoUpdate;
        return {
          disableAutoUpdate: customDisable || configDisable
        };
      },
      () => this.dataUpdateTrigger.update((v) => v + 1)
    );
  }

  /**
   * Genera de forma reactiva y declarativa las configuraciones de los gráficos
   * a partir de los inputs recibidos.
   */
  configurations = computed(() => {
    // Dependencia reactiva para enterarse del trigger de actualización
    this.dataUpdateTrigger();

    const ds = this.dataset();
    const opts = this.options();
    const split = this.splitDimension();

    if (!ds || !opts || !split) {
      return [];
    }
    return this.chartFactory.getSplitConfiguration(ds, opts, split);
  });

  /**
   * Maneja la lógica de scroll cuando un componente hijo emite un evento de navegación.
   * @param currentIndex El índice del gráfico que disparó la navegación.
   * @param direction La dirección de la navegación ('previous' o 'next').
   */
  public handleNavigation(currentIndex: number, direction: "previous" | "next"): void {
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const elements = this.chartElements.toArray();

    if (targetIndex >= 0 && targetIndex < elements.length) {
      const targetElement = elements[targetIndex].nativeElement as HTMLElement;
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  ngOnDestroy(): void {
    // Angular limpia automáticamente los efectos reactivos y los componentes declarados en plantilla.
  }
}

/** @deprecated Usar MultipleChartComponent en su lugar. Se mantiene por motivos de retrocompatibilidad. */
export { MultipleChartComponent as MultipleChartDirective };
