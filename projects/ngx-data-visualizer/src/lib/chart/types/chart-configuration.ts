import { Type } from "@angular/core";
import { EChartsOption } from "echarts";
import { EchartsComponent } from "../echart/echarts.component";
import { ChartLibraryOptions } from "./chart-base";
import { ChartData } from "../utils/chart-data";
import { Dataset } from "../../services/dataset";

/**
 * Interfaz específica para las opciones de configuración de ECharts
 */
export type EChartsLibraryOptions = EChartsOption;

/**
 * Interfaz que define las opciones de configuración para un gráfico
 */
export interface ChartConfigurationOptions {
  /** Tipo de gráfico (ej: 'column', 'line', 'pie', etc.) */
  type: string;
  /** Título del gráfico */
  title?: string;
  /** Indica si el gráfico está apilado y el nombre del grupo de apilamiento */
  stacked: string | null;
  /** Configuración del eje X */
  xAxis: {
    /** Título del eje X */
    title: string,
    /** Ángulo de rotación de las etiquetas en grados */
    rotateLabels: number | null,
    /** Nivel de agrupación primario */
    firstLevel: number,
    /** Nivel de agrupación secundario (opcional) */
    secondLevel: number | null
  },
  /** Configuración del eje Y */
  yAxis: {
    /** Título del eje Y */
    title: string,
    /** Valor máximo del eje Y */
    max: number | null
  },
  /** Configuración del tooltip */
  tooltip: {
    /** Indica si el tooltip es compartido entre series */
    shared: boolean,
    /** Número de decimales a mostrar */
    decimals: number | null,
    /** Sufijo para los valores */
    suffix: string | null,
    /** Formato personalizado para los valores */
    format: string | null,
    /** Indica si se muestra el total en el tooltip */
    showTotal: boolean
  },
  /** Configuración de las leyendas */
  legends: {
    /** Indica si las leyendas están habilitadas */
    enabled: boolean,
    /** Indica si se muestran las leyendas */
    show: boolean,
    /** Posición de las leyendas */
    position: string
  },
  /** Configuración del navegador */
  navigator: {
    /** Indica si se muestra el navegador */
    show: boolean,
    /** Valor inicial del navegador */
    start: number | null,
    /** Valor final del navegador */
    end: number | null
  },
  /** Array de colores personalizados para las series */
  colors?: string[],
  /** Ancho del gráfico */
  width: number | null,
  /** Alto del gráfico */
  height: number | string | null,
  /** Indica si se filtra el último año */
  filterLastYear: boolean,
  /** Indica si se muestra la leyenda de años */
  showYearsLegend: boolean,
  /** Indica si los valores se muestran en porcentaje */
  toPercent: boolean,
  /** Unidad de medida para los valores */
  measureUnit: string;
  /** Indica si el gráfico está en modo vista previa */
  isPreview: boolean;
  /** Indica si se deshabilita la actualización automática */
  disableAutoUpdate: boolean;
}

/**
 * Opciones por defecto para la configuración del gráfico
 */
export const DEFAULT_OPTIONS: ChartConfigurationOptions = {
  type: 'column',
  title: '',
  stacked: null,
  xAxis: {
    title: '',
    rotateLabels: null,
    firstLevel: 0,
    secondLevel: null
  },
  yAxis: {
    title: '',
    max: null
  },
  tooltip: {
    shared: false,
    decimals: null,
    suffix: null,
    format: null,
    showTotal: false
  },
  legends: {
    enabled: true,
    show: false,
    position: ''
  },
  navigator: {
    show: false,
    start: null,
    end: null
  },
  width: null,
  height: null,
  filterLastYear: false,
  showYearsLegend: false,
  toPercent: false,
  measureUnit: '',
  isPreview: false,
  disableAutoUpdate: false
}

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
  options: ChartConfigurationOptions;
  /** Indica si el gráfico está en modo vista previa */
  preview: boolean;
  /** Configuración de las series del gráfico */
  seriesConfig: SeriesConfig;
}
