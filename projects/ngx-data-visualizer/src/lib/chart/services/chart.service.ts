import { Injectable, Type } from "@angular/core";
import cloneDeep from "lodash.clonedeep";
import { DataProvider } from "../../services/data-provider";
import { DIMENSION_YEAR } from "../../types/constants";
import { Dataset } from "../../services/dataset";
import { Dimension, Filters, DimensionFilter } from "../../types/data.types";
import {
  ChartConfiguration,
  ChartOptions,
  DEFAULT_OPTIONS,
  SeriesConfig,
} from "../types/chart-configuration";
import { ChartData } from "../utils/chart-data";
import { EchartsComponent } from "../echart/echarts.component";
import { EChartParser } from "../echart/utils/echart-parser";
import { EChartsOption } from "echarts";
import { ParserOptions } from "../types/parser-options";

@Injectable({
  providedIn: "root",
})
export class ChartService {
  private readonly parserOptions: ParserOptions;
  private readonly chartRenderEngine: Type<EchartsComponent>;

  constructor() {
    this.parserOptions = new EChartParser();
    this.chartRenderEngine = EchartsComponent;
  }

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
    this.updateChartData(chartConfiguration);
    chartConfiguration.libraryOptions = this.getLibraryOptions(
      chartConfiguration.options
    );
    return chartConfiguration;
  }

  public getSplitConfiguration(
    dataset: Dataset,
    options: ChartOptions,
    dimension: Dimension
  ): ChartConfiguration[] {
    if (!dataset || !dimension) {
      throw new Error("Los parámetros dataset y dimension son requeridos");
    }
    return dimension.items
      .filter((item) => item.selected)
      .map((item) => {
        const datasetCopy = new Dataset(dataset);
        datasetCopy.dataProvider.filters = JSON.parse(
          JSON.stringify(
            dataset.dataProvider.filters || { rollUp: [], filter: [] }
          )
        );
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
            x1: "",
            measure: "",
            stack: null,
          },
        };
        if (!chartConfig.dataset.dataProvider.filters) {
          chartConfig.dataset.dataProvider.filters = new Filters();
        } else {
          const existingFilters = chartConfig.dataset.dataProvider.filters;
          if (!(existingFilters instanceof Filters)) {
            const filters = new Filters();
            const filtersAny = existingFilters as {
              rollUp?: unknown[];
              filter?: unknown[];
            };
            if (filtersAny.rollUp && Array.isArray(filtersAny.rollUp)) {
              filters.rollUp = [...(filtersAny.rollUp as string[])];
            }
            if (filtersAny.filter && Array.isArray(filtersAny.filter)) {
              filters.filter = [...(filtersAny.filter as DimensionFilter[])];
            }
            chartConfig.dataset.dataProvider.filters = filters;
          }
        }
        chartConfig.dataset.dataProvider.filters.rollUp.push(
          dimension.nameView
        );
        chartConfig.dataset.dataProvider.filters.filter.push({
          name: dimension.nameView,
          items: [item.name],
        });
        this.updateChartData(chartConfig);
        chartConfig.libraryOptions = this.getLibraryOptions(
          chartConfig.options
        );
        return chartConfig;
      });
  }

  public updateLibraryConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error("El parámetro chartConfiguration es requerido");
    }
    chartConfiguration.libraryOptions =
      this.parserOptions.applyChartConfigurations(
        chartConfiguration.options,
        chartConfiguration.libraryOptions
      ) as EChartsOption;
  }

  public updateSeriesConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error("El parámetro chartConfiguration es requerido");
    }
    const { chartData, seriesConfig, options, dataset } = chartConfiguration;
    const { rollUp } = chartData.dataProvider.filters;
    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error(
        "Se requiere al menos un eje (x1 o x2) en la configuración de series."
      );
    }
    if (options?.filterLastYear) {
      this.filterLastPeriod(chartConfiguration);
    }
    chartData.seriesConfig = this.initializeSeriesConfig(seriesConfig);
    if (this.canUseAxis(seriesConfig.x1, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x1;
      if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
        chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    } else if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x2;
      chartData.seriesConfig.x2 = undefined;
    } else if (this.canUseAxis(DIMENSION_YEAR, rollUp)) {
      chartData.seriesConfig.x1 = DIMENSION_YEAR;
    } else {
      const availableDimension = this.findAvailableDimension(
        dataset.dimensions,
        rollUp
      );
      if (availableDimension) {
        chartData.seriesConfig.x1 = availableDimension;
        chartData.seriesConfig.x2 = undefined;
      } else {
        throw new Error(
          "No se pudo encontrar una dimensión disponible para el eje X."
        );
      }
    }
  }

  private initializeSeriesConfig(seriesConfig: SeriesConfig): SeriesConfig {
    return {
      x1: "",
      x2: undefined,
      stack: seriesConfig.stack,
      measure: seriesConfig.measure,
    };
  }

  private canUseAxis(axis: string | undefined, rollUp: string[]): boolean {
    return axis ? rollUp.indexOf(axis) === -1 : false;
  }

  private findAvailableDimension(
    dimensions: Dimension[],
    rollUp: string[]
  ): string | null {
    const availableDimension = dimensions.find(
      (dimension) =>
        dimension.nameView && rollUp.indexOf(dimension.nameView) === -1
    );
    return availableDimension?.nameView ?? null;
  }

  private getLibraryOptions(options: ChartOptions): EChartsOption {
    if (!options) {
      throw new Error("El parámetro options es requerido");
    }
    return options.isPreview
      ? (this.parserOptions.getPreviewOptions(options) as EChartsOption)
      : (this.parserOptions.getFullOptions(options) as EChartsOption);
  }

  private resetFilters(arrayData: DataProvider) {
    arrayData.filters = new Filters();
  }

  private filterLastPeriod(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration?.dataset?.dataProvider) {
      return;
    }
    try {
      const lastPeriods = chartConfiguration.dataset.dataProvider
        .getItems(DIMENSION_YEAR)
        .slice(-1);
      if (lastPeriods.length > 0) {
        const lastPeriod = lastPeriods[0];
        const yearFilter =
          chartConfiguration.dataset.dataProvider.filters.filter.find(
            (f) => f.name === DIMENSION_YEAR
          );
        if (yearFilter) {
          yearFilter.items = [lastPeriod];
        } else {
          chartConfiguration.dataset.dataProvider.filters.filter.push({
            name: DIMENSION_YEAR,
            items: [lastPeriod],
          });
        }
      }
    } catch (error) {
      console.error("Error al filtrar el último período:", error);
    }
  }

  public updateChartData(chartConfiguration: ChartConfiguration): void {
    console.log(
      "[Debug 4] updateChartData en ChartService: Procesando nuevos datos."
    );
    if (!chartConfiguration?.dataset?.dataProvider) {
      throw new Error("El dataset o dataProvider no está definido");
    }
    const seriesConfig: SeriesConfig = {
      x1:
        chartConfiguration.dataset.dataProvider.dimensions.find(
          (d) => d.id === chartConfiguration.options?.xAxis?.firstLevel
        )?.nameView ?? "",
      x2: chartConfiguration.dataset.dataProvider.dimensions.find(
        (d) => d.id === chartConfiguration.options?.xAxis?.secondLevel
      )?.nameView,
      measure: chartConfiguration.options.measureUnit,
      stack: chartConfiguration.options.stacked ?? null,
    };
    try {
      const chartData = new ChartData(
        chartConfiguration.dataset.dataProvider,
        seriesConfig
      );
      chartConfiguration.seriesConfig = cloneDeep(seriesConfig);
      chartConfiguration.chartData = chartData;
      this.updateSeriesConfig(chartConfiguration);
    } catch (error) {
      console.error("Error al configurar los datos del gráfico:", error);
      throw new Error("No se pudo configurar los datos del gráfico");
    }
  }
}
