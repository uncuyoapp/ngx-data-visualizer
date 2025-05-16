import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, effect, input } from '@angular/core';

import { ChartConfiguration } from '../chart/chart-configuration';
import { ChartComponent } from '../chart/chart.component';
import { BackComponent } from '../icons/back/back.component';
import { ContractComponent } from '../icons/contract/contract.component';
import { ExpandComponent } from '../icons/expand/expand.component';
import { ForwardComponent } from '../icons/forward/forward.component';

/**
 * Componente que muestra múltiples gráficos en un contenedor con navegación
 * Permite expandir/contraer y navegar entre los gráficos
 */
@Component({
  selector: 'lib-multiple-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    ForwardComponent,
    BackComponent,
    ExpandComponent,
    ContractComponent,
  ],
  templateUrl: './multiple-chart.component.html',
  styleUrl: './multiple-chart.component.scss',
})
export class MultipleChartComponent {
  /** Configuraciones de los gráficos a mostrar */
  chartConfigurations = input.required<ChartConfiguration[]>();
  
  /** Referencia al componente de gráfico que se renderizará */
  chartComponent = ChartComponent;

  /**
   * Efecto que se ejecuta cuando cambian las configuraciones de los gráficos
   * Asegura que todas las configuraciones tengan la propiedad expanded definida
   */
  private configEffect = effect(() => {
    const configs = this.chartConfigurations();
    
    if (configs) {
      configs.forEach(config => {
        if (config.expanded === undefined) {
          config.expanded = false;
        }
      });
    }
  });

  /**
   * Expande o contrae un elemento de gráfico
   * @param element Elemento HTML que contiene el gráfico
   * @param config Configuración del gráfico que se está expandiendo/contrayendo
   */
  expandChartItem(element: HTMLDivElement, config: ChartConfiguration): void {
    if (element.classList.contains('expanded')) {
      element.classList.remove('expanded');
      config.expanded = false;
    } else {
      element.classList.add('expanded');
      config.expanded = true;
    }
    
    setTimeout(() => {
      this.moveToChartItem(element.id);
    }, 300);
  }

  /**
   * Desplaza la vista al elemento de gráfico especificado
   * @param id Identificador del elemento al que se debe desplazar la vista
   */
  moveToChartItem(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
