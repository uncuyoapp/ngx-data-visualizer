import { inject, Injectable } from "@angular/core";
import { TableOptions, TableConfiguration } from "../types/table-base";
import { JQueryService } from "../utils/jquery.service";
import { TableHelper } from "../utils/table-helper";

/**
 * Servicio para la configuración y gestión de tablas dinámicas.
 * Proporciona métodos para transformar configuraciones de tabla en formatos utilizables
 * por los componentes de visualización de datos.
 */
@Injectable({
  providedIn: "root",
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
    configuration: TableConfiguration,
  ): TableOptions {
    const { dataset, options } = configuration;

    const pivotSorters: { name: string; items: { name: string; order: number }[] }[] = [];
    const configuredDimensions = new Set<string>();

    if (options.sorters) {
      for (const configSorter of options.sorters) {
        const dimension = dataset.getAllDimensions().find(
          (d) => d.id === configSorter.name || d.name === configSorter.name || d.nameView === configSorter.name
        );

        if (dimension) {
          const sorterName = dimension.nameView;
          pivotSorters.push({
            name: sorterName,
            items: configSorter.items,
          });
          configuredDimensions.add(sorterName);
        }
      }
    }

    for (const dim of dataset.getAllDimensions()) {
      if (!configuredDimensions.has(dim.nameView)) {
        pivotSorters.push({
          name: dim.nameView,
          items: dim.items.map((item: { name: string; order?: number }, index: number) => ({
            name: item.name,
            order: item.order ?? index,
          })),
        });
      }
    }

    return {
      ...options,
      sorters: pivotSorters,
    };
  }
}
