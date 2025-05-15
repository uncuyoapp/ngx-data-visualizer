import { ComponentRef, Directive, OnDestroy, ViewContainerRef, effect, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Dataset } from './dataset';
import { ExcelService } from './table/excel.service';
import { PivotConfiguration, TableConfiguration } from './table/table-configuration';
import { TableComponent } from './table/table.component';

@Directive({
  selector: 'libTable, [libTable]',
  standalone: true,
  exportAs: 'libTable'
})
export class TableDirective implements OnDestroy {
  dataset = input.required<Dataset>();
  options = input.required<PivotConfiguration>();

  tableConfiguration!: TableConfiguration;
  tableRenderComponentRef!: ComponentRef<TableComponent>;
  tableComponent!: TableComponent;

  subscription!: Subscription;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private excelService: ExcelService
  ) {

    effect(() => {
      this.createTableComponent();
      this.subscribeDataChanges();
    })
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  createTableComponent() {
    this.viewContainerRef.clear();
    this.tableConfiguration = {
      data: this.dataset().dataProvider,
      dimensions: this.dataset().dimensions,
      options: this.options()
    }
    this.tableRenderComponentRef = this.viewContainerRef.createComponent<TableComponent>(TableComponent);
    this.tableComponent = this.tableRenderComponentRef.instance;
    // Acceder al setter de tableConfiguration a través de la propiedad especial
    (this.tableComponent as any).tableConfiguration = this.tableConfiguration;
  }

  updateTable() {
    this.tableConfiguration.dimensions = this.dataset().dataProvider.getDimensions();
    this.tableComponent.configure();
  }

  private subscribeDataChanges() {
    this.subscription = this.dataset().dataUpdated.subscribe(() => {
      this.updateTable();
    })
  }

  export(type: 'html' | 'xlsx', name?: string) {
    if (type === 'html') {
      return this.tableComponent?.getHtmlTable();
    } else if (type === 'xlsx') {
      return this.excelService.exportAsExcelFile(
        this.tableComponent?.pivotTable?.nativeElement,
        name ?? 'tabla'
      );
    }
  }
}
