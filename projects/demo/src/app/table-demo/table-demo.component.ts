import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Dataset, Dimension, PivotConfiguration, TableDirective, ThemeService } from 'ngx-data-visualizer';
import dashDimensions from '../../assets/data/dash-dimensions.json';
import exampleData2 from '../../assets/data/data.json';
import dimensions from '../../assets/data/dimensions.json';
import exampleData from '../../assets/data/example-data-2.json';

@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [CommonModule, RouterModule, TableDirective],
  templateUrl: './table-demo.component.html',
  styleUrls: ['./table-demo.component.scss']
})
export class TableDemoComponent implements AfterViewInit {
  // Dataset 1: Datos de ejemplo con dimensiones del dashboard
  dataset1 = new Dataset({
    rowData: exampleData,
    id: 1,
    dimensions: dashDimensions as Dimension[],
    enableRollUp: true
  });

  // Dataset 2: Datos de ejemplo con dimensiones de departamentos
  dataset2 = new Dataset({
    rowData: exampleData2,
    id: 2,
    dimensions: dimensions as Dimension[],
    enableRollUp: true
  });

  // Ejemplo 1: Configuración básica con una columna y múltiples filas
  basicConfig: PivotConfiguration = {
    cols: ['Año'],
    rows: ['Condición', 'Sector de gestión', 'Sexo'],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true
  };

  // Ejemplo 2: Configuración con múltiples columnas y una fila
  multiColConfig: PivotConfiguration = {
    cols: ['Año', 'Sexo'],
    rows: ['Condición'],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true
  };

  // Ejemplo 3: Configuración con ordenamiento personalizado
  sortedConfig: PivotConfiguration = {
    cols: ['Año'],
    rows: ['Condición', 'Sector de gestión'],
    digitsAfterDecimal: 0,
    sorters: [
      {
        name: 'Año',
        items: [
          { name: '2012', order: 0 },
          { name: '2011', order: 1 },
          { name: '2010', order: 2 },
          { name: '2013', order: 3 },
          { name: '2014', order: 4 },
          { name: '2015', order: 5 },
          { name: '2016', order: 6 },
          { name: '2017', order: 7 },
          { name: '2018', order: 8 },
        ]
      }
    ],
    totalRow: true,
    totalCol: true
  };

  // Ejemplo 4: Configuración con sufijo
  suffixConfig: PivotConfiguration = {
    cols: ['Año'],
    rows: ['Condición', 'Sector de gestión', 'Sexo'],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
    suffix: '%'
  };

  // Ejemplo 5: Configuración para el segundo dataset
  dataset2Config: PivotConfiguration = {
    cols: ['Departamentos'],
    rows: ['Año'],
    digitsAfterDecimal: 0,
    sorters: [
      {
        name: 'Departamentos de Mendoza',
        items: dimensions[0].items.map((item, index) => ({
          name: item.name,
          order: index
        }))
      }
    ],
    totalRow: true,
    totalCol: true
  };

  @ViewChild('tableTheme', { read: TableDirective }) table!: TableDirective;
  @ViewChild('table1', { read: TableDirective }) table1!: TableDirective;
  @ViewChild('table2', { read: TableDirective }) table2!: TableDirective;

  constructor(private readonly themeService: ThemeService) { }

  ngAfterViewInit(): void {
    // Establecer el tema por defecto después de que la vista esté inicializada
    setTimeout(() => {
      this.themeService.setTheme('default', this.table);
    }, 100);
  }

  // Métodos genéricos para cambiar temas
  private setTheme(themeType: 'default' | 'material' | 'bootstrap', table: TableDirective): void {
    this.themeService.setTheme(themeType, table);
  }

  // Métodos para cambiar el tema de la tabla principal
  setDefaultTheme(): void {
    this.setTheme('default', this.table);
  }

  setMaterialTheme(): void {
    this.setTheme('material', this.table);
  }

  setBootstrapTheme(): void {
    this.setTheme('bootstrap', this.table);
  }

  // Métodos para cambiar el tema de la tabla 1
  setDefaultTheme1(): void {
    this.setTheme('default', this.table1);
  }

  setMaterialTheme1(): void {
    this.setTheme('material', this.table1);
  }

  setBootstrapTheme1(): void {
    this.setTheme('bootstrap', this.table1);
  }

  // Métodos para cambiar el tema de la tabla 2
  setDefaultTheme2(): void {
    this.setTheme('default', this.table2);
  }

  setMaterialTheme2(): void {
    this.setTheme('material', this.table2);
  }

  setBootstrapTheme2(): void {
    this.setTheme('bootstrap', this.table2);
  }

  // Ejemplo de personalización parcial del tema
  updateThemeWithCustomColors(): void {
    this.themeService.updateTheme({
      tableDataBg: '#d3d3d3',
      tableLabelBg: 'black',
      border: {
        color: 'red',
        width: '2px',
        style: 'dashed'
      }
    }, this.table);
  }
}