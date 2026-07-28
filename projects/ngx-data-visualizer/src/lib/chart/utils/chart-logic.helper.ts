import { DataProvider } from '../../services/data-provider';
import { Dataset } from '../../services/dataset';
import { DIMENSION_VALUE, DIMENSION_YEAR } from '../../types/constants';
import { ChartOptions } from '../../types/data.types';
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
   * @description Determina si no hay dimensiones de análisis activas (DA = 0).
   * @param dataset El `Dataset` a analizar.
   * @returns `true` si todas las dimensiones están en rollUp / inactivas, `false` en caso contrario.
   */
  public static isDaZero(dataset?: Dataset): boolean {
    if (!dataset) return false;
    const allDimensions = dataset.getAllDimensions();
    if (allDimensions.length === 0) return true;
    const rollUp = dataset.dataProvider?.filters?.rollUp || [];
    return allDimensions.every((dim) => {
      const key = dataset.getDimensionKey(dim.id);
      return key ? rollUp.includes(key) : true;
    });
  }

  /**
   * @description Calcula el valor total acumulado consolidado a partir de los datos procesados del `DataProvider`.
   * @param dataProvider Instancia de `DataProvider`.
   * @returns El total numérico de la columna de medida.
   */
  public static calculateConsolidatedTotal(dataProvider?: DataProvider): number {
    if (!dataProvider) return 0;
    const data = dataProvider.getData();
    return data.reduce((acc, row) => {
      const val = row[DIMENSION_VALUE];
      const num = typeof val === 'number' ? val : Number.parseFloat(String(val ?? 0));
      return acc + (Number.isNaN(num) ? 0 : num);
    }, 0);
  }

  /**
   * @description Formatea el valor total consolidado para ser mostrado en la tarjeta KPI.
   * @param value El valor numérico a formatear.
   * @param options Las opciones del gráfico (`ChartOptions`).
   * @returns El valor formateado como string (ej. "$ 150,000.00" o "15.000,00 kg").
   */
  public static formatKpiValue(value: number, options?: ChartOptions): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '0';
    }
    const decimals = options?.tooltip?.decimals ?? 2;
    const formatted = value.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });
    const suffix = options?.tooltip?.suffix ?? options?.measureUnit;
    if (suffix) {
      if (['$', '€', '£'].includes(suffix)) {
        return `${suffix} ${formatted}`;
      }
      return `${formatted} ${suffix}`;
    }
    return formatted;
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
