import { Injectable } from '@angular/core';
import { PivotConfiguration, TableConfiguration } from '../table/table-configuration';


@Injectable({
  providedIn: 'root'
})
export class TableService {

  public getTableConfiguration(configuration: TableConfiguration): PivotConfiguration {
    const cols = configuration.options.cols?.filter(col => configuration.dimensions.find(d => d.nameView === col)) || [];
    const rows = configuration.options.rows?.filter(row => configuration.dimensions.find(d => d.nameView === row)) || [];

    return {
      cols: cols,
      rows: rows,
      digitsAfterDecimal: configuration.options.digitsAfterDecimal,
      totalCol: configuration.options.totalCol,
      totalRow: configuration.options.totalRow,
      sorters: configuration.dimensions.map(a => ({
        name: a.nameView,
        items: a.items.map((item,index) => ({ name: item.name, order: item.order ?? index }))
      })),
      suffix: configuration.options.suffix
    };
  }

}
