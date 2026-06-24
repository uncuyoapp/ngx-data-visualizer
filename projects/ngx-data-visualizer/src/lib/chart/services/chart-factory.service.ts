import { Injectable, Type, inject, Optional } from "@angular/core";
import { EChartsOption } from "echarts";
import cloneDeep from "lodash.clonedeep";
import { Dataset } from "../../services/dataset";
import { Filters } from "../../services/types";
import { DEFAULT_OPTIONS } from "../../types/constants";
import { ChartOptions, Dimension } from "../../types/data.types";
import { EchartsComponent } from "../echart/echarts.component";
import { EChartParser } from "../echart/utils/echart-parser";
import { ChartConfiguration } from "../types/chart-configuration";
import { ParserOptions } from "../types/parser-options";
import { ChartData } from "../utils/chart-data";
import { ChartUpdater } from "./chart-updater.service";
import { DATA_VISUALIZER_CONFIG, DataVisualizerConfig } from "../../providers";

/**
 * Servicio de tipo "Fábrica" (Factory) para crear instancias de `ChartConfiguration`.
 * Centraliza la creación y división de configuraciones de gráficos.
 */
@Injectable({
  providedIn: "root",
})
export class ChartFactory {
  private readonly chartUpdater = inject(ChartUpdater);
  private readonly config = inject(DATA_VISUALIZER_CONFIG, { optional: true });
  private readonly parserOptions: ParserOptions;
  private readonly chartRenderEngine: Type<EchartsComponent>;

  constructor() {
    this.parserOptions = new EChartParser();
    this.chartRenderEngine = EchartsComponent;
  }

  /**
   * Crea y devuelve una configuración de gráfico completa para un único gráfico.
   * @param dataset El conjunto de datos para el gráfico.
   * @param options Las opciones de visualización y comportamiento del gráfico.
   * @returns Una instancia de `ChartConfiguration` completamente inicializada.
   * @throws {Error} Si el parámetro dataset no está definido.
   */
  public getChartConfiguration(
    dataset: Dataset,
    options: ChartOptions,
  ): ChartConfiguration {
    if (!dataset) {
      throw new Error("El parámetro dataset es requerido");
    }

    const mergedOptions = { ...cloneDeep(DEFAULT_OPTIONS), ...options };

    // Si el usuario no proveyó colores, usamos los del proveedor si existen
    if (!mergedOptions.colors && this.config?.defaultColors) {
      mergedOptions.colors = this.config.defaultColors;
    }

    const chartConfiguration: ChartConfiguration = {
      dataset,
      options: mergedOptions,
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
      chartConfiguration.options,
    );
    return chartConfiguration;
  }

  /**
   * Genera múltiples configuraciones de gráfico a partir de un único dataset,
   * dividiendo los datos según una dimensión específica.
   * @param dataset El conjunto de datos original.
   * @param options Las opciones base para cada gráfico generado.
   * @param dimension La dimensión utilizada para dividir los datos.
   * @returns Un array de `ChartConfiguration`.
   * @throws {Error} Si los parámetros dataset o dimension no están definidos.
   */
  public getSplitConfiguration(
    dataset: Dataset,
    options: ChartOptions,
    dimension: Dimension,
  ): ChartConfiguration[] {
    if (!dataset || !dimension) {
      throw new Error("Los parámetros dataset y dimension son requeridos");
    }

    const dimensionKey = dataset.getDimensionKey(dimension.id);
    if (!dimensionKey) {
      console.error(
        `No se pudo encontrar la clave de datos para la dimensión de división: ${dimension.nameView}`,
      );
      return [];
    }

    return dimension.items
      .filter((item) => item.selected)
      .map((item) => {
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
          newFilters.filter = baseFilters.filter.map((f) => ({ ...f }));
          datasetCopy.dataProvider.filters = newFilters;
        } else {
          datasetCopy.dataProvider.filters = new Filters();
        }

        const mergedOptions = {
          ...cloneDeep(DEFAULT_OPTIONS),
          ...options,
          title: item.name,
          legends: { ...options.legends, show: false },
        };

        if (!mergedOptions.colors && this.config?.defaultColors) {
          mergedOptions.colors = this.config.defaultColors;
        }

        const chartConfig: ChartConfiguration = {
          dataset: datasetCopy,
          options: mergedOptions,
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

        chartConfig.dataset.dataProvider.filters.rollUp.push(dimensionKey);
        chartConfig.dataset.dataProvider.filters.filter.push({
          name: dimensionKey,
          items: [item.name],
        });

        this.chartUpdater.updateChartData(chartConfig);
        chartConfig.libraryOptions = this.getLibraryOptions(
          chartConfig.options,
        );
        return chartConfig;
      });
  }

  /**
   * Obtiene las opciones específicas de la librería de gráficos (ECharts) según el modo (preview o completo).
   * @param options Las opciones generales del gráfico.
   * @returns Las opciones de ECharts correspondientes.
   * @throws {Error} Si el parámetro options no está definido.
   * @private
   */
  private getLibraryOptions(options: ChartOptions): EChartsOption {
    if (!options) {
      throw new Error("El parámetro options es requerido");
    }
    const libraryOptions = options.isPreview
      ? (this.parserOptions.getPreviewOptions(options) as EChartsOption)
      : (this.parserOptions.getFullOptions(options) as EChartsOption);

    // Configuración defensiva de tooltips para evitar recortes
    if (libraryOptions?.tooltip) {
      libraryOptions.tooltip = {
        ...(libraryOptions.tooltip as any),
        confine: true,
        appendTo: 'body'
      };
    }

    return libraryOptions;
  }
}
