import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  input,
  output
} from "@angular/core";
import { ECharts, EChartsOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
import { EventBusService } from "../../services/event-bus.service";
import { EC_SERIES_CONFIG } from "../../types/constants";
import { Series } from "../../types/data.types";
import { VisualizerEventType } from "../../types/visualizer-event.types";
import { Chart } from "../types/chart";
import { ChartConfiguration } from "../types/chart-configuration";
import { ChartData } from "../utils/chart-data";
import { EChart } from "./echarts";

/**
 * @description
 * Opciones de inicialización para la instancia de ECharts.
 */
interface EChartsInitOptions extends EChartsOption {
  locale?: string;
  renderer?: "canvas" | "svg";
}

/**
 * @description
 * Componente wrapper para la librería `ngx-echarts`.
 * Se encarga de la inicialización, renderizado y actualización de un gráfico ECharts.
 * Actúa como un puente entre la lógica de negocio de la librería y la renderización real del gráfico.
 */
@Component({
  standalone: true,
  selector: "lib-app-echarts",
  templateUrl: "./echarts.component.html",
  styleUrls: ["./echarts.component.scss"],
  imports: [NgxEchartsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EchartsComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly eventBus = inject(EventBusService);

  /** Configuración del gráfico que se va a renderizar. */
  public readonly chartConfiguration = input.required<ChartConfiguration>();

  /** Evento emitido cuando las series del gráfico cambian. */
  public readonly seriesChange = output<Series[]>();

  /** Evento emitido cuando la instancia del gráfico ha sido creada. */
  public readonly chartCreated = output<Chart>();

  /** Evento emitido después de que el gráfico se ha actualizado y renderizado. */
  public readonly chartUpdated = output<void>();

  /** Instancia principal del gráfico, encapsulada en la clase `EChart`. */
  public mainChart!: EChart;



  /** Opciones de inicialización para el componente `ngx-echarts`. */
  protected initOptions: EChartsInitOptions = {
    locale: "es",
    renderer: "svg",
    useDirtyRect: false,
    devicePixelRatio:
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  };

  /** ID único para el elemento del DOM del gráfico. */
  public id: string = `echart-${Math.floor(Math.random() * 10000)}`;

  private isDestroyed = false;

  /**
   * @description
   * Ciclo de vida de Angular. Se ejecuta al inicializar el componente.
   * Configura las opciones iniciales y crea el gráfico de forma sincrónica.
   */
  public ngOnInit(): void {
    this.eventBus.emit({
      type: VisualizerEventType.CHART_VIEW_INIT,
      instanceId: this.chartConfiguration()?.instanceId || 'unknown',
      payload: { initOptions: this.initOptions }
    });
    try {
      this.configInitOptions();
      this.createChart();
      this.cdr.markForCheck();
    } catch (error) {
      console.error("Error al inicializar el componente de gráficos:", error);
    }
  }




  /**
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Limpia timers, listeners y destruye la instancia de ECharts para liberar memoria.
   */
  public ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.mainChart?.instance) {
      try {
        this.ngZone.runOutsideAngular(() => {
          this.mainChart.instance.dispose();
        });
      } catch (error) {
        console.warn("Error al destruir la instancia de ECharts:", error);
      } finally {
        this.mainChart = null as unknown as EChart;
      }
    }
  }



  /**
   * @description
   * Configura las opciones de inicialización del gráfico (dimensiones, locale) basándose
   * en la configuración de entrada.
   */
  private configInitOptions(): void {
    try {
      const config = this.chartConfiguration();
      if (!config) return;

      this.initOptions.locale = this.initOptions.locale ?? "es";
    } catch (error) {
      console.error("Error al configurar las opciones del gráfico:", error);
    }
  }

  /**
   * @description
   * Crea la instancia principal del gráfico (`EChart`) y emite el evento `chartCreated`.
   * @throws {Error} Si la configuración del gráfico no está disponible.
   */
  protected createChart(): void {
    try {
      const config = this.chartConfiguration();
      if (!config) {
        throw new Error("La configuración del gráfico no está definida");
      }
      this.mainChart = new EChart(config);
      Promise.resolve().then(() => {
        this.chartCreated.emit(this.mainChart);
      });
    } catch (error) {
      console.error("Error al crear el gráfico:", error);
      throw new Error("No se pudo crear el gráfico");
    }
  }

  /**
   * @description
   * Asigna la instancia de ECharts creada por `ngx-echarts` a la clase `EChart`.
   * Renderiza el gráfico por primera vez y programa la emisión de las series.
   * @param instance La instancia de ECharts creada por la directiva.
   */
  public setChartInstance(instance: ECharts): void {
    if (!instance) return;
    this.eventBus.emit({
      type: VisualizerEventType.CHART_INSTANCE_SET,
      instanceId: this.chartConfiguration()?.instanceId || 'unknown',
      payload: { hasInstance: true }
    });

    try {
      this.mainChart.instance = instance;
      this.setupEChartsEventListeners();

      this.eventBus.emit({
        type: VisualizerEventType.CHART_RENDER_START,
        instanceId: this.chartConfiguration()?.instanceId || 'unknown'
      });
      if (!this.mainChart.hasRendered) {
        this.mainChart.isRendering = true;
        this.mainChart.render();
        this.mainChart.hasRendered = true;
      }
    } catch (error) {
      console.error("Error al establecer la instancia de ECharts:", error);
    }
  }

  /**
   * @description
   * Configura los listeners de eventos de la instancia de ECharts de forma centralizada.
   */
  private setupEChartsEventListeners(): void {
    if (!this.mainChart?.instance) return;

    this.ngZone.runOutsideAngular(() => {
      // Limpiar listeners previos por seguridad antes de añadir nuevos
      this.mainChart.instance.off("finished");
      this.mainChart.instance.off("legendselectchanged");

      let finishedDebounceTimer: ReturnType<typeof setTimeout> | undefined;

      // Listener para el fin del renderizado
      this.mainChart.instance.on("finished", () => {
        this.ngZone.run(() => {
          clearTimeout(finishedDebounceTimer);

          finishedDebounceTimer = setTimeout(() => {
            if (this.isDestroyed) return;

            // Sólo emitir eventos de cierre de ciclo si fue un render explícito
            if (this.mainChart.isRendering) {
              this.chartUpdated.emit();
              this.mainChart.isRendering = false;
              this.emitSeries();

              // Emitir RENDER_COMPLETE cuando ECharts realmente terminó
              this.eventBus.emit({
                type: VisualizerEventType.CHART_RENDER_COMPLETE,
                instanceId: this.chartConfiguration()?.instanceId || 'unknown'
              });
            }
          }, 50);
        });
      });

      // Listener para clics en la leyenda nativa o cambios de selección
      this.mainChart.instance.on("legendselectchanged", () => {
        this.ngZone.run(() => {
          this.emitSeries();
        });
      });
    });
  }



  /**
   * Ejecuta un ciclo de renderizado lógico completo.
   * Si se recibe una nueva configuración, sincroniza el modelo interno antes de renderizar.
   * Regenera la configuración (Layout, Series, Ejes) y aplica setOption.
   */
  public renderChart(config?: ChartConfiguration): void {
    if (!this.mainChart?.instance || !this.mainChart.hasRendered) return;

    // Sincronizar el modelo si se recibe una nueva configuración
    if (config) {
      this.configInitOptions();
      this.mainChart.refreshFromConfiguration(config);
    }

    this.mainChart.isRendering = true;
    try {
      this.mainChart.render();
    } catch (error) {
      console.error("Error al renderizar el gráfico:", error);
      this.mainChart.isRendering = false;
    }
  }

  /**
   * @description
   * Obtiene las series actuales del gráfico, las formatea y emite el evento `seriesChange`.
   */
  public emitSeries(): void {
    if (this.isDestroyed || !this.mainChart?.instance || this.mainChart.isRendering) {
      return;
    }
    try {
      const series = this.mainChart.getSeries();
      const chartType = this.chartConfiguration().options.type;

      if (Array.isArray(series) && series.length > 0) {
        let typedSeries: Series[] = [];

        if (chartType === "pie") {
          // Para gráficos de torta, emitimos cada rebanada como una "serie virtual" 
          // para que la leyenda pueda mostrarlas individualmente.
          const pieSeries = series[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typedSeries = ((pieSeries.data || []) as any[]).map((d: any, dataIndex: number) => ({
            name: d.name || "",
            color: this.getSafeColor({ seriesIndex: 0, dataIndex }, "#000000"),
            visible: true,
            data: [d.value],
          }));
        } else {
          typedSeries = series.map((s, seriesIndex) => ({
            name: s.name || "",
            color: this.getSafeColor({ seriesIndex }, s.color || "#000000"),
            visible: s.visible ?? true,
            data: s.data || [],
          }));
        }

        requestAnimationFrame(() => {
          if (!this.isDestroyed) {
            this.eventBus.emit({
              type: VisualizerEventType.CHART_EMIT_SERIES,
              instanceId: this.chartConfiguration()?.instanceId || 'unknown',
              payload: { seriesCount: typedSeries.length, seriesNames: typedSeries.map(s => s.name) }
            });
            this.seriesChange.emit(typedSeries);
          }
        });
      }
    } catch (error) {
      console.error("Error al obtener series del gráfico:", error);
    }
  }

  /**
   * @description
   * Intenta obtener el color de una serie o ítem de forma segura.
   * Maneja errores potenciales si ECharts aún no ha inicializado sus modelos internos.
   * @param finder El objeto selector para ECharts (seriesIndex, dataIndex).
   * @param fallbackColor Color a retornar en caso de error o si no se encuentra el visual.
   * @returns El color en formato string.
   */
  private getSafeColor(finder: object, fallbackColor: string): string {
    try {
      if (!this.mainChart?.instance) return fallbackColor;
      const instance = this.mainChart.instance as unknown as { getVisual?: (finder: object, visual: string) => string };
      return instance.getVisual?.(finder, "color") || fallbackColor;
    } catch {
      return fallbackColor;
    }
  }

  /**
   * @description
   * Genera una serie especial para representar una "meta" en el gráfico.
   * @param chartData Los datos específicos para la serie de meta.
   * @param chartType El tipo de gráfico a usar para la meta (ej. 'line', 'bar').
   * @returns Un objeto de tipo `Series` configurado para la meta.
   * @throws {Error} Si `chartData` no se proporciona.
   */
  public getGoalSeries(chartData: ChartData, chartType: string): Series {
    if (!chartData) {
      throw new Error("El parámetro chartData es requerido");
    }
    try {
      const data = chartData.dataProvider.getData();
      const goalData = data.map((row) => {
        const value = row["valor"];
        return typeof value === "number" ? value : 0;
      });
      const seriesType = chartType === "column" ? "bar" : chartType;
      const goalSeries: Series = {
        name: "Meta",
        color: "black",
        visible: true,
        data: goalData,
        smooth: true,
        stacking: undefined,
        chartType: chartType,
        type: seriesType,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: "dashed",
        },
        isReferenceSeries: true,
      };
      type SeriesType = keyof typeof EC_SERIES_CONFIG;
      if (seriesType in EC_SERIES_CONFIG) {
        Object.assign(goalSeries, EC_SERIES_CONFIG[seriesType as SeriesType]);
      }
      return goalSeries;
    } catch (error) {
      console.error("Error al generar la serie de meta:", error);
      throw new Error("No se pudo generar la serie de meta");
    }
  }
}
