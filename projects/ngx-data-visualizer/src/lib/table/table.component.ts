import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
export class TableComponent implements OnInit, OnChanges {
  @Input() tableConfiguration!: TableConfiguration;
  @ViewChild('pivotTable', { static: true }) pivotTable!: ElementRef;

  constructor(private tableService: TableService) { }

  // @HostListener('window:resize')
  // onResize() {
  //   TableHelper.stickyTable(this.pivotTable.nativeElement);
  // }

  ngOnInit() {
    this.configure();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && !changes['tableConfiguration'].firstChange) {
      this.configure();
    }
  }

  configure() {
    const pivotConfig = this.tableService.getTableConfiguration(this.tableConfiguration);
    this.render(pivotConfig);
  }

  getHtmlTable() {
    const tableHtml = this.pivotTable.nativeElement;
    tableHtml.firstChild.classList.add('table', 'table-bordered');
    return tableHtml.innerHTML;
  }

  private render(pivotConfig: PivotConfiguration) {
    TableHelper.renderPivot(this.pivotTable.nativeElement, this.tableConfiguration.data.getData(), pivotConfig);
    TableHelper.stickyTable(this.pivotTable.nativeElement);
  }
}
