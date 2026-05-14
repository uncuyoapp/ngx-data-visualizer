import { EnvironmentProviders, InjectionToken, Provider } from "@angular/core";
import { NGX_ECHARTS_CONFIG } from "ngx-echarts";
import { JQueryService } from "./table/utils/jquery.service";
import { TableHelperService } from "./table/utils/table-helper.service";

/**
 * Interfaz para la configuración global de la librería.
 */
export interface DataVisualizerConfig {
  /** Colores predeterminados para los gráficos si no se especifican otros */
  defaultColors?: string[];
  /** Alto predeterminado para los gráficos (fallback si el contenedor es 0px) */
  defaultHeight?: number | string;
  /** Ancho predeterminado para los gráficos (fallback si el contenedor es 0px) */
  defaultWidth?: number | string;
}

/**
 * Token de inyección para la configuración global de la librería.
 */
export const DATA_VISUALIZER_CONFIG = new InjectionToken<DataVisualizerConfig>(
  "DATA_VISUALIZER_CONFIG",
);

/**
 * Configura los proveedores necesarios para los componentes de GRÁFICOS de ngx-data-visualizer.
 * Debe ser llamado en la configuración raíz de la aplicación si se van a utilizar gráficos.
 * @param config Configuración opcional para los gráficos.
 * @returns Un conjunto de proveedores para ngx-echarts y la configuración de la librería.
 */
export function provideDataVisualizerCharts(
  config?: DataVisualizerConfig,
): (Provider | EnvironmentProviders)[] {
  return [
    {
      provide: DATA_VISUALIZER_CONFIG,
      useValue: config || {},
    },
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
