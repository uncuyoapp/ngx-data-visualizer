import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Series } from '../models';

@Component({
  selector: 'lib-legend',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss'
})
export class LegendComponent {
  series = input<Series[]>();
  clickLegend = output<Series>();
  hoverLegend = output<Series>();

  showLegends = false;

  onClickShowLegends() {
    this.showLegends = !this.showLegends;
  }
  onClickLegend(seriesElement: Series) {
    this.clickLegend.emit(seriesElement);
  }
  onHoverLegend(seriesElement: Series) {
    this.hoverLegend.emit(seriesElement);
  }
}
