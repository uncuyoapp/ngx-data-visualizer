import { Injectable } from "@angular/core";
import cloneDeep from "lodash.clonedeep";
import { ChartConfiguration, SeriesConfig } from "../types/chart-configuration";
import { ChartData } from "../utils/chart-data";
import { ChartLogicHelper } from "../utils/chart-logic.helper";

/**
 * Servicio encargado de actualizar y modificar una instancia de `ChartConfiguration` existente.
 * Proporciona métodos para sincronizar la configuración de la librería con los estados de los datos y opciones.
 */
@Injectable({
  providedIn: "root",
})
export class ChartUpdater {
  /**
   * Actualiza la configuración de las series (ejes, apilamiento) del gráfico.
   * Determina automáticamente los ejes a utilizar si no se especifican.
   * @param chartConfiguration La configuración del gráfico a actualizar.
   * @throws {Error} Si el parámetro chartConfiguration no está definido o faltan ejes.
   */
  public updateSeriesConfig(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration) {
      throw new Error("El parámetro chartConfiguration es requerido");
    }
    const { seriesConfig, options, dataset } = chartConfiguration;
    const { rollUp } = dataset.dataProvider.filters;
    if (!seriesConfig.x1 && !seriesConfig.x2) {
      throw new Error(
        "Se requiere al menos un eje (x1 o x2) en la configuración de series.",
      );
    }
    if (options?.filterLastYear) {
      ChartLogicHelper.filterLastPeriod(chartConfiguration);
    }
    chartConfiguration.chartData.seriesConfig =
      ChartLogicHelper.initializeSeriesConfig(seriesConfig);

    if (ChartLogicHelper.isDaZero(dataset)) {
      chartConfiguration.chartData.seriesConfig.x1 = "";
      chartConfiguration.chartData.seriesConfig.x2 = undefined;
      return;
    }

    if (ChartLogicHelper.canUseAxis(seriesConfig.x1, rollUp)) {
      chartConfiguration.chartData.seriesConfig.x1 = seriesConfig.x1;
      if (
        seriesConfig.x2 &&
        ChartLogicHelper.canUseAxis(seriesConfig.x2, rollUp)
      ) {
        chartConfiguration.chartData.seriesConfig.x2 = seriesConfig.x2;
      }
    } else if (
      seriesConfig.x2 &&
      ChartLogicHelper.canUseAxis(seriesConfig.x2, rollUp)
    ) {
      chartConfiguration.chartData.seriesConfig.x1 = seriesConfig.x2;
      chartConfiguration.chartData.seriesConfig.x2 = undefined;
    } else {
      const availableDimension = ChartLogicHelper.findAvailableDimension(
        dataset,
        rollUp,
      );
      if (availableDimension) {
        chartConfiguration.chartData.seriesConfig.x1 = availableDimension;
        chartConfiguration.chartData.seriesConfig.x2 = undefined;
      } else {
        chartConfiguration.chartData.seriesConfig.x1 = "";
        chartConfiguration.chartData.seriesConfig.x2 = undefined;
      }
    }
  }

  /**
   * Actualiza el objeto `chartData` dentro de la configuración del gráfico.
   * Procesa los datos del `dataProvider` basándose en la configuración de series.
   * @param chartConfiguration La configuración del gráfico a actualizar.
   * @throws {Error} Si el dataset no está definido o falla la configuración.
   */
  public updateChartData(chartConfiguration: ChartConfiguration): void {
    if (!chartConfiguration?.dataset) {
      throw new Error("El dataset no está definido");
    }

    const getDimensionKeyById = (
      id: number | undefined,
    ): string | undefined => {
      if (id === undefined) {
        return undefined;
      }
      return chartConfiguration.dataset.getDimensionKey(id);
    };

    let stackValue: string | null = null;
    if (chartConfiguration.options.stacked === 'all') {
      stackValue = 'all';
    } else if (typeof chartConfiguration.options.stacked === 'number') {
      stackValue = getDimensionKeyById(chartConfiguration.options.stacked) ?? null;
    }

    const seriesConfig: SeriesConfig = {
      x1:
        getDimensionKeyById(chartConfiguration.options?.xAxis?.firstLevel) ?? "",
      x2: getDimensionKeyById(
        chartConfiguration.options?.xAxis?.secondLevel ?? undefined,
      ),
      measure: chartConfiguration.options.measureUnit,
      stack: stackValue,
    };

    try {
      const colorPalette = ChartLogicHelper.getPaletteFromDataset(
        chartConfiguration.dataset,
      );
      const chartData = new ChartData(
        chartConfiguration.dataset.dataProvider,
        seriesConfig,
        colorPalette,
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
