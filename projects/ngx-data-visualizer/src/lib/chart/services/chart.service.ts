import { Injectable, Type } from "@angular/core";
import cloneDeep from "lodash.clonedeep";
import { DIMENSION_YEAR } from "../../types/constants";
import { Dataset } from "../../services/dataset";
import { Dimension, Filters } from "../../types/data.types";
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

/**
 * @description
 * Servicio encargado de la creación y gestión de configuraciones de gráficos.
 * Actúa como una factoría para `ChartConfiguration`, proveyendo métodos para
 * generar configuraciones para gráficos individuales y múltiples, así como para
 * actualizar su estado y datos.
 */
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

  /**
   * @description
   * Crea y devuelve una configuración de gráfico completa para un único gráfico.
   * @param dataset El conjunto de datos para el gráfico.
   * @param options Las opciones de visualización y comportamiento del gráfico.
   * @returns Una instancia de `ChartConfiguration` completamente inicializada.
   * @throws {Error} Si el `dataset` no se proporciona.
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
    this.updateChartData(chartConfiguration);
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
   * @returns Un array de `ChartConfiguration`, una para cada item seleccionado de la dimensión.
   * @throws {Error} Si `dataset` o `dimension` no se proporcionan.
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

        this.updateChartData(chartConfig);
        chartConfig.libraryOptions = this.getLibraryOptions(chartConfig.options);
        return chartConfig;
      });
  }

  /**
   * @description
   * Actualiza las opciones de la librería de gráficos (ECharts) basadas en la configuración general.
   * @param chartConfiguration La configuración del gráfico a actualizar.
   * @throws {Error} Si `chartConfiguration` no se proporciona.
   */
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

  /**
   * @description
   * Actualiza la configuración de las series (ejes, apilamiento) del gráfico.
   * Determina automáticamente los ejes a utilizar si no se especifican.
   * @param chartConfiguration La configuración del gráfico a actualizar.
   * @throws {Error} Si `chartConfiguration` no se proporciona o si falta configuración de ejes.
   */
  public updateSeriesConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error('El parámetro chartConfiguration es requerido');
    }
    const { seriesConfig, options, dataset } = chartConfiguration;
    const { rollUp } = dataset.dataProvider.filters;
    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error(
        'Se requiere al menos un eje (x1 o x2) en la configuración de series.'
      );
    }
    if (options?.filterLastYear) {
      this.filterLastPeriod(chartConfiguration);
    }
    chartConfiguration.chartData.seriesConfig = this.initializeSeriesConfig(seriesConfig);
    if (this.canUseAxis(seriesConfig.x1, rollUp)) {
      chartConfiguration.chartData.seriesConfig.x1 = seriesConfig.x1;
      if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
        chartConfiguration.chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    } else if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
      chartConfiguration.chartData.seriesConfig.x1 = seriesConfig.x2;
      chartConfiguration.chartData.seriesConfig.x2 = undefined;
    } else if (this.canUseAxis(DIMENSION_YEAR, rollUp)) {
      chartConfiguration.chartData.seriesConfig.x1 = DIMENSION_YEAR;
    } else {
      const availableDimension = this.findAvailableDimension(
        dataset,
        rollUp
      );
      if (availableDimension) {
        chartConfiguration.chartData.seriesConfig.x1 = availableDimension;
        chartConfiguration.chartData.seriesConfig.x2 = undefined;
      } else {
        throw new Error(
          'No se pudo encontrar una dimensión disponible para el eje X.'
        );
      }
    }
  }

  /**
   * @description
   * Inicializa y devuelve un objeto `SeriesConfig` limpio.
   * @param seriesConfig La configuración de series original.
   * @returns Un nuevo objeto `SeriesConfig` con valores iniciales.
   */
  private initializeSeriesConfig(seriesConfig: SeriesConfig): SeriesConfig {
    return {
      x1: "",
      x2: undefined,
      stack: seriesConfig.stack,
      measure: seriesConfig.measure,
    };
  }

  /**
   * @description
   * Verifica si un eje puede ser utilizado (no está ya en `rollUp`).
   * @param axis El nombre del eje a verificar.
   * @param rollUp El array de dimensiones actualmente en uso.
   * @returns `true` si el eje puede ser utilizado, `false` en caso contrario.
   */
  private canUseAxis(axis: string | undefined, rollUp: string[]): boolean {
    return axis ? rollUp.indexOf(axis) === -1 : false;
  }

  /**
   * @description
   * Busca una dimensión disponible que no esté siendo utilizada en `rollUp`.
   * @param dimensions Array de todas las dimensiones disponibles.
   * @param rollUp Array de dimensiones en uso.
   * @returns El nombre de la dimensión disponible o `null` si no se encuentra ninguna.
   */
  private findAvailableDimension(
    dataset: Dataset,
    rollUp: string[]
  ): string | null {
    const availableDimension = dataset.getAllDimensions().find(dimension => {
      const key = dataset.getDimensionKey(dimension.id);
      return key && !rollUp.includes(key);
    });

    const key = availableDimension ? dataset.getDimensionKey(availableDimension.id) : null;
    return key ?? null;
  }

  /**
   * @description
   * Obtiene las opciones específicas de la librería de gráficos (ECharts) según el modo (preview o completo).
   * @param options Las opciones generales del gráfico.
   * @returns Las opciones de ECharts correspondientes.
   * @throws {Error} Si `options` no se proporciona.
   */
  private getLibraryOptions(options: ChartOptions): EChartsOption {
    if (!options) {
      throw new Error("El parámetro options es requerido");
    }
    return options.isPreview
      ? (this.parserOptions.getPreviewOptions(options) as EChartsOption)
      : (this.parserOptions.getFullOptions(options) as EChartsOption);
  }

  /**
   * @description
   * Filtra los datos para mostrar únicamente el último período (año).
   * @param chartConfiguration La configuración del gráfico a modificar.
   */
  private filterLastPeriod(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration?.dataset?.dataProvider) {
      return;
    }
    try {
      const lastPeriods = chartConfiguration.dataset.dataProvider
        .getValuesByKey(DIMENSION_YEAR)
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

  /**
   * @description
   * Actualiza el objeto `chartData` dentro de la configuración del gráfico.
   * Procesa los datos del `dataProvider` basándose en la configuración de series.
   * @param chartConfiguration La configuración del gráfico a actualizar.
   * @throws {Error} Si el `dataProvider` no está definido o si hay un error al procesar los datos.
   */
  public updateChartData(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration?.dataset) {
      throw new Error('El dataset no está definido');
    }

    const getDimensionKeyById = (id: number | undefined): string | undefined => {
      if (id === undefined) {
        return undefined;
      }
      return chartConfiguration.dataset.getDimensionKey(id);
    };

    const seriesConfig: SeriesConfig = {
      x1:
        getDimensionKeyById(chartConfiguration.options?.xAxis?.firstLevel) ?? '',
      x2: getDimensionKeyById(chartConfiguration.options?.xAxis?.secondLevel ?? undefined),
      measure: chartConfiguration.options.measureUnit,
      stack: chartConfiguration.options.stacked ?? null,
    };

    try {
      const colorPalette = this.getPaletteFromDataset(chartConfiguration.dataset);
      const chartData = new ChartData(
        chartConfiguration.dataset.dataProvider,
        seriesConfig,
        colorPalette
      );
      chartConfiguration.seriesConfig = cloneDeep(seriesConfig);
      chartConfiguration.chartData = chartData;
      this.updateSeriesConfig(chartConfiguration);
    } catch (error) {
      console.error('Error al configurar los datos del gráfico:', error);
      throw new Error('No se pudo configurar los datos del gráfico');
    }
  }

  /**
   * @description Extrae la paleta de colores a partir de las dimensiones de un `Dataset`.
   * @param dataset El `Dataset` del cual extraer los colores.
   * @returns Un `Map` donde la clave es el nombre del item y el valor es el color en formato string.
   * @private
   */
  private getPaletteFromDataset(dataset: Dataset): Map<string, string> {
    const mapColors = new Map<string, string>();
    dataset.dimensions.forEach(dimension => {
      dimension.items
        .filter(item => item.color)
        .forEach(item => {
          mapColors.set(item.name, item.color as string);
        });
    });
    return mapColors;
  }
}
