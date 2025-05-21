import { DataProvider, DIMENSION_VALUE, DIMENSION_YEAR } from '../data-provider';
import { Filters, Goal } from '../models';
import { ChartConfiguration, SeriesConfig } from './chart-configuration';
import { ChartData } from './chart-data';

export class GoalChartHelper {
  private savedSeriesConfiguration!: SeriesConfig;
  private savedFilters!: Filters;
  private goalChartData!: ChartData;

  constructor(private readonly chartConfiguration: ChartConfiguration) { }

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

  public hideGoal(): { savedSeriesConfig: SeriesConfig; savedFilters: Filters } {
    return {
      savedSeriesConfig: this.savedSeriesConfiguration,
      savedFilters: this.savedFilters
    };
  }

  private generateGoalChartData(goal: Goal): void {
    const dataProvider = new DataProvider();
    dataProvider.setData(goal.data);
    const goalDimensions = dataProvider
      .getDimensionsNames()
      .filter((dim) => dim !== DIMENSION_VALUE && dim !== DIMENSION_YEAR);
    const seriesConfig: SeriesConfig = {
      x1: DIMENSION_YEAR,
      x2: goalDimensions.length ? goalDimensions[0] : undefined,
      stack: null,
      measure: this.chartConfiguration.seriesConfig.measure,
    };

    this.goalChartData = new ChartData(dataProvider, seriesConfig);
  }

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