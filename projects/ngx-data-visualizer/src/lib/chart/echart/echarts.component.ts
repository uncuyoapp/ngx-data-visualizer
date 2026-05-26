import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  NgZone,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal
} from "@angular/core";
import { ECharts, EChartsOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
import { EC_SERIES_CONFIG } from "../../types/constants";
import { Series } from "../../types/data.types";
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
  width?: number | string;
  height?: number | string;
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
export class EchartsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Configuración del gráfico que se va a renderizar. */
  public readonly chartConfiguration = input.required<ChartConfiguration>();

  /** Evento emitido cuando las series del gráfico cambian. */
  public readonly seriesChange = output<Series[]>();

  /** Evento emitido cuando la instancia del gráfico ha sido creada. */
  public readonly chartCreated = output<Chart>();

  /** Evento emitido después de que el gráfico se ha actualizado y renderizado. */
  public readonly chartUpdated = output<void>();

  /** Instancia principal del gráfico, encapsulada en la clase `EChart`. */
  protected mainChart!: EChart;

  public chartHeight = signal<string>("100%");
  public chartWidth = signal<string>("100%");

  /** Señal que indica si el contenedor tiene dimensiones válidas para renderizar el gráfico. */
  public isReady = signal<boolean>(false);

  @HostBinding("style.height")
  get hostHeight(): string {
    return this.chartHeight();
  }

  @HostBinding("style.width")
  get hostWidth(): string {
    return this.chartWidth();
  }

  /** Opciones de inicialización para el componente `ngx-echarts`. */
  protected initOptions: EChartsInitOptions = {
    locale: "es",
    renderer: "svg",
    useDirtyRect: false,
    devicePixelRatio:
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  };

  /** ID único para el elemento del DOM del gráfico. */
  public id: string = `echart-${Math.floor(Math.random() * 10000)}`;

  private isDestroyed = false;
  private seriesEmissionTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly EMIT_DEBOUNCE = 100;
  private readonly RESIZE_DEBOUNCE = 150;

  /**
   * @description
   * Ciclo de vida de Angular. Se ejecuta al inicializar el componente.
   * Configura las opciones, crea el gráfico y establece listeners para el redimensionamiento.
   */
  public ngOnInit(): void {
    try {
      this.configInitOptions();
      // Pequeño retraso para asegurar que los estilos del Host (min-height) se apliquen al DOM
      // antes de que ngx-echarts intente inicializarse.
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.createChart();
          this.cdr.markForCheck();
        }
      }, 0);
      this.setupResizeListener();
    } catch (error) {
      console.error("Error al inicializar el componente de gráficos:", error);
    }
  }

  public ngAfterViewInit(): void {
    // Primera comprobación de dimensiones al inicializar la vista
    this.updateChart();

    // Re-intento preventivo por si el layout flexbox tarda en asentarse
    if (!this.isReady()) {
      setTimeout(() => this.updateChart(), 50);
      setTimeout(() => this.updateChart(), 300);
    }
  }

  /**
   * Efecto para reaccionar a cambios en la configuración y actualizar el gráfico
   */
  private readonly configUpdateEffect = effect(() => {
    const config = this.chartConfiguration();
    if (this.mainChart && config) {
      this.configInitOptions();
      // Sincronizar la configuración interna del gráfico de manera profunda
      this.mainChart.refreshFromConfiguration(config);
      // Solicitar redibujado
      this.updateChart();
    }
  }, { allowSignalWrites: true });

  /**
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Limpia timers, listeners y destruye la instancia de ECharts para liberar memoria.
   */
  public ngOnDestroy(): void {
    this.isDestroyed = true;
    this.cleanupSeriesEmissionTimer();
    this.cleanupResizeListener();
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

      const parent = this.elementRef.nativeElement.parentElement;
      const parentHeight = parent?.clientHeight || 0;
      const parentWidth = parent?.clientWidth || 0;

      // Configuración de altura
      if (config.options.height !== undefined && config.options.height !== null) {
        const height = typeof config.options.height === "number"
          ? `${config.options.height}px`
          : config.options.height;
        this.chartHeight.set(height);
        this.initOptions.height = height;
      } else {
        this.chartHeight.set("100%");
        delete this.initOptions.height;
      }

      // Configuración de ancho
      if (config.options.width !== undefined && config.options.width !== null) {
        const width = typeof config.options.width === "number"
          ? `${config.options.width}px`
          : config.options.width;
        this.chartWidth.set(width);
        this.initOptions.width = width;
      } else {
        this.chartWidth.set("100%");
        delete this.initOptions.width;
      }

      this.initOptions.locale = this.initOptions.locale ?? "es";

      // Configuración de tooltips
      if (config.libraryOptions) {
        config.libraryOptions['tooltip'] = {
          ...(config.libraryOptions['tooltip'] as any),
          confine: true,
          appendTo: 'body'
        };
      }
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

    try {
      this.mainChart.instance = instance;
      this.setupEChartsEventListeners();

      const container = this.elementRef.nativeElement;
      const config = this.chartConfiguration();
      const isResponsive = config.options.height === null || config.options.height === undefined;

      // Si es responsivo, nos aseguramos de que los signals estén en 100% 
      // para que el CSS del contenedor controle el tamaño real.
      if (isResponsive) {
        this.chartHeight.set("100%");
        this.chartWidth.set("100%");
      }

      if (!this.mainChart.hasRendered) {
        this.mainChart.render();
        this.mainChart.hasRendered = true;
        // Forzar un resize después de que el DOM se haya estabilizado
        setTimeout(() => {
          if (this.mainChart?.instance) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width > 0 && height > 0) {
              this.mainChart.instance.resize({ width, height });
            }
          }
        }, 100);
      }
      this.scheduleSeriesEmission(100);
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

      // Listener para el fin del renderizado
      this.mainChart.instance.on("finished", () => {
        this.ngZone.run(() => {
          this.cleanupSeriesEmissionTimer();
          this.chartUpdated.emit();
          this.mainChart.isRendering = false;
          this.emitSeries();
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
   * @description
   * Actualiza y redibuja el gráfico. Se asegura de que la instancia exista y
   * gestiona el estado de renderizado para evitar llamadas concurrentes.
   */
  public updateChart(): void {
    if (!this.mainChart) {
      return;
    }

    const container = this.elementRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Si aún no estamos listos, comprobamos si ya tenemos dimensiones para arrancar
    if (!this.isReady()) {
      if (width > 0 && height > 0) {
        // Inyectamos las dimensiones actuales en initOptions para que ECharts
        // no tenga que medir el DOM en el primer renderizado (evita el warning).
        this.initOptions.width = `${width}px`;
        this.initOptions.height = `${height}px`;

        this.isReady.set(true);
        // Devolvemos porque el *ngIf creará el div y disparará setChartInstance por su cuenta
      }
      return;
    }

    if (!this.mainChart.hasRendered) {
      return;
    }

    try {
      this.mainChart.isRendering = true;
      if (this.mainChart.instance) {
        // Solo redimensionamos si tenemos dimensiones válidas (> 0)
        if (width > 0 && height > 0) {
          this.mainChart.instance.resize({
            width: width,
            height: height
          });
        }
      }
      this.mainChart.render();
      // El evento 'finished' (configurado en setupEChartsEventListeners) 
      // se encargará de emitir las series y limpiar el estado.
      this.scheduleSeriesEmission();
    } catch (error) {
      console.error("Error al actualizar el gráfico:", error);
      this.mainChart.isRendering = false;
    }
  }

  /**
   * @description
   * Programa la emisión de las series del gráfico con un debounce para evitar
   * emisiones excesivas durante actualizaciones rápidas.
   * @param delay El tiempo de espera en milisegundos.
   */
  private scheduleSeriesEmission(delay: number = this.EMIT_DEBOUNCE): void {
    if (this.isDestroyed) {
      return;
    }
    this.cleanupSeriesEmissionTimer();
    this.ngZone.runOutsideAngular(() => {
      this.seriesEmissionTimer = setTimeout(() => {
        if (!this.isDestroyed) {
          this.ngZone.run(() => this.emitSeries());
        }
      }, delay);
    });
  }

  /**
   * @description
   * Limpia el temporizador de emisión de series si existe.
   */
  private cleanupSeriesEmissionTimer(): void {
    if (this.seriesEmissionTimer) {
      clearTimeout(this.seriesEmissionTimer);
      this.seriesEmissionTimer = null;
    }
  }

  /**
   * @description
   * Añade un listener al evento `resize` de la ventana para redimensionar el gráfico.
   * Se ejecuta fuera de la zona de Angular para mejorar el rendimiento.
   */
  private setupResizeListener(): void {
    if (typeof window !== "undefined") {
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener("resize", this.handleResize);
      });
    }
  }


  /**
   * @description
   * Limpia el listener de `resize` y el temporizador asociado.
   */
  private cleanupResizeListener(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleResize);
    }
    this.cleanupResizeTimer();
  }

  /**
   * @description
   * Limpia el temporizador de redimensionamiento si existe.
   */
  private cleanupResizeTimer(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  }

  /**
   * @description
   * Manejador del evento `resize`. Redimensiona el gráfico con un debounce
   * para evitar llamadas excesivas.
   */
  private readonly handleResize = (): void => {
    if (this.isDestroyed || !this.mainChart?.instance) {
      return;
    }
    this.cleanupResizeTimer();
    this.resizeTimer = setTimeout(() => {
      if (this.mainChart?.instance) {
        this.ngZone.runOutsideAngular(() => {
          this.mainChart.instance.resize({
            animation: {
              duration: 300,
            },
          });
        });
      }
    }, this.RESIZE_DEBOUNCE);
  };

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
          typedSeries = (pieSeries.data as any[]).map((d: any, dataIndex: number) => ({
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
  private getSafeColor(finder: any, fallbackColor: string): string {
    try {
      if (!this.mainChart?.instance) return fallbackColor;
      return (
        (this.mainChart.instance as any).getVisual(finder, "color") ||
        fallbackColor
      );
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
