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
 * Componente que muestra múltiples gráficos con navegación responsive
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

  /** ID único de la instancia del componente */
  private readonly instanceId = generateUniqueId();

  /** Mapa de IDs únicos para cada chart item */
  private chartItemIds = new Map<number, string>();

  /**
   * Efecto que inicializa las configuraciones
   */
  private readonly configEffect = effect(() => {
    const configs = this.chartConfigurations();

    if (configs) {
      this.chartItemIds.clear();
      configs.forEach((config, index) => {
        config.expanded ??= false;
        this.chartItemIds.set(index, `chartItem-${this.instanceId}-${index}`);
      });
    }
  });

  /**
   * Obtiene el ID único para un chart item específico
   */
  getChartItemId(index: number): string {
    return (
      this.chartItemIds.get(index) || `chartItem-${this.instanceId}-${index}`
    );
  }

  /**
   * Expande o contrae un elemento de gráfico
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

    // Scroll suave al elemento
    setTimeout(() => {
      this.scrollToElement(element);
    }, 300);
  }

  /**
   * Navega al gráfico especificado
   */
  moveToChartItem(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      this.scrollToElement(element);
    }
  }

  /**
   * Realiza scroll al elemento especificado
   */
  private scrollToElement(element: HTMLElement): void {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}
