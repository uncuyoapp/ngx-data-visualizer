import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, effect, input } from '@angular/core';
import { ChartConfiguration } from '../chart/chart-configuration';
import { ChartComponent } from '../chart/chart.component';
import { BackComponent } from '../icons/back/back.component';
import { ContractComponent } from '../icons/contract/contract.component';
import { ExpandComponent } from '../icons/expand/expand.component';
import { ForwardComponent } from '../icons/forward/forward.component';

@Component({
  selector: 'lib-multiple-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    ForwardComponent,
    BackComponent,
    ExpandComponent,
    ContractComponent
  ],
  templateUrl: './multiple-chart.component.html',
  styleUrl: './multiple-chart.component.scss'
})
export class MultipleChartComponent {
  chartConfigurations = input.required<ChartConfiguration[]>();
  
  // Inicializador de campo para el efecto
  private configEffect = effect(() => {
    // Este efecto se activará cada vez que chartConfigurations cambie
    const configs = this.chartConfigurations();
    if (configs) {
      // Asegurarse de que todas las configuraciones tengan la propiedad expanded
      configs.forEach(config => {
        if (config.expanded === undefined) {
          config.expanded = false;
        }
      });
    }
  });

  chartComponent = ChartComponent;

  expandChartItem(el: HTMLDivElement, config: ChartConfiguration) {
    if (el.classList.contains('expanded')) {
      el.classList.remove('expanded');
      config.expanded = false;
    } else {
      el.classList.add('expanded');
      config.expanded = true;
    }
    setTimeout(() => {
      this.moveToChartItem(el.id);
    }, 300);
  }

  moveToChartItem(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

}
