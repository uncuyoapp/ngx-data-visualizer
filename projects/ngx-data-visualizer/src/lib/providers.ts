import { EnvironmentProviders, Provider } from "@angular/core";
import { NGX_ECHARTS_CONFIG } from "ngx-echarts";
import { JQueryService } from "./table/utils/jquery.service";
import { TableHelperService } from "./table/utils/table-helper.service";

/**
 * Configura los proveedores necesarios para los componentes de GRÁFICOS de ngx-data-visualizer.
 * Debe ser llamado en la configuración raíz de la aplicación si se van a utilizar gráficos.
 * @returns Un conjunto de proveedores para ngx-echarts.
 */
export function provideDataVisualizerCharts(): (
  | Provider
  | EnvironmentProviders
)[] {
  return [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({
        echarts: () => import("echarts").then((m) => m),
      }),
    },
  ];
}

/**
 * Configura los proveedores necesarios para los componentes de TABLAS de ngx-data-visualizer.
 * Registra los servicios internos necesarios para la funcionalidad de tablas,
 * encapsulando la gestión de dependencias como jQuery y PivotTable.
 * @returns Un array de proveedores específicos para las tablas.
 */
export function provideDataVisualizerTables(): Provider[] {
  return [JQueryService, TableHelperService];
}
