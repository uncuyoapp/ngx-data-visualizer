import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ChartConfigurationOptions,
  ChartDirective,
  Dataset,
  Dimension,
  Filters,
  Goal,
  Item,
  MultipleChartDirective,
  PivotConfiguration,
  RowData,
  Series,
  TableDirective,
} from 'ngx-data-visualizer';

import optionsChart from '../chart-options.json';
import data from '../data.json';
import dimensionsData from '../dimensions.json';
import goal from '../goal.json';
import optionsTable from '../table-options.json';

@Component({
  selector: 'app-full-example',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ChartDirective,
    TableDirective,
    MultipleChartDirective,
  ],
  templateUrl: './full-example.component.html',
  styleUrl: './full-example.component.scss',
})
export class FullExampleComponent implements OnInit {
  dataset!: Dataset;
  chartOptions: ChartConfigurationOptions =
    optionsChart as ChartConfigurationOptions;
  chartOptions2: ChartConfigurationOptions = {
    ...optionsChart,
  } as ChartConfigurationOptions;
  tableOptions: PivotConfiguration = optionsTable as PivotConfiguration;
  goal: Goal = goal as Goal;

  chartOne!: ChartDirective;

  years!: string[];
  highlighAll = false;
  series!: Series[];
  toPercentage = true;
  splitDimension!: Dimension;

  ngOnInit(): void {
    const dimensions = dimensionsData as Dimension[];
    const rowData = data as RowData[];

    this.dataset = new Dataset({
      dimensions,
      enableRollUp: true,
      id: 1,
      rowData,
    });
    this.splitDimension = dimensions[0];
    this.years = this.dataset.dataProvider.getItems('Año');
    this.chartOptions.stacked = 'Departamentos';
    this.chartOptions.xAxis.secondLevel = null;
  }

  filter() {
    const filters: Filters = {
      filter: [],
      rollUp: []
    };

    // Obtener las dimensiones que no están seleccionadas para rollUp
    filters.rollUp = this.dataset.dimensions
      .filter(dimension => !dimension.selected)
      .map(dimension => dimension.nameView);

    // Obtener los filtros para cada dimensión basados en los items seleccionados
    filters.filter = this.dataset.dimensions.map(dimension => ({
      name: dimension.nameView,
      items: dimension.items
        .filter(item => item.selected)
        .map(item => item.name)
    }));

    // Aplicar los filtros al dataset
    this.dataset.applyFilters(filters);
  }

  percentView(chartDirective: ChartDirective) {
    chartDirective.toPercentage();
  }

  clearFilters() {
    this.dataset.dimensions.forEach((dimension: Dimension) => {
      dimension.selected = true;
      dimension.items.forEach((item: Item) => (item.selected = true));
    });
    this.dataset.applyFilters(new Filters());
  }

  onSeriesChange(series: Series[]) {
    this.series = series;
  }

  exportChart(chartDirective: ChartDirective) {
    chartDirective.export('jpg');
  }

  exportTable(tableDirective: TableDirective) {
    tableDirective.export('xlsx');
  }

  showGoal(chartDirective: ChartDirective) {
    chartDirective.toggleShowGoal(this.goal);
  }
}
