import { Dataset } from '../../services/dataset';
import { DIMENSION_YEAR } from '../../types/constants';
import { ChartConfiguration, SeriesConfig } from '../types/chart-configuration';

/**
 * @description
 * Clase de utilidad con métodos estáticos y puros para manejar lógica de negocio
 * y transformaciones relacionadas con la configuración de gráficos.
 * @internal
 */
export class ChartLogicHelper {
  /**
   * @description Inicializa y devuelve un objeto `SeriesConfig` limpio.
   * @param seriesConfig La configuración de series original.
   * @returns Un nuevo objeto `SeriesConfig` con valores iniciales.
   */
  public static initializeSeriesConfig(seriesConfig: SeriesConfig): SeriesConfig {
    return {
      x1: '',
      x2: undefined,
      stack: seriesConfig.stack,
      measure: seriesConfig.measure,
    };
  }

  /**
   * @description Verifica si un eje puede ser utilizado (no está ya en `rollUp`).
   * @param axis El nombre del eje a verificar.
   * @param rollUp El array de dimensiones actualmente en uso.
   * @returns `true` si el eje puede ser utilizado, `false` en caso contrario.
   */
  public static canUseAxis(axis: string | undefined, rollUp: string[]): boolean {
    return axis ? rollUp.indexOf(axis) === -1 : false;
  }

  /**
   * @description Busca una dimensión disponible que no esté siendo utilizada en `rollUp`.
   * @param dataset El `Dataset` a analizar.
   * @param rollUp Array de claves en uso.
   * @returns El nombre de la clave de la dimensión disponible o `null` si no se encuentra ninguna.
   */
  public static findAvailableDimension(
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
   * @description Filtra los datos para mostrar únicamente el último período (año).
   * @param chartConfiguration La configuración del gráfico a modificar.
   */
  public static filterLastPeriod(chartConfiguration: ChartConfiguration): void {
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
   * @description Extrae la paleta de colores a partir de las dimensiones de un `Dataset`.
   * @param dataset El `Dataset` del cual extraer los colores.
   * @returns Un `Map` donde la clave es el nombre del item y el valor es el color en formato string.
   */
  public static getPaletteFromDataset(dataset: Dataset): Map<string, string> {
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
