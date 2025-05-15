import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, effect, input } from '@angular/core';
import { PivotConfiguration, TableConfiguration } from './table-configuration';
import { TableHelper } from './table-helper';
import { TableService } from './table.service';

@Component({
  selector: 'lib-table',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnInit {
  tableConfiguration = input.required<TableConfiguration>();
  @ViewChild('pivotTable', { static: true }) pivotTable!: ElementRef;

  // Inicializador de campo para el efecto
  private configEffect = effect(() => {
    // Este efecto se activará cada vez que tableConfiguration cambie
    const config = this.tableConfiguration();
    if (config) {
      this.configure();
    }
  });

  constructor(private tableService: TableService) { }

  // @HostListener('window:resize')
  // onResize() {
  //   TableHelper.stickyTable(this.pivotTable.nativeElement);
  // }

  ngOnInit() {
    this.configure();
  }

  configure() {
    const pivotConfig = this.tableService.getTableConfiguration(this.tableConfiguration());
    this.render(pivotConfig);
  }

  getHtmlTable() {
    const tableHtml = this.pivotTable.nativeElement;
    tableHtml.firstChild.classList.add('table', 'table-bordered');
    return tableHtml.innerHTML;
  }

  private render(pivotConfig: PivotConfiguration) {
    TableHelper.renderPivot(this.pivotTable.nativeElement, this.tableConfiguration().data.getData(), pivotConfig);
    TableHelper.stickyTable(this.pivotTable.nativeElement);
  }
}
