import { CommonModule } from "@angular/common";
import {
  Component,
  ComponentRef,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  effect,
  inject,
  input,
} from "@angular/core";
import { Subscription } from "rxjs";

import { ChartService } from "../chart/services/chart.service";
import {
  ChartConfiguration,
  ChartOptions,
} from "../chart/types/chart-configuration";
import { Dataset } from "../services/dataset";
import { Dimension } from "../types/data.types";
import { ChartWrapperComponent } from "./components/chart-wrapper/chart-wrapper.component";

/**
 * Componente "orquestador" para la vista de múltiples gráficos.
 * Contiene la lógica principal para gestionar el ciclo de vida de los gráficos hijos.
 * Utiliza una estrategia de "diffing" para añadir, actualizar y eliminar componentes
 * de forma eficiente, en lugar de destruir y recrear toda la vista.
 */
@Component({
  selector: "lib-multiple-chart",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./multiple-chart.component.html",
  styleUrl: "./multiple-chart.component.scss",
})
export class MultipleChartComponent implements OnDestroy {
  /** Conjunto de datos para los gráficos. */
  dataset = input<Dataset>();
  /** Opciones de configuración para los gráficos. */
  options = input<ChartOptions>();
  /** Dimensión que se utilizará para dividir los datos en múltiples gráficos. */
  splitDimension = input<Dimension>();

  /** Ancla en el template donde se inyectarán dinámicamente los componentes de gráfico. */
  @ViewChild("chartHost", { read: ViewContainerRef, static: true })
  private chartHost!: ViewContainerRef;
  /** Referencias a los elementos DOM de los ChartWrapperComponent hijos para scroll. */
  @ViewChildren(ChartWrapperComponent, { read: ElementRef })
  private chartElements!: QueryList<ElementRef>;

  private chartService = inject(ChartService);

  /**
   * Mantiene un registro de los componentes de wrapper activos.
   * La clave es el título del gráfico (asumido único) y el valor es la referencia al componente.
   * Este Map es la fuente de la verdad para saber qué está renderizado.
   */
  private activeChartComponents = new Map<
    string,
    ComponentRef<ChartWrapperComponent>
  >();
  private dataSubscription?: Subscription;
  private navSubscriptions: { unsubscribe: () => void }[] = [];

  constructor() {
    // Efecto principal que reacciona a cualquier cambio en los inputs.
    // Se encarga de disparar la lógica de actualización de gráficos y de suscripción a cambios de datos.
    effect(() => {
      const ds = this.dataset();
      // Solo proceder si el dataset tiene un valor (es un input opcional).
      if (ds) {
        this.updateCharts();
        this.subscribeToDataChanges(ds);
      }
    });
  }

  /**
   * Limpia todas las suscripciones y destruye los componentes hijos al destruir el componente principal.
   */
  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
    this.navSubscriptions.forEach((s) => s.unsubscribe());
    this.clearAllCharts();
  }

  /**
   * Se suscribe a los eventos de actualización del dataset (ej. por filtros).
   * Si el dataset cambia de referencia, se re-suscribe al nuevo.
   * @param dataset El Dataset al que suscribirse.
   */
  private subscribeToDataChanges(dataset: Dataset): void {
    this.dataSubscription?.unsubscribe(); // Limpiar suscripción anterior si existe.
    this.dataSubscription = dataset.dataUpdated.subscribe(() => {
      this.updateCharts(); // Cuando los datos cambian, se actualizan los gráficos.
    });
  }

  /**
   * Lógica central de renderizado y actualización de los gráficos múltiples.
   * Compara el estado actual con el estado deseado y realiza las operaciones
   * mínimas necesarias (añadir, actualizar, eliminar) para optimizar el rendimiento.
   */
  private updateCharts(): void {
    // Salir si el host aún no está disponible (ej. en la primera ejecución del efecto).
    if (!this.chartHost) return;

    const dataset = this.dataset();
    const options = this.options();
    const splitDimension = this.splitDimension();

    // Salir si algún input esencial aún no tiene valor.
    if (!dataset || !options || !splitDimension) {
      this.clearAllCharts();
      return;
    }

    // Obtener la nueva configuración de gráficos a partir del servicio.
    const newConfigurations = this.chartService.getSplitConfiguration(
      dataset,
      options,
      splitDimension,
    );

    // Crear Sets para facilitar la comparación de claves (títulos de gráficos).
    const newChartKeys = new Set(
      newConfigurations.map((c) => c.options.title!),
    );
    const currentChartKeys = new Set(this.activeChartComponents.keys());

    // --- PASO 1: ELIMINAR ---
    // Iterar sobre los componentes actualmente renderizados y destruir aquellos
    // cuyas claves no se encuentran en la nueva configuración.
    for (const key of currentChartKeys) {
      if (!newChartKeys.has(key)) {
        this.activeChartComponents.get(key)?.destroy();
        this.activeChartComponents.delete(key);
      }
    }

    // Limpiar suscripciones de navegación de componentes que podrían ser destruidos
    // o actualizados, para evitar fugas de memoria.
    this.navSubscriptions.forEach((s) => s.unsubscribe());
    this.navSubscriptions = [];

    // --- PASO 2: AÑADIR Y ACTUALIZAR ---
    // Iterar sobre la nueva configuración deseada.
    newConfigurations.forEach((config, index) => {
      const key = config.options.title!;
      const existingComponentRef = this.activeChartComponents.get(key);

      if (existingComponentRef) {
        // Si el componente ya existe, simplemente se actualizan sus inputs.
        // Esto dispara el ciclo de actualización interno del ChartWrapperComponent.
        existingComponentRef.setInput("chartConfiguration", config);
        existingComponentRef.setInput("index", index);
        existingComponentRef.setInput("total", newConfigurations.length);
      } else {
        // Si es un gráfico nuevo, se crea dinámicamente en el host.
        const newComponentRef = this.chartHost.createComponent(
          ChartWrapperComponent,
          { index },
        );
        newComponentRef.setInput("chartConfiguration", config);
        newComponentRef.setInput("index", index);
        newComponentRef.setInput("total", newConfigurations.length);
        this.activeChartComponents.set(key, newComponentRef);

        // Suscribirse a los eventos de navegación del nuevo componente.
        // La suscripción se guarda para ser limpiada en el próximo update o en ngOnDestroy.
        const sub = newComponentRef.instance.navigate.subscribe((direction) => {
          this.handleNavigation(newConfigurations, index, direction);
        });
        this.navSubscriptions.push(sub);
      }
    });
  }

  /**
   * Maneja la lógica de scroll cuando un componente hijo emite un evento de navegación.
   * Busca el componente de destino por su clave y realiza el scroll.
   * @param configs La lista actual de configuraciones de gráficos.
   * @param currentIndex El índice del gráfico que disparó la navegación.
   * @param direction La dirección de la navegación ('previous' o 'next').
   */
  private handleNavigation(
    configs: ChartConfiguration[],
    currentIndex: number,
    direction: "previous" | "next",
  ): void {
    const targetIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;
    // Salir si el índice de destino está fuera de los límites.
    if (targetIndex < 0 || targetIndex >= configs.length) return;

    // Obtener la clave del gráfico de destino para buscar su referencia de componente.
    const targetKey = configs[targetIndex].options.title!;
    const targetComponentRef = this.activeChartComponents.get(targetKey);

    if (targetComponentRef) {
      // Realizar scroll al elemento nativo del componente de destino.
      const targetElement = targetComponentRef.location
        .nativeElement as HTMLElement;
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  /**
   * Destruye todos los componentes hijos actualmente renderizados y limpia el contenedor.
   */
  private clearAllCharts(): void {
    this.chartHost?.clear(); // Limpia los elementos del DOM.
    this.activeChartComponents.clear(); // Limpia el registro interno.
  }
}
