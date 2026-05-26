import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  HostBinding,
  OnDestroy,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { LegendComponent } from "../legend/legend.component";
import { DATA_VISUALIZER_CONFIG } from "../providers";
import { Dataset } from "../services/dataset";
import { Filters } from "../services/types";
import { ChartOptions, Goal, Series } from "../types/data.types";
import { injectAutoUpdate } from "../utils/auto-update.helper";
import { EchartsComponent } from "./echart/echarts.component";
import { ChartFactory } from "./services/chart-factory.service";
import { ChartUpdater } from "./services/chart-updater.service";
import { Chart } from "./types/chart";
import { ChartConfiguration } from "./types/chart-configuration";
import { GoalChartHelper } from "./utils/goal-chart.helper";

/**
 * Componente principal de gráficos que encapsula la lógica de visualización,
 * controles reactivos y el editor de configuración.
 */
@Component({
  selector: "libChart, [libChart]",
  standalone: true,
  exportAs: "libChart",
  templateUrl: "./chart.component.html",
  styleUrl: "./chart.component.scss",
  imports: [CommonModule, EchartsComponent, LegendComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnDestroy {
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly chartFactory = inject(ChartFactory);
  private readonly overlay = inject(Overlay);
  private readonly chartUpdater = inject(ChartUpdater);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef);
  private readonly globalConfig = inject(DATA_VISUALIZER_CONFIG, { optional: true });

  // ============================================
  // INPUTS & OUTPUTS PRINCIPALES (PÚBLICOS)
  // ============================================

  /** Conjunto de datos para el gráfico. */
  dataset = input.required<Dataset>();

  /** Opciones de configuración del gráfico. */
  chartOptions = input.required<ChartOptions>();

  /** Evento que se emite cuando cambian las series del gráfico. */
  seriesChange = output<Series[]>();

  /** Controla la apertura y cierre del panel de edición de configuración de forma bidireccional. */
  showEditor = model<boolean>(false);

  /** Controla la visibilidad de las leyendas nativas en el gráfico. */
  showLegends = input<boolean>(true);

  /** Evento de salida para soportar el enlace bidireccional de la configuración [(chartOptions)] */
  chartOptionsChange = output<ChartOptions>();

  @HostBinding("style.flex")
  get hostFlex(): string | null {
    const opts = this.chartOptions();
    if (opts?.width !== undefined && opts?.width !== null) {
      return "0 0 auto";
    }
    return null;
  }

  @HostBinding("style.height")
  get hostHeight(): string | null {
    const opts = this.chartOptions();
    if (opts?.height !== undefined && opts?.height !== null) {
      return typeof opts.height === "number" ? `${opts.height}px` : opts.height;
    }
    return null;
  }

  @HostBinding("style.width")
  get hostWidth(): string | null {
    const opts = this.chartOptions();
    if (opts?.width !== undefined && opts?.width !== null) {
      return typeof opts.width === "number" ? `${opts.width}px` : opts.width;
    }
    return null;
  }

  @HostBinding("style.--viz-chart-min-height")
  get hostMinHeight(): string | null {
    const opts = this.chartOptions();
    if (opts?.height !== undefined && opts?.height !== null) {
      return "0px";
    }
    return this.globalConfig?.defaultHeight
      ? typeof this.globalConfig.defaultHeight === "number"
        ? `${this.globalConfig.defaultHeight}px`
        : this.globalConfig.defaultHeight
      : null;
  }

  @HostBinding("style.--viz-chart-min-width")
  get hostMinWidth(): string | null {
    const opts = this.chartOptions();
    if (opts?.width !== undefined && opts?.width !== null) {
      return "0px";
    }
    return this.globalConfig?.defaultWidth
      ? typeof this.globalConfig.defaultWidth === "number"
        ? `${this.globalConfig.defaultWidth}px`
        : this.globalConfig.defaultWidth
      : null;
  }

  // ============================================
  // ESTADOS Y SEÑALES INTERNAS
  // ============================================

  /** Opciones internas "en vivo" para el gráfico */
  internalOptions = signal<ChartOptions | null>(null);

  /** Señal que contiene las series actuales del gráfico para comunicación externa. */
  series = signal<Series[]>([]);

  /** Instancia del editor de configuración inyectado en el overlay */
  private configEditorComponentRef?: ComponentRef<any>;

  /** Referencia al overlay de CDK para el editor */
  private overlayRef?: OverlayRef;

  private readonly _mainChart = signal<Chart | null>(null);

  /** Instancia principal del gráfico de ECharts. */
  get mainChart(): Chart | null {
    return this._mainChart();
  }

  set mainChart(value: Chart | null) {
    this._mainChart.set(value);
  }

  /** Estado que indica si una meta está siendo visualizada actualmente. */
  showingGoal = false;

  private resizeObserver: ResizeObserver | null = null;
  private isInitialized = false;
  private goalChartHelper!: GoalChartHelper;

  // ============================================
  // VIEWCHILDS REACTIVOS (DEL TEMPLATE)
  // ============================================

  /** Referencia al componente de renderizado de ECharts */
  echart = viewChild(EchartsComponent);

  // ============================================
  // SIGNALS COMPUTADOS
  // ============================================



  /** Genera la configuración del gráfico de forma reactiva */
  chartConfiguration = computed(() => {
    const ds = this.dataset();
    const opts = this.internalOptions();
    if (!ds || !opts) return null;
    return this.chartFactory.getChartConfiguration(ds, opts);
  });

  // ============================================
  // CONSTRUCTOR & EFECTOS DE INICIALIZACIÓN
  // ============================================

  constructor() {
    // Sincronizar internalOptions cuando el input chartOptions cambie desde afuera
    effect(() => {
      this.internalOptions.set(this.chartOptions());
    }, { allowSignalWrites: true });

    // Efecto reactivo principal que inicializa y reacciona a cambios de configuración
    effect(() => {
      const config = this.chartConfiguration();
      const echart = this.echart();

      // Solo proceder cuando ambas dependencias estén disponibles
      if (config && echart) {
        if (!this.isInitialized) {
          this.setupResizeObserver();
          this.isInitialized = true;
        }
        this.ngOnConfigChange(config);
      }
    }, { allowSignalWrites: true });



    // Reactivamente abrir/cerrar el editor según el input showEditor
    effect(() => {
      const show = this.showEditor();
      if (show) {
        this.createEditorComponent();
      } else {
        this.destroyEditorComponent();
      }
    }, { allowSignalWrites: true });

    // Reactivamente alternar la visibilidad de las leyendas nativas
    effect(() => {
      const show = this.showLegends();
      const chart = this._mainChart();
      if (chart) {
        chart.toggleLegendVisibility(show);
      }
    });

    // Registrar la suscripción automática para actualizar los datos en caliente
    injectAutoUpdate(
      () => this.dataset(),
      () => this.internalOptions(),
      () => this.handleDataUpdate()
    );
  }

  // ============================================
  // MÉTODOS DE CICLO DE VIDA INTERNO
  // ============================================



  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        const echart = this.echart();
        if (echart) {
          echart.updateChart();
        }
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  private ngOnConfigChange(config: ChartConfiguration): void {
    this.chartUpdater.updateSeriesConfig(config);
    this.goalChartHelper = new GoalChartHelper(config);
    requestAnimationFrame(() => {
      const echart = this.echart();
      if (echart) {
        echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  private handleDataUpdate(): void {
    const config = this.chartConfiguration();
    if (!config) return;
    this.chartUpdater.updateChartData(config);
    requestAnimationFrame(() => {
      const echart = this.echart();
      if (echart) {
        echart.updateChart();
      }
      this.cdr.markForCheck();
    });
  }

  // ============================================
  // API PÚBLICA DEL COMPONENTE (MÉTODOS)
  // ============================================

  /** Exponer API de redimensionamiento pública */
  public resize(): void {
    const echartComp = this.echart();
    if (echartComp) {
      echartComp.updateChart();
    }
  }

  /** Cambia la visualización del gráfico a modo porcentual. */
  public toPercentage(): void {
    this._executeOnChart((chart) => chart.togglePercentMode());
  }

  /** Exporta el gráfico actual a un formato específico ('png' o 'jpg'). */
  public export(type: "png" | "jpg" = "png"): void {
    this._executeOnChart((chart) => chart.export(type));
  }

  /** Alterna la visibilidad de una meta específica en el gráfico. */
  public toggleShowGoal(goal: Goal): void {
    this.showingGoal = !this.showingGoal;
    if (this.showingGoal) {
      this.showGoal(goal);
    } else {
      this.hideGoal();
    }
  }

  /** Obtiene los valores extremos actuales del navegador del gráfico */
  public getExtremes(): { start: number; end: number } | null {
    const extremes = this._executeOnChart((chart) => chart.getExtremes());
    return extremes ? (extremes as { start: number; end: number }) : null;
  }

  // ============================================
  // EVENTOS DE MANEJO DE SERIES Y LEYENDAS (TEMPLATE)
  // ============================================

  public onSelectSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.selectSeries(seriesElement);
    }
  }

  public onHoverSeries(seriesElement: Series): void {
    if (this.mainChart) {
      this.mainChart.hoverSeries(seriesElement);
    }
  }

  public onSeriesChange(series: Series[]): void {
    this.series.set(series);
    this.seriesChange.emit(series);
  }

  // ============================================
  // LÓGICA DEL EDITOR DE CONFIGURACIÓN (CDK OVERLAY)
  // ============================================

  /** Alterna la visibilidad del editor de configuración. */
  public toggleEditor(): void {
    this.showEditor.set(!this.showEditor());
  }

  private async createEditorComponent() {
    if (this.overlayRef) return;

    const { ChartConfigEditorComponent } = await import('../config-editor/chart-config-editor/chart-config-editor.component');

    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.elementRef.nativeElement)
        .withPush(false)
        .withPositions([
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'top',
            offsetX: -12,
            offsetY: 12
          }
        ])
    });

    const portal = new ComponentPortal(ChartConfigEditorComponent);
    this.configEditorComponentRef = this.overlayRef.attach(portal);

    this.configEditorComponentRef.setInput('dataset', this.dataset());
    this.configEditorComponentRef.setInput('options', this.internalOptions());
    this.configEditorComponentRef.setInput('getExtremesFn', () => this.getExtremes());

    this.configEditorComponentRef.instance.optionsChange
      .subscribe((newOptions: ChartOptions) => {
        this.internalOptions.set(newOptions);
        this.chartOptionsChange.emit(newOptions);
      });

    this.configEditorComponentRef.instance.close
      .subscribe(() => {
        this.showEditor.set(false);
      });
  }

  private destroyEditorComponent() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.configEditorComponentRef = undefined;
    }
  }

  // ============================================
  // GESTIÓN DE METAS (GOALS)
  // ============================================

  private showGoal(goal: Goal): void {
    const goalChartData = this.goalChartHelper.showGoal(goal);
    const echart = this.echart();
    if (goalChartData && this.mainChart && echart) {
      const goalSeries = echart.getGoalSeries(goalChartData, goal.chartType);
      this.mainChart.addSeries(goalSeries);
    }
  }

  private hideGoal(): void {
    if (this.mainChart) {
      this.mainChart.delSeries({ name: "Meta" } as any);
    }
    const { savedSeriesConfig, savedFilters } = this.goalChartHelper.hideGoal();
    const config = this.chartConfiguration();
    if (!config) return;
    config.seriesConfig = { ...savedSeriesConfig };
    if (savedFilters) {
      const filters = new Filters();
      filters.rollUp = [...(savedFilters.rollUp || [])];
      filters.filter = [...(savedFilters.filter || [])];
      config.dataset.applyFilters(filters);
    } else {
      config.dataset.applyFilters(new Filters());
    }
  }

  // ============================================
  // AUXILIARES
  // ============================================

  private _executeOnChart<T>(action: (chart: Chart) => T): T | void {
    if (this.mainChart) {
      return action(this.mainChart);
    }
    console.warn(
      "La instancia principal del gráfico no está inicializada. Acción omitida.",
    );
  }

  // ============================================
  // DESTRUCCIÓN
  // ============================================

  ngOnDestroy(): void {
    this.destroyEditorComponent();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mainChart) {
      this.mainChart.dispose();
      this.mainChart = null;
    }
    this.viewContainerRef.clear();
  }
}

/** @deprecated Usar ChartComponent en su lugar. Se mantiene por motivos de retrocompatibilidad. */
export { ChartComponent as ChartDirective };
