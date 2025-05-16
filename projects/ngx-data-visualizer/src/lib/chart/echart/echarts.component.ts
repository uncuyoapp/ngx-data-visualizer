import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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

// Importaciones específicas para tree-shaking
declare const require: any;

import { Series } from '../../models';
import { Chart } from '../chart';
import { ChartConfiguration } from '../chart-configuration';
import { ChartData } from '../chart-data';
import { EChart } from './echarts';

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
        echarts: () => import('echarts').then(m => m)
      })
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

  /** Instancia del gráfico ECharts */
  protected mainChart!: EChart;

  /** Opciones de inicialización de ECharts */
  protected initOptions: EChartsInitOptions = {
    locale: 'es',
    renderer: 'canvas', // Usar canvas en lugar de SVG para mejor rendimiento
    useDirtyRect: true, // Habilitar renderizado sucio para mejor rendimiento
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  };

  /** Referencia al detector de cambios */
  private readonly cdr = inject(ChangeDetectorRef);
  
  /** Referencia a NgZone */
  private readonly ngZone = inject(NgZone);

  /** Identificador único para el componente */
  public id: string = `echart-${Math.floor(
    Math.random() * 10000
  )}`;

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
      this.ngZone.runOutsideAngular(() => {
        this.mainChart.instance.dispose();
      });
      this.mainChart.instance = null as any;
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
      this.initOptions.locale = this.initOptions.locale || 'es';
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
      this.mainChart.render();

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

    try {
      this.mainChart.render();
      this.scheduleSeriesEmission();
    } catch (error) {
      console.error('Error al actualizar el gráfico:', error);
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

      // Programar la emisión inicial de series
      this.scheduleSeriesEmission(100); // Pequeño retraso para asegurar que el gráfico esté listo
    } catch (error) {
      console.error('Error al establecer la instancia de ECharts:', error);
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
  private handleResize = (): void => {
    if (this.isDestroyed || !this.mainChart?.instance) {
      return;
    }
    
    this.cleanupResizeTimer();
    
    this.resizeTimer = setTimeout(() => {
      if (this.mainChart?.instance) {
        this.ngZone.runOutsideAngular(() => {
          this.mainChart.instance.resize({
            animation: {
              duration: 300
            }
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
    // No emitir si el componente está destruido
    if (this.isDestroyed) {
      return;
    }

    // Verificar que el gráfico principal esté inicializado
    if (!this.mainChart?.instance) {
      return;
    }

    try {
      // Obtener las series del gráfico
      const series = this.mainChart.getSeries();

      // Verificar que hay series para emitir
      if (Array.isArray(series) && series.length > 0) {
        // Usar requestAnimationFrame para sincronizar con el ciclo de renderizado del navegador
        requestAnimationFrame(() => {
          // Verificar nuevamente antes de emitir
          if (!this.isDestroyed) {
            this.seriesChange.emit(series);
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
      const series = chartData.getSeries() as unknown as Array<
        Record<string, unknown>
      >;

      if (!series || series.length === 0) {
        throw new Error('No hay series disponibles en los datos del gráfico');
      }

      // Obtener la primera serie como base
      const baseSeries = series[0];

      // Extraer los datos de la serie base usando notación de corchetes
      const baseData = Array.isArray(baseSeries['data'])
        ? baseSeries['data']
        : [];

      // Crear los datos transformados para la serie de meta
      const transformedData = baseData.map((point: unknown) => {
        // Manejar diferentes formatos de datos
        if (Array.isArray(point)) {
          return point[1]; // [x, y] -> y
        } else if (
          point &&
          typeof point === 'object' &&
          'value' in (point as any)
        ) {
          return (point as any).value;
        }
        return point;
      });

      // Crear la serie de meta con la interfaz Series
      const goalSeries: Series = {
        name: 'Meta',
        color: 'black',
        visible: true,
        data: transformedData,
      };

      // Agregar propiedades adicionales como propiedades personalizadas
      (goalSeries as any).smooth = true;
      (goalSeries as any).stacking = undefined;
      (goalSeries as any).chartType = chartType;

      return goalSeries;
    } catch (error) {
      console.error('Error al generar la serie de meta:', error);
      throw new Error('No se pudo generar la serie de meta');
    }
  }
}
