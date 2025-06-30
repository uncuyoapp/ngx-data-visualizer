import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChartDirective,
  TableDirective,
  Dataset,
  Dimension,
  Item,
  RowData,
  ChartConfigurationOptions,
  PivotConfiguration,
  Filters,
  Series,
} from 'ngx-data-visualizer';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartDirective, TableDirective],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss',
})
export class ConfigurationComponent implements OnInit {
  @ViewChild('chartOne') chartOne!: ChartDirective;
  @ViewChild('tableOne') tableOne!: TableDirective;

  exampleDataset!: Dataset;
  filteredDataset?: Dataset;
  chartOptions: ChartConfigurationOptions = {
    type: 'column',
    title: '',
    stacked: 'Región',
    xAxis: {
      title: 'Año',
      rotateLabels: null,
      firstLevel: 2,
      secondLevel: null,
    },
    yAxis: {
      title: 'Valor',
      max: null,
    },
    tooltip: {
      shared: true,
      decimals: 2,
      suffix: null,
      format: null,
      showTotal: true,
    },
    legends: {
      enabled: true,
      show: true,
      position: '',
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ['#7FDEFF', '#7DD5FC', '#96D7FF', '#98CEFF', '#ADCFFF'],
    width: null,
    height: null,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: 'Valor',
    isPreview: false,
    disableAutoUpdate: false,
  };
  tableOptions: PivotConfiguration = {
    cols: ['region'],
    rows: ['year',],
    digitsAfterDecimal: 2,
    suffix: '$',
    totalCol: false,
    totalRow: false,
    sorters: [],
  };

  ngOnInit(): void {
    this.initializeDataset();
  }

  private initializeDataset(): void {
    const dimensions: Dimension[] = [
      {
        id: 1,
        name: 'region',
        nameView: 'region',
        type: 3,
        selected: false,
        items: [
          { id: 1, name: 'Norte', selected: true, order: 1 },
          { id: 2, name: 'Sur', selected: true, order: 0},
        ],
      },
      {
        id: 2,
        name: 'year',
        nameView: 'year',
        type: 0,
        selected: false,
        items: [{ id: 1, name: '2023', selected: true }],
      },
    ];

    const rowData: RowData[] = [
      { region: 'Norte', year: 2023, valor: 100 },
      { region: 'Sur', year: 2023, valor: 150 },
      { region: 'Norte', year: 2024, valor: 100 },
      { region: 'Sur', year: 2024, valor: 150 },
    ];

    this.exampleDataset = new Dataset({
      dimensions,
      rowData,
      enableRollUp: true,
      id: 2,
    });
    console.log(this.exampleDataset.getData());
  }

  applyFilters(): void {
    const filters: Filters = {
      filter: [],
      rollUp: [],
    };

    filters.rollUp = this.exampleDataset.dimensions
      .map((dimension) => dimension.nameView);

    filters.filter = this.exampleDataset.dimensions.map((dimension) => ({
      name: dimension.nameView,
      items: dimension.items
        .filter((item) => item.selected)
        .map((item) => item.name),
    }));

    this.filteredDataset = new Dataset({
      ...this.exampleDataset,
      dimensions: [...this.exampleDataset.dimensions],
      rowData: [...this.exampleDataset.rowData],
    });
    this.filteredDataset.applyFilters(filters);
  }

  resetFilters(): void {
    this.exampleDataset.dimensions.forEach((dimension: Dimension) => {
      dimension.items.forEach((item: Item) => (item.selected = true));
    });
    this.exampleDataset.applyFilters(new Filters());
    this.filteredDataset = undefined;
  }

  onSeriesChange(series: Series[]): void {
    console.log('Series actualizadas:', series);
  }

  exportChart(): void {
    this.chartOne.export('jpg');
  }

  exportTable(): void {
    this.tableOne.export('xlsx');
  }
}
