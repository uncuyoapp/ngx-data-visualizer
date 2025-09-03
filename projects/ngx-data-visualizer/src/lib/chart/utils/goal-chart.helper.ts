import { DataProvider } from '../../services/data-provider';
import { DIMENSION_VALUE, DIMENSION_YEAR } from '../../types/constants';
import { Filters } from '../../types/data.types';
import { Goal } from '../types/chart-models';
import { ChartConfiguration, SeriesConfig } from '../types/chart-configuration';
import { ChartData } from './chart-data';

/**
 * Clase auxiliar para manejar la visualización de metas en los gráficos.
 * Proporciona funcionalidades para mostrar y ocultar metas, así como para
 * gestionar la configuración de series y filtros asociados.
 */
export class GoalChartHelper {
  /** Configuración de series guardada antes de mostrar la meta */
  private savedSeriesConfiguration!: SeriesConfig;
  /** Filtros guardados antes de mostrar la meta */
  private savedFilters!: Filters;
  /** Datos del gráfico de meta */
  private goalChartData!: ChartData;

  /**
   * Constructor de la clase
   * @param chartConfiguration - Configuración del gráfico principal
   */
  constructor(private readonly chartConfiguration: ChartConfiguration) { }

  /**
   * Muestra la meta en el gráfico
   * @param goal - Objeto Goal que contiene la configuración y datos de la meta
   * @returns Datos del gráfico de meta o undefined si hay algún error
   */
  public showGoal(goal: Goal): ChartData | undefined {
    if (!goal) {
      console.warn('No se proporcionó una meta válida');
      return undefined;
    }

    try {
      this.generateGoalChartData(goal);

      if (!this.goalChartData) {
        console.warn('No se pudo generar los datos de meta');
        return undefined;
      }

      this.updateSeriesConfig(this.goalChartData.seriesConfig);
      return this.goalChartData;
    } catch (error) {
      console.error('Error al mostrar la meta:', error);
      return undefined;
    }
  }

  /**
   * Oculta la meta y retorna la configuración guardada
   * @returns Objeto con la configuración de series y filtros guardados
   */
  public hideGoal(): { savedSeriesConfig: SeriesConfig; savedFilters: Filters } {
    return {
      savedSeriesConfig: this.savedSeriesConfiguration,
      savedFilters: this.savedFilters
    };
  }

  /**
   * @description
   * Genera la instancia de `ChartData` para la visualización de la meta.
   * Crea un `DataProvider` temporal y efímero solo con los datos de la meta.
   * @param goal - Objeto Goal que contiene los datos de la meta.
   * @private
   */
  private generateGoalChartData(goal: Goal): void {
    const dataProvider = new DataProvider({ rowData: goal.data });
    const goalDimensions = dataProvider
      .getKeys()
      .filter((dim) => dim !== DIMENSION_VALUE && dim !== DIMENSION_YEAR);
    const seriesConfig: SeriesConfig = {
      x1: DIMENSION_YEAR,
      x2: goalDimensions.length ? goalDimensions[0] : undefined,
      stack: null,
      measure: this.chartConfiguration.seriesConfig.measure,
    };

    // Se crea ChartData pasando un mapa de colores vacío, ya que la meta no usa paleta.
    this.goalChartData = new ChartData(dataProvider, seriesConfig, new Map());
  }

  /**
   * Actualiza la configuración de series para mostrar la meta
   * @param seriesConfig - Nueva configuración de series para la meta
   * @private
   */
  private updateSeriesConfig(seriesConfig: SeriesConfig): void {
    const { dataset } = this.chartConfiguration;
    const { dimensions } = dataset;

    const filters = new Filters();
    filters.rollUp = dimensions
      .filter(
        (dimension) =>
          dimension.nameView !== seriesConfig.x1 &&
          dimension.nameView !== seriesConfig.x2
      )
      .map((dimension) => dimension.nameView);

    this.savedSeriesConfiguration = { ...this.chartConfiguration.seriesConfig };

    if (dataset.dataProvider.filters) {
      this.savedFilters = new Filters();
      this.savedFilters.rollUp = [...(dataset.dataProvider.filters.rollUp || [])];
      this.savedFilters.filter = [...(dataset.dataProvider.filters.filter || [])];
    } else {
      this.savedFilters = new Filters();
    }

    this.chartConfiguration.seriesConfig = seriesConfig;
    dataset.applyFilters(filters);
    dataset.dataUpdated.next(true);
  }
}
