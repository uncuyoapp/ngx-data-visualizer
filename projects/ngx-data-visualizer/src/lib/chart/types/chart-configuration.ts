import { Type } from "@angular/core";
import { EChartsOption } from "echarts";
import { EchartsComponent } from "../echart/echarts.component";
import { ChartLibraryOptions } from "./chart-base";
import { ChartData } from "../utils/chart-data";
import { Dataset } from "../../services/dataset";
import { ChartOptions } from "../../types/data.types";

// Re-exportar ChartOptions para que esté disponible desde este módulo
export { ChartOptions } from "../../types/data.types";

/**
 * Interfaz específica para las opciones de configuración de ECharts
 */
export type EChartsLibraryOptions = EChartsOption;

/**
 * Interfaz que define la configuración de una serie del gráfico
 */
export interface SeriesConfig {
  /** Campo para el eje X primario */
  x1: string;
  /** Campo para el eje X secundario (opcional) */
  x2?: string;
  /** Grupo de apilamiento para la serie */
  stack: string | null;
  /** Campo de medida para la serie */
  measure?: string;
}

/**
 * Interfaz principal que define la configuración completa del gráfico
 */
export interface ChartConfiguration {
  /** Componente de renderizado del gráfico */
  chartRenderType: Type<EchartsComponent>;
  /** Dataset con los datos del gráfico */
  dataset: Dataset;
  /** Datos procesados del gráfico */
  chartData: ChartData;
  /** Indica si el gráfico está expandido */
  expanded: boolean;
  /** Opciones específicas de la librería de gráficos */
  libraryOptions: ChartLibraryOptions;
  /** Opciones de configuración del gráfico */
  options: ChartOptions;
  /** Indica si el gráfico está en modo vista previa */
  preview: boolean;
  /** Configuración de las series del gráfico */
  seriesConfig: SeriesConfig;
}
