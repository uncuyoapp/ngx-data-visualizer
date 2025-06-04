import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { ECharts, EChartsOption } from 'echarts';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { Series } from '../types/chart-models';
import { Chart } from '../types/chart';
import { ChartConfiguration } from '../types/chart-configuration';
import { ChartData } from '../utils/chart-data';
import { EChart } from './echarts';
import { EC_SERIES_CONFIG } from '../../types/constants';

/**
 * Interfaz para las opciones de inicialización de ECharts
 */
interface EChartsInitOptions extends EChartsOption {
  locale?: string;
  renderer?: 'canvas' | 'svg';
  width?: number | string;
  height?: number | string;
}

/**
 * Componente que encapsula la funcionalidad de gráficos ECharts.
 * Maneja la creación, actualización y destrucción de instancias de gráficos.
 *
 * @example
 * ```html
 * <lib-app-echarts
 *   [chartConfiguration]="chartConfig"
 *   (seriesChange)="onSeriesChange($event)"
 *   (chartCreated)="onChartCreated($event)">
 * </lib-app-echarts>
 * ```
 */
@Component({
  standalone: true,
  selector: 'lib-app-echarts',
  templateUrl: './echarts.component.html',
  styleUrls: ['./echarts.component.scss'],
  imports: [NgxEchartsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({
        echarts: () => import('echarts').then((m) => m),
      }),
    },
  ],
})
export class EchartsComponent implements OnInit, OnDestroy {
  /** Referencia para la limpieza de recursos */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Configuración del gráfico
   * @required
   */
  public readonly chartConfiguration = input.required<ChartConfiguration>();

  /** Evento que se emite cuando cambian las series del gráfico */
  public readonly seriesChange = output<Series[]>();

  /** Evento que se emite cuando se crea el gráfico */
  public readonly chartCreated = output<Chart>();

  /** Evento que se emite cuando el gráfico se ha actualizado completamente */
  public readonly chartUpdated = output<void>();

  /** Instancia del gráfico ECharts */
  protected mainChart!: EChart;

  /** Opciones de inicialización de ECharts */
  protected initOptions: EChartsInitOptions = {
    locale: 'es',
    renderer: 'canvas', // Usar canvas en lugar de SVG para mejor rendimiento
    useDirtyRect: true, // Habilitar renderizado sucio para mejor rendimiento
    devicePixelRatio:
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  };

  /** Referencia a NgZone */
  private readonly ngZone = inject(NgZone);

  /** Identificador único para el componente */
  public id: string = `echart-${Math.floor(Math.random() * 10000)}`;

  /** Bandera para controlar si el componente está destruido */
  private isDestroyed = false;

  /** Temporizador para la emisión de series */
  private seriesEmissionTimer: ReturnType<typeof setTimeout> | null = null;

  /** Tiempo de debounce para la emisión de series (ms) */
  private readonly EMIT_DEBOUNCE = 100;

  /** Tiempo de debounce para redimensionamiento (ms) */
  private readonly RESIZE_DEBOUNCE = 150;

  /** Temporizador para redimensionamiento */
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Inicialización del componente
   */
  public ngOnInit(): void {
    try {
      this.configInitOptions();
      this.createChart();
      this.setupResizeListener();
    } catch (error) {
      console.error('Error al inicializar el componente de gráficos:', error);
      // Considerar emitir un evento de error aquí si es necesario
    }
  }

  /**
   * Limpieza de recursos al destruir el componente
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
        console.warn('Error al destruir la instancia de ECharts:', error);
      } finally {
        this.mainChart = null as unknown as EChart;
      }
    }
  }

  /**
   * Configura las opciones de inicialización del gráfico basadas en la configuración proporcionada
   * @private
   */
  private configInitOptions(): void {
    try {
      const config = this.chartConfiguration();

      if (config?.options?.height) {
        this.initOptions.height = `${config.options.height}px`;
      }

      if (config?.options?.width) {
        this.initOptions.width = `${config.options.width}px`;
      }

      // Asegurar que el locale siempre esté definido
      this.initOptions.locale = this.initOptions.locale ?? 'es';
    } catch (error) {
      console.error('Error al configurar las opciones del gráfico:', error);
      throw new Error('No se pudo configurar las opciones del gráfico');
    }
  }

  /**
   * Crea una nueva instancia del gráfico
   * @throws Error si no se puede crear el gráfico
   */
  protected createChart(): void {
    try {
      const config = this.chartConfiguration();

      if (!config) {
        throw new Error('La configuración del gráfico no está definida');
      }

      this.mainChart = new EChart(config);

      // Emitir el evento de gráfico creado de forma asíncrona
      Promise.resolve().then(() => {
        this.chartCreated.emit(this.mainChart);
      });
    } catch (error) {
      console.error('Error al crear el gráfico:', error);
      throw new Error('No se pudo crear el gráfico');
    }
  }

  /**
   * Establece la instancia de ECharts y programa la emisión inicial de series
   * @param instance - Instancia de ECharts
   */
  public setChartInstance(instance: ECharts): void {
    if (!instance) {
      console.warn('Se intentó establecer una instancia de ECharts nula');
      return;
    }

    try {
      this.mainChart.instance = instance;

      // Realizar el renderizado inicial solo cuando se establece la instancia
      if (!this.mainChart.hasRendered) {
        this.mainChart.render();
        this.mainChart.hasRendered = true;
      }

      // Programar la emisión inicial de series
      this.scheduleSeriesEmission(100);
    } catch (error) {
      console.error('Error al establecer la instancia de ECharts:', error);
    }
  }

  /**
   * Actualiza el gráfico con los datos actuales
   * @public
   */
  public updateChart(): void {
    if (!this.mainChart) {
      console.warn(
        'No se puede actualizar el gráfico: la instancia no está inicializada'
      );
      return;
    }

    // Evitar actualizaciones si es el renderizado inicial
    if (!this.mainChart.hasRendered) {
      console.warn(
        'Esperando al renderizado inicial, se omite la actualización'
      );
      return;
    }

    try {
      this.mainChart.isRendering = true;

      // Remover cualquier listener previo del evento finished
      if (this.mainChart?.instance) {
        this.mainChart.instance.off('finished');
      }

      this.mainChart.render();
      this.scheduleSeriesEmission();

      // Emitir el evento de actualización después de que el gráfico se haya renderizado
      this.ngZone.runOutsideAngular(() => {
        if (this.mainChart?.instance) {
          // Usar requestAnimationFrame para asegurar que el renderizado principal haya terminado
          requestAnimationFrame(() => {
            this.mainChart.instance.on('finished', () => {
              this.ngZone.run(() => {
                this.chartUpdated.emit();
                this.mainChart.isRendering = false;
              });
            });
          });
        }
      });
    } catch (error) {
      console.error('Error al actualizar el gráfico:', error);
      this.mainChart.isRendering = false;
    }
  }

  /**
   * Programa la emisión de series con un retraso opcional
   * @param delay - Retraso en milisegundos antes de emitir las series
   * @private
   */
  private scheduleSeriesEmission(delay: number = this.EMIT_DEBOUNCE): void {
    // No programar emisiones si el componente está destruido
    if (this.isDestroyed) {
      return;
    }

    // Limpiar cualquier emisión pendiente
    this.cleanupSeriesEmissionTimer();

    // Usar NgZone.runOutsideAngular para evitar detección de cambios innecesaria
    this.ngZone.runOutsideAngular(() => {
      this.seriesEmissionTimer = setTimeout(() => {
        if (!this.isDestroyed) {
          this.ngZone.run(() => this.emitSeries());
        }
      }, delay);
    });
  }

  /**
   * Limpia el temporizador de emisión de series
   * @private
   */
  private cleanupSeriesEmissionTimer(): void {
    if (this.seriesEmissionTimer) {
      clearTimeout(this.seriesEmissionTimer);
      this.seriesEmissionTimer = null;
    }
  }

  /**
   * Configura el listener para el evento de redimensionamiento
   * @private
   */
  private setupResizeListener(): void {
    if (typeof window !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('resize', this.handleResize);
      });
    }
  }

  /**
   * Limpia el listener de redimensionamiento
   * @private
   */
  private cleanupResizeListener(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    this.cleanupResizeTimer();
  }

  /**
   * Limpia el temporizador de redimensionamiento
   * @private
   */
  private cleanupResizeTimer(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  }

  /**
   * Maneja el evento de redimensionamiento con debounce
   * @private
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
   * Emite las series del gráfico a través del Output
   * Verifica que el componente esté en un estado válido para emitir
   * @private
   */
  public emitSeries(): void {
    if (this.isDestroyed) {
      return;
    }

    if (!this.mainChart?.instance) {
      return;
    }

    try {
      const series = this.mainChart.getSeries();

      if (Array.isArray(series) && series.length > 0) {
        const typedSeries: Series[] = series.map((s) => ({
          name: s.name || '',
          color: s.color ?? '#000000',
          visible: s.visible ?? true,
          data: s.data || [],
        }));

        requestAnimationFrame(() => {
          if (!this.isDestroyed) {
            this.seriesChange.emit(typedSeries);
          }
        });
      }
    } catch (error) {
      console.error('Error al obtener series del gráfico:', error);
    }
  }

  /**
   * Genera una serie de meta basada en los datos del gráfico
   * @param chartData - Datos del gráfico
   * @param chartType - Tipo de gráfico para la serie de meta (no se usa directamente en la serie)
   * @returns Configuración de la serie de meta
   */
  public getGoalSeries(chartData: ChartData, chartType: string): Series {
    if (!chartData) {
      throw new Error('El parámetro chartData es requerido');
    }

    try {
      // Obtener los datos directamente del dataProvider
      const data = chartData.dataProvider.getData();

      // Extraer los valores de la meta
      const goalData = data.map((row) => {
        const value = row['valor'];
        return typeof value === 'number' ? value : 0;
      });

      // Asegurarnos de que el tipo de serie coincida con el tipo de gráfico
      const seriesType = chartType === 'column' ? 'bar' : chartType;

      // Crear la serie de meta con la configuración correcta
      const goalSeries: Series = {
        name: 'Meta',
        color: 'black',
        visible: true,
        data: goalData,
        smooth: true,
        stacking: undefined,
        chartType: chartType,
        type: seriesType,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed',
        },
      };

      // Aplicar la configuración específica del tipo de serie
      type SeriesType = keyof typeof EC_SERIES_CONFIG;
      if (seriesType in EC_SERIES_CONFIG) {
        Object.assign(goalSeries, EC_SERIES_CONFIG[seriesType as SeriesType]);
      }

      return goalSeries;
    } catch (error) {
      console.error('Error al generar la serie de meta:', error);
      throw new Error('No se pudo generar la serie de meta');
    }
  }
}
