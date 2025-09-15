import { Component, HostBinding, input, output, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from '../../../chart/types/chart-configuration';
import { ChartDirective } from '../../../directives/chart.directive';
import { BackComponent } from '../../../icons/back/back.component';
import { ContractComponent } from '../../../icons/contract/contract.component';
import { ExpandComponent } from '../../../icons/expand/expand.component';
import { ForwardComponent } from '../../../icons/forward/forward.component';

/**
 * Componente "envoltorio" que representa un único item en la vista de múltiples gráficos.
 * Encapsula un gráfico individual (`lib-chart`) junto con sus controles de navegación y expansión.
 */
@Component({
  selector: 'lib-chart-wrapper',
  standalone: true,
  imports: [
    CommonModule, 
    ChartDirective, 
    BackComponent, 
    ContractComponent, 
    ExpandComponent, 
    ForwardComponent
  ],
  templateUrl: './chart-wrapper.component.html',
  styleUrls: ['./chart-wrapper.component.scss']
})
export class ChartWrapperComponent {
  /** La configuración completa para el gráfico que se renderizará. */
  chartConfiguration = input.required<ChartConfiguration>();
  /** El índice de este gráfico en el conjunto total. */
  index = input.required<number>();
  /** El número total de gráficos en la vista. */
  total = input.required<number>();

  /** Emite 'previous' o 'next' cuando se hace clic en los botones de navegación. */
  navigate = output<'previous' | 'next'>();
  
  private elementRef = inject(ElementRef);

  /**
   * Vincula la propiedad `expanded` de la configuración a una clase CSS en el elemento anfitrión.
   * Esto permite que los estilos del padre afecten a este componente cuando se expande.
   */
  @HostBinding('class.expanded')
  get isExpanded(): boolean {
    return this.chartConfiguration().expanded ?? false;
  }

  /**
   * Alterna el estado de expansión de este gráfico y se centra a sí mismo en la pantalla.
   */
  toggleExpand(): void {
    const config = this.chartConfiguration();
    config.expanded = !config.expanded;

    // Se usa un timeout para asegurar que el scroll ocurra después de que la transición
    // de CSS haya comenzado, permitiendo un centrado correcto basado en el tamaño final.
    setTimeout(() => {
      this.elementRef.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 300); // 300ms para coincidir con la duración de la transición de CSS
  }
}
