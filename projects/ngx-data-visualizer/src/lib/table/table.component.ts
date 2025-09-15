import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
} from "@angular/core";

import { TableService } from "./services/table.service";
import { TableConfiguration, TableOptions } from "./types/table-base";
import { TableHelperService } from "./utils/table-helper.service";

@Component({
  selector: "lib-table",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  private readonly tableService = inject(TableService);
  private readonly tableHelperService = inject(TableHelperService);

  protected readonly tableConfiguration = input.required<TableConfiguration>();

  @ViewChild("pivotTable", { static: true })
  private readonly pivotTable!: ElementRef<HTMLDivElement>;

  private readonly configEffect = effect(() => {
    const config = this.tableConfiguration();
    if (config) {
      this.configure();
    }
  });

  public configure(): void {
    const config = this.tableConfiguration();
    const { dataset, options } = config;

    const aliasMap: Record<string | number, string> = {};
    const derivedAttributes: Record<
      string,
      (record: Record<string, unknown>) => unknown
    > = {};

    for (const dim of dataset.getActiveDimensions()) {
      const dataKey = dataset.getDimensionKey(dim.id);
      if (dataKey) {
        aliasMap[dim.id] = dim.nameView;
        aliasMap[dim.name] = dim.nameView;
        aliasMap[dim.nameView] = dim.nameView;
        derivedAttributes[dim.nameView] = (record) => record[dataKey];
      }
    }

    const translatedCols = options.cols
      .map((idOrName: string | number) => aliasMap[idOrName])
      .filter(Boolean);
    const translatedRows = options.rows
      .map((idOrName: string | number) => aliasMap[idOrName])
      .filter(Boolean);

    const enrichedConfig: TableConfiguration = {
      ...config,
      options: {
        ...options,
        cols: translatedCols,
        rows: translatedRows,
        derivedAttributes: derivedAttributes,
      },
    };

    const pivotConfig = this.tableService.getTableConfiguration(enrichedConfig);
    this.render(pivotConfig);
  }

  public getHtmlTable(): string {
    const tableElement = this.pivotTable.nativeElement;
    const firstChild = tableElement.firstElementChild;

    if (firstChild) {
      firstChild.classList.add("table", "table-bordered");
    }

    return tableElement.innerHTML;
  }

  public getTableElement(): HTMLElement | null {
    return this.pivotTable?.nativeElement || null;
  }

  public onThemeApplied(): void {
    setTimeout(() => {
      const tableElement = this.getTableElement();
      if (tableElement instanceof HTMLDivElement) {
        this.tableHelperService.stickyTable(tableElement);
      }
    }, 5);
  }

  private render(pivotConfig: TableOptions): void {
    const tableElement = this.pivotTable.nativeElement;
    const tableData = this.tableConfiguration().dataset.dataProvider.getData();

    if (tableElement instanceof HTMLDivElement) {
      this.tableHelperService.renderPivot(tableElement, tableData, pivotConfig);
      this.tableHelperService.stickyTable(tableElement);
    } else {
      throw new Error("El elemento pivotTable debe ser un HTMLDivElement");
    }
  }
}
