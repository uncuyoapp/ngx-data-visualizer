import { CommonModule, NgComponentOutlet } from "@angular/common";
import { Component, effect, input } from "@angular/core";

import { ChartConfiguration } from "../chart/types/chart-configuration";
import { ChartComponent } from "../chart/chart.component";
import { BackComponent } from "../icons/back/back.component";
import { ContractComponent } from "../icons/contract/contract.component";
import { ExpandComponent } from "../icons/expand/expand.component";
import { ForwardComponent } from "../icons/forward/forward.component";

/**
 * Genera un ID único para evitar colisiones entre instancias
 */
function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Componente que muestra múltiples gráficos en un contenedor con navegación
 * Permite expandir/contraer y navegar entre los gráficos
 */
@Component({
  selector: "lib-multiple-chart",
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    ForwardComponent,
    BackComponent,
    ExpandComponent,
    ContractComponent,
  ],
  templateUrl: "./multiple-chart.component.html",
  styleUrl: "./multiple-chart.component.scss",
})
export class MultipleChartComponent {
  /** Configuraciones de los gráficos a mostrar */
  chartConfigurations = input.required<ChartConfiguration[]>();

  /** Referencia al componente de gráfico que se renderizará */
  chartComponent = ChartComponent;

  /** ID único de la instancia del componente para evitar colisiones */
  private readonly instanceId = generateUniqueId();

  /** Mapa de IDs únicos para cada chart item */
  private chartItemIds = new Map<number, string>();

  /**
   * Efecto que se ejecuta cuando cambian las configuraciones de los gráficos
   * Asegura que todas las configuraciones tengan la propiedad expanded definida
   */
  private readonly configEffect = effect(() => {
    const configs = this.chartConfigurations();

    if (configs) {
      // Limpiar IDs previos
      this.chartItemIds.clear();

      configs.forEach((config, index) => {
        config.expanded ??= false;
        // Generar ID único para cada chart item
        this.chartItemIds.set(index, `chartItem-${this.instanceId}-${index}`);
      });
    }
  });

  /**
   * Obtiene el ID único para un chart item específico
   * @param index Índice del chart item
   * @returns ID único del chart item
   */
  getChartItemId(index: number): string {
    return (
      this.chartItemIds.get(index) || `chartItem-${this.instanceId}-${index}`
    );
  }

  /**
   * Expande o contrae un elemento de gráfico
   * @param element Elemento HTML que contiene el gráfico
   * @param config Configuración del gráfico que se está expandiendo/contrayendo
   */
  expandChartItem(element: HTMLDivElement, config: ChartConfiguration): void {
    const wasExpanded = element.classList.contains("expanded");

    if (wasExpanded) {
      element.classList.remove("expanded");
      config.expanded = false;
    } else {
      element.classList.add("expanded");
      config.expanded = true;
    }

    // Scroll mejorado con timing apropiado para las transiciones CSS
    setTimeout(
      () => {
        this.scrollToElement(element, !wasExpanded);
      },
      wasExpanded ? 350 : 350,
    );
  }

  /**
   * Desplaza la vista al elemento de gráfico especificado
   * @param id Identificador del elemento al que se debe desplazar la vista
   */
  moveToChartItem(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      this.scrollToElement(element, false);
    }
  }

  /**
   * Realiza scroll suave a un elemento con opciones optimizadas
   * @param element Elemento al que hacer scroll
   * @param isExpanding Si el elemento se está expandiendo
   */
  private scrollToElement(element: HTMLElement, isExpanding: boolean): void {
    const isMobile =
      window.matchMedia("(max-width: 576px)").matches ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (isMobile || isExpanding) {
      // En mobile o al expandir, centrar el elemento
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    } else {
      // En desktop normal, scroll suave al inicio
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
}
