import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import cloneDeep from 'lodash.clonedeep';
import { ChartOptions, ChartDirective, Dataset, Dimension, TableOptions, RowData, TableDirective } from 'ngx-data-visualizer';
import optionsChart from '../../assets/data/chart-options-dash.json';
import dimensionsData from '../../assets/data/dash-dimensions.json';
import data from '../../assets/data/example-data-2.json';
import optionsTable from '../../assets/data/table-options-dash.json';

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
  chartOptionsOne: ChartOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartOptions;
  chartOptionsTwo: ChartOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartOptions;
  chartOptionsThree: ChartOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartOptions;
  chartOptionsFour: ChartOptions = JSON.parse(JSON.stringify(optionsChart)) as ChartOptions;
  tableOptions: TableOptions = { ...optionsTable } as TableOptions;


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
