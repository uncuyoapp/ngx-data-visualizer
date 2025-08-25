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

/**
 * Servicio principal para la generación y configuración de gráficos.
 * Maneja la creación de configuraciones, división por dimensiones y actualización de opciones.
 */
@Injectable({
  providedIn: "root",
})
export class ChartService {
  /** Opciones de análisis para los gráficos */
  private readonly parserOptions: ParserOptions;

  /** Motor de renderizado de gráficos */
  private readonly chartRenderEngine: Type<EchartsComponent>;

  constructor() {
    this.parserOptions = new EChartParser();
    this.chartRenderEngine = EchartsComponent;
  }

  /**
   * Genera una configuración completa de gráfico basada en un dataset y opciones dadas
   * @param dataset - Conjunto de datos para el gráfico
   * @param options - Opciones de configuración personalizadas
   * @returns Configuración completa del gráfico
   * @throws Error si el dataset no está definido
   */
  public getChartConfiguration(
    dataset: Dataset,
    options: ChartOptions,
  ): ChartConfiguration {
    if (!dataset) {
      throw new Error("El parámetro dataset es requerido");
    }

    // Crear configuración base con todas las propiedades requeridas
    const chartConfiguration: ChartConfiguration = {
      dataset,
      options: { ...cloneDeep(DEFAULT_OPTIONS), ...options },
      chartData: {} as ChartData,
      chartRenderType: this.chartRenderEngine,
      expanded: false,
      libraryOptions: {},
      preview: false, // Propiedad faltante
      seriesConfig: {
        x1: "",
        measure: "",
        stack: null, // Propiedad faltante
      },
    };

    // Configurar datos y opciones
    this.updateChartData(chartConfiguration);
    chartConfiguration.libraryOptions = this.getLibraryOptions(
      chartConfiguration.options,
    );

    return chartConfiguration;
  }

  /**
   * Divide un dataset en múltiples configuraciones de gráfico basadas en una dimensión
   * @param dataset - Conjunto de datos original
   * @param options - Opciones de configuración base
   * @param dimension - Dimensión por la cual dividir los datos
   * @returns Array de configuraciones de gráficos, una por cada ítem seleccionado en la dimensión
   * @throws Error si algún parámetro requerido no está definido
   */
  public getSplitConfiguration(
    dataset: Dataset,
    options: ChartOptions,
    dimension: Dimension,
  ): ChartConfiguration[] {
    if (!dataset || !dimension) {
      throw new Error("Los parámetros dataset y dimension son requeridos");
    }

    // Filtrar solo los ítems seleccionados y mapear a configuraciones
    return dimension.items
      .filter((item) => item.selected)
      .map((item) => {
        // Crear una copia profunda del dataset
        const datasetCopy = new Dataset(dataset);
        datasetCopy.dataProvider.filters = JSON.parse(
          JSON.stringify(
            dataset.dataProvider.filters || { rollUp: [], filter: [] },
          ),
        );

        // Configuración básica del gráfico con todas las propiedades requeridas
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
          preview: false, // Propiedad faltante
          seriesConfig: {
            x1: "",
            measure: "",
            stack: null, // Propiedad faltante
          },
        };

        // Asegurar que existan los arrays de filtros
        if (!chartConfig.dataset.dataProvider.filters) {
          chartConfig.dataset.dataProvider.filters = new Filters();
        } else {
          // Si ya existe, asegurarse de que sea una instancia de Filters
          const existingFilters = chartConfig.dataset.dataProvider.filters;
          if (!(existingFilters instanceof Filters)) {
            const filters = new Filters();

            // Usar type assertion para acceder a las propiedades
            const filtersAny = existingFilters as {
              rollUp?: unknown[];
              filter?: unknown[];
            };

            // Verificar y copiar rollUp
            if (filtersAny.rollUp && Array.isArray(filtersAny.rollUp)) {
              filters.rollUp = [...(filtersAny.rollUp as string[])];
            }

            // Verificar y copiar filter
            if (filtersAny.filter && Array.isArray(filtersAny.filter)) {
              filters.filter = [...(filtersAny.filter as DimensionFilter[])];
            }

            chartConfig.dataset.dataProvider.filters = filters;
          }
        }

        // Aplicar filtros para el ítem actual
        chartConfig.dataset.dataProvider.filters.rollUp.push(
          dimension.nameView,
        );
        chartConfig.dataset.dataProvider.filters.filter.push({
          name: dimension.nameView,
          items: [item.name],
        });

        // Configurar datos y opciones de la biblioteca
        this.updateChartData(chartConfig);
        chartConfig.libraryOptions = this.getLibraryOptions(
          chartConfig.options,
        );

        return chartConfig;
      });
  }

  /**
   * Actualiza la configuración de la biblioteca de gráficos con las opciones actuales
   * @param chartConfiguration - Configuración del gráfico a actualizar
   */
  public updateLibraryConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error("El parámetro chartConfiguration es requerido");
    }
    chartConfiguration.libraryOptions =
      this.parserOptions.applyChartConfigurations(
        chartConfiguration.options,
        chartConfiguration.libraryOptions,
      ) as EChartsOption;
  }

  /**
   * Actualiza la configuración de series del gráfico basándose en los ejes proporcionados
   * y la disponibilidad de dimensiones.
   *
   * @param chartConfiguration - Configuración del gráfico a actualizar
   * @throws Error si no se puede generar una configuración válida
   */
  public updateSeriesConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error("El parámetro chartConfiguration es requerido");
    }

    const { chartData, seriesConfig, options, dataset } = chartConfiguration;
    const { rollUp } = chartData.dataProvider.filters;

    // Validar que al menos un eje esté definido
    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error(
        "Se requiere al menos un eje (x1 o x2) en la configuración de series.",
      );
    }

    // Aplicar filtro de último período si está habilitado
    if (options?.filterLastYear) {
      this.filterLastPeriod(chartConfiguration);
    }

    // Inicializar configuración de series
    chartData.seriesConfig = this.initializeSeriesConfig(seriesConfig);

    // Caso 1: El primer eje está disponible
    if (this.canUseAxis(seriesConfig.x1, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x1;

      // Si el segundo eje también está disponible, usarlo
      if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
        chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    }
    // Caso 2: El primer eje no está disponible, pero el segundo sí
    else if (seriesConfig.x2 && this.canUseAxis(seriesConfig.x2, rollUp)) {
      chartData.seriesConfig.x1 = seriesConfig.x2;
      chartData.seriesConfig.x2 = undefined;
    }
    // Caso 3: Usar DIMENSION_YEAR si está disponible
    else if (this.canUseAxis(DIMENSION_YEAR, rollUp)) {
      chartData.seriesConfig.x1 = DIMENSION_YEAR;
    }
    // Caso 4: Buscar cualquier otra dimensión disponible
    else {
      const availableDimension = this.findAvailableDimension(
        dataset.dimensions,
        rollUp,
      );
      if (availableDimension) {
        chartData.seriesConfig.x1 = availableDimension;
        chartData.seriesConfig.x2 = undefined;
      } else {
        throw new Error(
          "No se pudo encontrar una dimensión disponible para el eje X.",
        );
      }
    }
  }

  /**
   * Inicializa una nueva configuración de series con valores predeterminados
   * @param seriesConfig - Configuración de series existente para heredar propiedades
   * @returns Nueva configuración de series inicializada
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
   * Verifica si un eje puede ser utilizado (no está en la lista de rollUp)
   * @param axis - Nombre del eje a verificar
   * @param rollUp - Lista de dimensiones que están en rollUp
   * @returns true si el eje puede ser utilizado, false en caso contrario
   */
  private canUseAxis(axis: string | undefined, rollUp: string[]): boolean {
    return axis ? rollUp.indexOf(axis) === -1 : false;
  }

  /**
   * Encuentra la primera dimensión disponible que no esté en la lista de rollUp
   * @param dimensions - Lista de dimensiones disponibles
   * @param rollUp - Lista de dimensiones que están en rollUp
   * @returns Nombre de la primera dimensión disponible o null si no hay ninguna
   */
  private findAvailableDimension(
    dimensions: Dimension[],
    rollUp: string[],
  ): string | null {
    const availableDimension = dimensions.find(
      (dimension) =>
        dimension.nameView && rollUp.indexOf(dimension.nameView) === -1,
    );
    return availableDimension?.nameView ?? null;
  }

  /**
   * Obtiene las opciones de la biblioteca de gráficos según el modo (vista previa o completo)
   * @param options - Opciones de configuración del gráfico
   * @returns Opciones específicas para la biblioteca de gráficos
   */
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

  /**
   * Filtra los datos para mostrar solo el último período disponible
   * @param chartConfiguration - Configuración del gráfico a filtrar
   */
  private filterLastPeriod(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration?.dataset?.dataProvider) {
      return;
    }

    try {
      // Obtener el último período disponible
      const lastPeriods = chartConfiguration.dataset.dataProvider
        .getItems(DIMENSION_YEAR)
        .slice(-1);

      if (lastPeriods.length > 0) {
        const lastPeriod = lastPeriods[0];
        const yearFilter =
          chartConfiguration.dataset.dataProvider.filters.filter.find(
            (f) => f.name === DIMENSION_YEAR,
          );

        // Actualizar o crear el filtro para el último período
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
      // No lanzamos error para no interrumpir el flujo, pero podríamos hacerlo si es crítico
    }
  }

  /**
   * Configura los filtros y datos iniciales para el gráfico
   * @param chartConfiguration - Configuración del gráfico a configurar
   */
  public updateChartData(
    chartConfiguration: ChartConfiguration,
  ): void {
    if (!chartConfiguration?.dataset?.dataProvider) {
      throw new Error("El dataset o dataProvider no está definido");
    }

    // Configuración predeterminada de series
    const seriesConfig: SeriesConfig = {
      x1:
        chartConfiguration.dataset.dataProvider.dimensions.find(
          (d) => d.id === chartConfiguration.options?.xAxis?.firstLevel,
        )?.nameView ?? "",
      x2: chartConfiguration.dataset.dataProvider.dimensions.find(
        (d) => d.id === chartConfiguration.options?.xAxis?.secondLevel,
      )?.nameView,
      measure: chartConfiguration.options.measureUnit,
      stack: chartConfiguration.options.stacked ?? null,
    };

    try {
      // Crear instancia de ChartData con la configuración
      const chartData = new ChartData(
        chartConfiguration.dataset.dataProvider,
        seriesConfig,
      );

      // Actualizar la configuración del gráfico
      chartConfiguration.seriesConfig = cloneDeep(seriesConfig);
      chartConfiguration.chartData = chartData;

      // Actualizar la configuración de series
      this.updateSeriesConfig(chartConfiguration);
    } catch (error) {
      console.error("Error al configurar los datos del gráfico:", error);
      throw new Error("No se pudo configurar los datos del gráfico");
    }
  }
}
