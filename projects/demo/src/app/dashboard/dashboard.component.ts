import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { ChartConfigurationOptions, ChartDirective, Dataset, Dimension, PivotConfiguration, RowData, TableDirective } from 'ngx-data-visualizer';
import optionsChart from '../../assets/chart-options-dash.json';
import dimensionsData from '../../assets/dash-dimensions.json';
import data from '../../assets/example-data-2.json';
import optionsTable from '../../assets/table-options-dash.json';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChartDirective,
    TableDirective,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  datasetOne!: Dataset
  datasetTwo!: Dataset
  datasetThree!: Dataset
  datasetFour!: Dataset
  chartOptionsOne: ChartConfigurationOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartConfigurationOptions;
  chartOptionsTwo: ChartConfigurationOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartConfigurationOptions;
  chartOptionsThree: ChartConfigurationOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartConfigurationOptions;
  chartOptionsFour: ChartConfigurationOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartConfigurationOptions;
  tableOptions: PivotConfiguration = { ...optionsTable } as PivotConfiguration;


  dimensions: Dimension[] = dimensionsData as Dimension[];

  ngOnInit(): void {
    const dimensions = dimensionsData as Dimension[];
    const rowData = data as RowData[];

    //chart one config
    this.chartOptionsOne.filterLastYear = true;
    this.chartOptionsOne.type = 'pie';
    this.chartOptionsOne.xAxis.firstLevel = 117;

    this.datasetOne = new Dataset({ dimensions, enableRollUp: true, rowData, id: 1 });
    this.datasetOne.dataProvider.filters = {
      filter: [],
      rollUp: ['Sector de gestión', 'Sexo']
    };

    //chart two config
    this.chartOptionsTwo.filterLastYear = true;
    this.chartOptionsTwo.type = 'pie';
    this.chartOptionsTwo.xAxis.firstLevel = 54;

    this.datasetTwo = new Dataset({ dimensions, enableRollUp: true, rowData, id: 1 });
    this.datasetTwo.dataProvider.filters = {
      filter: [],
      rollUp: ['Sexo', 'Condición']
    };

    //chart three config
    this.chartOptionsThree.filterLastYear = true;
    this.chartOptionsThree.type = 'pie';
    this.chartOptionsThree.xAxis.firstLevel = 12;
    this.chartOptionsThree.tooltip.shared = false;

    this.datasetThree = new Dataset({ dimensions, enableRollUp: true, rowData, id: 1 });
    this.datasetThree.dataProvider.filters = {
      filter: [],
      rollUp: ['Sector de gestión', 'Condición']
    };

    //chart four config
    this.chartOptionsFour.xAxis.secondLevel = 12;
    this.chartOptionsFour.stacked = 'Condición';
    this.chartOptionsFour.tooltip.shared = true;

    this.datasetFour = new Dataset({ dimensions, enableRollUp: true, rowData, id: 1 });
    this.datasetFour.dataProvider.filters = {
      filter: [],
      rollUp: ['Sector de gestión']
    };
  }

  filter() {

    const filter = this.dimensions.map(dimension =>
    ({
      name: dimension.nameView,
      items: dimension.items.filter(item => item.selected).map(item => item.name)
    }));

    const datasetFilterOne = this.datasetOne.dataProvider.filters
    datasetFilterOne.filter = [...cloneDeep(filter)];
    this.datasetOne.applyFilters(datasetFilterOne);

    const datasetFilterTwo = this.datasetTwo.dataProvider.filters;
    datasetFilterTwo.filter = [...cloneDeep(filter)];
    this.datasetTwo.applyFilters(datasetFilterTwo);

    const datasetFilterThree = this.datasetThree.dataProvider.filters;
    datasetFilterThree.filter = [...cloneDeep(filter)];
    this.datasetThree.applyFilters(datasetFilterThree);

    const datasetFilterFour = this.datasetFour.dataProvider.filters;
    datasetFilterFour.filter = [...cloneDeep(filter)];
    this.datasetFour.applyFilters(datasetFilterFour);
  }
}
