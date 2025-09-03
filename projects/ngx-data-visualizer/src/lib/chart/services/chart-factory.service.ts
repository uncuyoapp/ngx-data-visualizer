import { Injectable, Type } from "@angular/core";
import cloneDeep from "lodash.clonedeep";
import { EChartsOption } from "echarts";
import { Dataset } from "../../services/dataset";
import { Dimension, Filters } from "../../types/data.types";
import { ChartUpdater } from "./chart-updater.service";
import { EchartsComponent } from "../echart/echarts.component";
import { EChartParser } from "../echart/utils/echart-parser";
import { ParserOptions } from "../types/parser-options";
import { ChartConfiguration, ChartOptions, DEFAULT_OPTIONS } from "../types/chart-configuration";
import { ChartData } from "../utils/chart-data";

/**
 * @description
 * Servicio de tipo "Fábrica" (Factory) para crear instancias de `ChartConfiguration`.
 */
@Injectable({
  providedIn: "root",
})
export class ChartFactory {
  private readonly parserOptions: ParserOptions;
  private readonly chartRenderEngine: Type<EchartsComponent>;

  constructor(private readonly chartUpdater: ChartUpdater) {
    this.parserOptions = new EChartParser();
    this.chartRenderEngine = EchartsComponent;
  }

  /**
   * @description
   * Crea y devuelve una configuración de gráfico completa para un único gráfico.
   * @param dataset El conjunto de datos para el gráfico.
   * @param options Las opciones de visualización y comportamiento del gráfico.
   * @returns Una instancia de `ChartConfiguration` completamente inicializada.
   */
  public getChartConfiguration(
    dataset: Dataset,
    options: ChartOptions
  ): ChartConfiguration {
    if (!dataset) {
      throw new Error("El parámetro dataset es requerido");
    }
    const chartConfiguration: ChartConfiguration = {
      dataset,
      options: { ...cloneDeep(DEFAULT_OPTIONS), ...options },
      chartData: {} as ChartData,
      chartRenderType: this.chartRenderEngine,
      expanded: false,
      libraryOptions: {},
      preview: false,
      seriesConfig: {
        x1: "",
        measure: "",
        stack: null,
      },
    };
    this.chartUpdater.updateChartData(chartConfiguration);
    chartConfiguration.libraryOptions = this.getLibraryOptions(
      chartConfiguration.options
    );
    return chartConfiguration;
  }

  /**
   * @description
   * Genera múltiples configuraciones de gráfico a partir de un único dataset,
   * dividiendo los datos según una dimensión específica.
   * @param dataset El conjunto de datos original.
   * @param options Las opciones base para cada gráfico generado.
   * @param dimension La dimensión utilizada para dividir los datos.
   * @returns Un array de `ChartConfiguration`.
   */
  public getSplitConfiguration(
    dataset: Dataset,
    options: ChartOptions,
    dimension: Dimension
  ): ChartConfiguration[] {
    if (!dataset || !dimension) {
      throw new Error('Los parámetros dataset y dimension son requeridos');
    }

    const dimensionKey = dataset.getDimensionKey(dimension.id);
    if (!dimensionKey) {
      console.error(`No se pudo encontrar la clave de datos para la dimensión de división: ${dimension.nameView}`);
      return [];
    }

    return dimension.items
      .filter(item => item.selected)
      .map(item => {
        const datasetCopy = new Dataset({
          id: dataset.id,
          dimensions: dataset.getAllDimensions(),
          enableRollUp: dataset.enableRollUp,
          rowData: dataset.getRawData(),
        });

        const baseFilters = dataset.dataProvider.filters;
        if (baseFilters) {
          const newFilters = new Filters();
          newFilters.rollUp = [...baseFilters.rollUp];
          newFilters.filter = baseFilters.filter.map(f => ({ ...f }));
          datasetCopy.dataProvider.filters = newFilters;
        } else {
          datasetCopy.dataProvider.filters = new Filters();
        }

        const chartConfig: ChartConfiguration = {
          dataset: datasetCopy,
          options: {
            ...cloneDeep(DEFAULT_OPTIONS),
            ...options,
            title: item.name,
            legends: { ...options.legends, show: false },
          },
          chartData: {} as ChartData,
          chartRenderType: this.chartRenderEngine,
          expanded: false,
          libraryOptions: {},
          preview: false,
          seriesConfig: {
            x1: '',
            measure: '',
            stack: null,
          },
        };

        chartConfig.dataset.dataProvider.filters.rollUp.push(dimensionKey);
        chartConfig.dataset.dataProvider.filters.filter.push({
          name: dimensionKey,
          items: [item.name],
        });

        this.chartUpdater.updateChartData(chartConfig);
        chartConfig.libraryOptions = this.getLibraryOptions(chartConfig.options);
        return chartConfig;
      });
  }

  /**
   * @description
   * Obtiene las opciones específicas de la librería de gráficos (ECharts) según el modo (preview o completo).
   * @param options Las opciones generales del gráfico.
   * @returns Las opciones de ECharts correspondientes.
   * @private
   */
  private getLibraryOptions(options: ChartOptions): EChartsOption {
    if (!options) {
      throw new Error("El parámetro options es requerido");
    }
    return options.isPreview
      ? (this.parserOptions.getPreviewOptions(options) as EChartsOption)
      : (this.parserOptions.getFullOptions(options) as EChartsOption);
  }
}
