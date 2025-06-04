import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { Series } from '../chart/types/chart-models';

/**
 * Componente que muestra una leyenda para series de gráficos con funcionalidad de alternancia.
 *
 * @example
 * ```html
 * <lib-legend
 *   [series]="seriesData"
 *   (legendClick)="onLegendClick($event)"
 *   (legendHover)="onLegendHover($event)"
 * />
 * ```
 */
@Component({
  selector: 'lib-legend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent {
  /**
   * Arreglo de datos de series para mostrar en la leyenda
   * @required
   */
  readonly series = input.required<Series[]>();

  /**
   * Se emite cuando se hace clic en un elemento de la leyenda
   */
  readonly legendClick = output<Series>();

  /**
   * Se emite al pasar el ratón sobre un elemento de la leyenda
   */
  readonly legendHover = output<Series>();

  /**
   * Indica si la leyenda está actualmente visible
   */
  readonly isLegendVisible = signal(false);

  /**
   * Texto computado para el botón de alternar leyenda
   */
  readonly legendButtonText = computed(() =>
    this.isLegendVisible() ? 'Ocultar leyendas' : 'Ver leyendas'
  );

  /**
   * Alterna la visibilidad de la leyenda
   */
  toggleLegendVisibility(): void {
    this.isLegendVisible.update((visible) => !visible);
  }

  /**
   * Maneja los eventos de clic en los elementos de la leyenda
   * @param series La serie asociada al elemento de leyenda clickeado
   */
  onLegendClick(series: Series): void {
    this.legendClick.emit(series);
  }

  /**
   * Maneja los eventos de pasar el ratón sobre los elementos de la leyenda
   * @param series La serie asociada al elemento de leyenda sobre el que se pasa el ratón
   */
  onLegendHover(series: Series): void {
    this.legendHover.emit(series);
  }

  /**
   * Función trackBy para la directiva *ngFor
   * @param _index Índice del elemento
   * @param series Objeto de la serie
   * @returns Identificador único para el seguimiento de cambios
   */
  trackBySeriesName(_index: number, series: Series): string {
    return series.name;
  }
}
