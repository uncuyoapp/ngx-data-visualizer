import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Dataset, Dimension, TableComponent, TableOptions, ThemeService } from 'ngx-data-visualizer';

import testDataset2d from '../../assets/data/test-dataset-2d.json';
import testDimensions from '../../assets/data/test-dimensions.json';

@Component({
  selector: 'app-table-sizes-test',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './table-sizes-test.component.html',
  styleUrls: ['./table-sizes-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSizesTestComponent {
  private readonly themeService = inject(ThemeService);

  dataset = new Dataset({
    id: 1,
    rowData: testDataset2d,
    dimensions: (testDimensions as Dimension[]).filter(
      (d) => d.id === 0 || d.id === 54,
    ),
    enableRollUp: true,
  });

  tableConfig: TableOptions = {
    cols: ['Año'],
    rows: ['Sector de gestión'],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
    valueDisplay: 'nominal',
  };
}
