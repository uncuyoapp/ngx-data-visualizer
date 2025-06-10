import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
  ThemeService,
} from 'ngx-data-visualizer';

import optionsChart from '../../assets/data/chart-options.json';
import data from '../../assets/data/data.json';
import dimensionsData from '../../assets/data/dimensions.json';
import goal from '../../assets/data/goal.json';
import optionsTable from '../../assets/data/table-options.json';

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

  themeService: ThemeService = inject(ThemeService);

  ngOnInit(): void {
    // this.themeService.setTheme('bootstrap');
    // this.themeService.setTableTheme({
    //   // Colores principales
    //   tableHover: '#ff0000',
    //   tableHoverContrast: '#ffffff',
    //   tableBody: '#f5f5f5',
    //   legendShow: '#0000ff',
      
    //   // Tamaños y espaciado
    //   fontSize: '8pt',
    //   headerFontSize: '10pt',
    //   lineHeight: '35pt',
    //   padding: {
    //     cell: '8px 12px 8px 8px',
    //     label: '6px',
    //     rowLabel: '6px 12px 6px 0px',
    //     colLabel: '12px 6px'
    //   },
      
    //   // Colores de fondo
    //   backgroundColor: {
    //     header: '#e0e0e0',
    //     label: '#e8e8e8',
    //     corner: '#f8f8f8',
    //     axisLabel: '#ffffff'
    //   },
      
    //   // Bordes
    //   border: {
    //     color: 'white',
    //     width: '4px',
    //     style: 'solid'
    //   },
      
    //   // Sombras
    //   shadow: {
    //     color: 'rgba(0, 2, 0, 0.9)',
    //     offset: '0px 2px',
    //     blur: '4px'
    //   }
    // });
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
    this.chartOptions.xAxis.secondLevel = 3;
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
