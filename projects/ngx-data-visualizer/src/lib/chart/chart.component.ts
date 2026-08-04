import { OverlayRef } from '@angular/cdk/overlay';
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
  untracked,
  viewChild,
} from "@angular/core";
import { ConfigEditorOverlayService } from '../config-editor/services/config-editor-overlay.service';
import { DATA_VISUALIZER_CONFIG } from "../providers";
import { AuditService } from "../services/audit.service";
import { Dataset } from "../services/dataset";
import { EventBusService } from "../services/event-bus.service";
import { Filters } from "../services/types";
import { ChartOptions, Goal, Series } from "../types/data.types";
import { VisualizerEventType } from "../types/visualizer-event.types";
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
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "libChart, [libChart]",
  standalone: true,
  exportAs: "libChart",
  templateUrl: "./chart.component.html",
  styleUrl: "./chart.component.scss",
  imports: [CommonModule, EchartsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnDestroy {
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly chartFactory = inject(ChartFactory);
  private readonly chartUpdater = inject(ChartUpdater);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef);
  private readonly globalConfig = inject(DATA_VISUALIZER_CONFIG, { optional: true });
  private readonly eventBus = inject(EventBusService);
  private readonly auditService = inject(AuditService);
  private readonly editorOverlayService = inject(ConfigEditorOverlayService);
  private readonly instanceId = `chart-${Math.floor(Math.random() * 10000)}`;

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


  /** 
   * Inyecta la altura explícita configurada vía TypeScript en el contenedor anfitrión.
   * Si no se define en la configuración, retorna null para delegar el layout al CSS.
   */
  @HostBinding("style.--viz-chart-height")
  get hostHeight(): string | null {
    const opts = this.chartOptions();
    if (opts?.height !== undefined && opts?.height !== null) {
      return typeof opts.height === "number" ? `${opts.height}px` : opts.height;
    }
    return null;
  }

  /** 
   * Inyecta la altura por defecto proveniente de la configuración global (DATA_VISUALIZER_CONFIG).
   * Actúa como fallback secundario en el SCSS si no hay una altura explícita.
   */
  @HostBinding("style.--viz-chart-default-height")
  get hostDefaultHeight(): string | null {
    if (this.globalConfig?.defaultHeight) {
      return typeof this.globalConfig.defaultHeight === "number"
        ? `${this.globalConfig.defaultHeight}px`
        : this.globalConfig.defaultHeight;
    }
    return null;
  }

  /** 
   * Inyecta el ancho explícito configurado vía TypeScript en el contenedor anfitrión.
   * Si no se define en la configuración, retorna null para delegar el layout al CSS.
   */
  @HostBinding("style.--viz-chart-width")
  get hostWidth(): string | null {
    const opts = this.chartOptions();
    if (opts?.width !== undefined && opts?.width !== null) {
      return typeof opts.width === "number" ? `${opts.width}px` : opts.width;
    }
    return null;
  }

  /** 
   * Inyecta el ancho por defecto proveniente de la configuración global (DATA_VISUALIZER_CONFIG).
   * Actúa como fallback secundario en el SCSS si no hay un ancho explícito.
   */
  @HostBinding("style.--viz-chart-default-width")
  get hostDefaultWidth(): string | null {
    if (this.globalConfig?.defaultWidth) {
      return typeof this.globalConfig.defaultWidth === "number"
        ? `${this.globalConfig.defaultWidth}px`
        : this.globalConfig.defaultWidth;
    }
    return null;
  }


  // ============================================
  // ESTADOS Y SEÑALES INTERNAS
  // ============================================

  /** Opciones internas "en vivo" para el gráfico */
  internalOptions = signal<ChartOptions | null>(null);

  /** Señal que contiene las series actuales del gráfico para comunicación externa. */
  series = signal<Series[]>([]);

  /** Instancia del editor de configuración inyectado en el overlay */
  private configEditorComponentRef?: ComponentRef<unknown>;

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
    const config = this.chartFactory.getChartConfiguration(ds, opts);
    if (config) {
      config.instanceId = this.instanceId;
    }
    return config;
  });

  // ============================================
  // CONSTRUCTOR & EFECTOS DE INICIALIZACIÓN
  // ============================================

  constructor() {
    this.syncOptionsFromInput();
    this.syncOnDatasetChange();
    this.watchChartConfiguration();
    this.watchEditorVisibility();
    this.watchLegendsVisibility();
    this.setupAutoUpdate();
  }

  /**
   * Sincroniza internalOptions cuando el input chartOptions cambia externamente.
   */
  private syncOptionsFromInput(): void {
    effect(() => {
      const opts = this.chartOptions();
      this.eventBus.emit({
        type: VisualizerEventType.CHART_CONFIG_CHANGE,
        instanceId: this.instanceId,
        payload: { optionsType: opts?.type ?? 'unknown' }
      });
      this.internalOptions.set(opts);
    }, { allowSignalWrites: true });
  }

  /**
   * Maneja el cambio de referencia del dataset:
   * 1. Propaga el nuevo dataset al editor en overlay si se encuentra abierto.
   * 2. Resincroniza opciones internas para prevenir combinaciones inválidas (ej. 'pie' con dataset multidimensional).
   */
  private syncOnDatasetChange(): void {
    let prevDatasetRef: Dataset | null = null;
    effect(() => {
      const ds = this.dataset();
      if (this.configEditorComponentRef) {
        this.configEditorComponentRef.setInput('dataset', ds);
      }
      if (prevDatasetRef && prevDatasetRef !== ds) {
        this.internalOptions.set(untracked(() => this.chartOptions()));
      }
      prevDatasetRef = ds;
    }, { allowSignalWrites: true });
  }

  /**
   * Efecto reactivo principal de inicialización y renderizado del gráfico.
   */
  private watchChartConfiguration(): void {
    effect(() => {
      const config = this.chartConfiguration();
      const echart = this.echart();

      if (config && echart) {
        if (this.isInitialized) {
          this.eventBus.emit({
            type: VisualizerEventType.CHART_CONFIG_CHANGE,
            instanceId: this.instanceId,
            payload: {
              optionsType: config.options?.type,
              seriesCount: config.chartData?.getSeries()?.length
            }
          });
          this.ngOnConfigChange(config);
        } else {
          this.eventBus.emit({
            type: VisualizerEventType.CHART_INIT,
            instanceId: this.instanceId,
            payload: {
              datasetId: config.dataset?.id,
              chartOptions: {
                type: config.options?.type,
                height: config.options?.height,
                width: config.options?.width
              }
            }
          });
          this.goalChartHelper = new GoalChartHelper(config);
          this.isInitialized = true;
        }
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Abre o cierra reactivamente el editor de configuración según el input showEditor.
   */
  private watchEditorVisibility(): void {
    effect(() => {
      const show = this.showEditor();
      if (show) {
        this.createEditorComponent();
      } else {
        this.destroyEditorComponent();
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Alterna reactivamente la visibilidad de las leyendas nativas del gráfico.
   */
  private watchLegendsVisibility(): void {
    effect(() => {
      const show = this.showLegends();
      const chart = this._mainChart();
      if (chart) {
        chart.toggleLegendVisibility(show);
      }
    });
  }

  /**
   * Registra la suscripción para actualizar los datos en caliente.
   */
  private setupAutoUpdate(): void {
    injectAutoUpdate(
      () => this.dataset(),
      () => this.internalOptions(),
      () => this.handleDataUpdate()
    );
  }

  // ============================================
  // MÉTODOS DE CICLO DE VIDA INTERNO
  // ============================================

  /**
   * Programa un ciclo de renderizado en el próximo animation frame.
   * Centraliza la lógica de emit RENDER_START + rAF + renderChart(config) + markForCheck.
   */
  private scheduleRender(config: ChartConfiguration): void {
    this.eventBus.emit({
      type: VisualizerEventType.CHART_RENDER_START,
      instanceId: this.instanceId
    });
    requestAnimationFrame(() => {
      this.echart()?.renderChart(config);
      this.cdr.markForCheck();
    });
  }

  private ngOnConfigChange(config: ChartConfiguration): void {
    this.chartUpdater.updateSeriesConfig(config);
    this.goalChartHelper = new GoalChartHelper(config);
    this.scheduleRender(config);
  }

  private handleDataUpdate(): void {
    const config = this.chartConfiguration();
    if (!config) return;
    this.chartUpdater.updateChartData(config);
    this.scheduleRender(config);
  }

  // ============================================
  // API PÚBLICA DEL COMPONENTE (MÉTODOS)
  // ============================================


  /** Exponer API de redimensionamiento pública */
  public resize(): void {
    const echart = this.echart();
    if (echart?.mainChart?.instance) {
      this.eventBus.emit({
        type: VisualizerEventType.CHART_RESIZE,
        instanceId: this.instanceId
      });
      echart.mainChart.instance.resize();
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
    return extremes ?? null;
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

    const { overlayRef, componentRef } = this.editorOverlayService.create({
      elementRef: this.elementRef,
      component: ChartConfigEditorComponent,
      dataset: this.dataset(),
      options: this.internalOptions(),
      onOptionsChange: (newOptions) => {
        if (newOptions) {
          this.internalOptions.set(newOptions);
          this.chartOptionsChange.emit(newOptions);
        }
      },
      onClose: () => {
        this.showEditor.set(false);
      }
    });

    this.overlayRef = overlayRef;
    this.configEditorComponentRef = componentRef;
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
      this.mainChart.delSeries({ name: "Meta" });
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
    if (this.mainChart) {
      this.mainChart.dispose();
      this.mainChart = null;
    }
    this.viewContainerRef.clear();
  }
}

/** @deprecated Usar ChartComponent en su lugar. Se mantiene por motivos de retrocompatibilidad. */
export { ChartComponent as ChartDirective };
