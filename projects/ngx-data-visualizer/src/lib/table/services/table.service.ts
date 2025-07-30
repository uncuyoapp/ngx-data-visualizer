import { inject, Injectable } from '@angular/core';
import {
  TableOptions,
  TableConfiguration,
} from '../types/table-base';
import { JQueryService } from '../utils/jquery.service';
import { TableHelper } from '../utils/table-helper';

/**
 * Servicio para la configuración y gestión de tablas dinámicas.
 * Proporciona métodos para transformar configuraciones de tabla en formatos utilizables
 * por los componentes de visualización de datos.
 */
@Injectable({
  providedIn: 'root',
})
export class TableService {
  private readonly jQueryService = inject(JQueryService);

  /**
   * Crea una instancia del servicio de tabla.
   */
  constructor() {
    // Inicializar el TableHelper con el servicio de jQuery
    TableHelper.initialize(this.jQueryService);
  }

  /**
   * Genera una configuración de tabla dinámica a partir de una configuración de tabla base.
   * @param configuration Configuración de la tabla que incluye dimensiones y opciones.
   * @returns Configuración de tabla dinámica lista para ser utilizada por los componentes de visualización.
   */
  public getTableConfiguration(
    configuration: TableConfiguration
  ): TableOptions {
    const cols =
      configuration.options.cols?.filter((col) =>
        configuration.dimensions.find((d) => d.nameView === col)
      ) || [];
    const rows =
      configuration.options.rows?.filter((row) =>
        configuration.dimensions.find((d) => d.nameView === row)
      ) || [];

    return {
      cols: cols,
      rows: rows,
      digitsAfterDecimal: configuration.options.digitsAfterDecimal,
      totalCol: configuration.options.totalCol,
      totalRow: configuration.options.totalRow,
      sorters: configuration.dimensions.map((dimension) => ({
        name: dimension.nameView,
        items: dimension.items.map((item: { name: string; order?: number }, index: number) => ({
          name: item.name,
          order: item.order ?? index,
        })),
      })),
      suffix: configuration.options.suffix ?? '',
    };
  }
}
