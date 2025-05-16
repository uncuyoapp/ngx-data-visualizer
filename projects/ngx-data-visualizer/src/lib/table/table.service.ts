import { Injectable } from '@angular/core';
import { PivotConfiguration, TableConfiguration } from '../table/table-configuration';
import { TableHelper } from './table-helper';
import { JQueryService } from '../utils/jquery.service';

/**
 * Servicio para la configuración y gestión de tablas dinámicas.
 * Proporciona métodos para transformar configuraciones de tabla en formatos utilizables
 * por los componentes de visualización de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class TableService {

  /**
   * Crea una instancia del servicio de tabla.
   * @param jQueryService Servicio que proporciona funcionalidad de jQuery.
   */
  constructor(private jQueryService: JQueryService) {
    // Inicializar el TableHelper con el servicio de jQuery
    TableHelper.initialize(jQueryService);
  }

  /**
   * Genera una configuración de tabla dinámica a partir de una configuración de tabla base.
   * @param configuration Configuración de la tabla que incluye dimensiones y opciones.
   * @returns Configuración de tabla dinámica lista para ser utilizada por los componentes de visualización.
   */
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
