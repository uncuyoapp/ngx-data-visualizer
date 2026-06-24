import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartComponent, ChartOptions, Dataset, Dimension } from 'ngx-data-visualizer';

import testDataset1d from '../../assets/data/test-dataset-1d.json';
import testDimensions from '../../assets/data/test-dimensions.json';

@Component({
  selector: 'app-size-test',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './size-test.component.html',
  styleUrls: ['./size-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SizeTestComponent {
  dataset = new Dataset({
    id: 1,
    rowData: testDataset1d,
    dimensions: (testDimensions as Dimension[]).filter((d) => d.id === 0),
    enableRollUp: true,
  });

  private readonly baseChartConfig: ChartOptions = {
    type: 'column',
    title: 'Distribución de Prueba',
    stacked: null,
    xAxis: { rotateLabels: null, firstLevel: 0, secondLevel: null },
    yAxis: { title: 'Valor', max: null },
    tooltip: { shared: false, decimals: 0, suffix: null, format: null, showTotal: false },
    legends: { enabled: false, show: false, position: 'bottom' },
    navigator: { show: false, start: null, end: null },
    colors: ['#1976d2', '#388e3c'],
    width: null,
    height: null,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: 'unidades',
    isPreview: false,
    disableAutoUpdate: false,
  };

  // Caso 1: TS Fijo
  config1: ChartOptions = { ...this.baseChartConfig, width: 600, height: 400 };

  // Caso 2: 100% Responsivo
  config2: ChartOptions = { ...this.baseChartConfig };

  // Caso 3: Inline CSS
  config3: ChartOptions = { ...this.baseChartConfig };

  // Caso 4: SCSS Externo
  config4: ChartOptions = { ...this.baseChartConfig };
}
