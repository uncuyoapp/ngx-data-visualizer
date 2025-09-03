import { DataProvider } from '../../services/data-provider';
import { DIMENSION_VALUE } from '../../types/constants';
import { RowData } from '../../types/data.types';
import { SeriesConfig } from '../types/chart-configuration';

/**
 * @description
 * Clase encargada de transformar los datos procesados por `DataProvider` en una estructura
 * de series compatible con la librería de gráficos (ECharts).
 * @internal
 */
export class ChartData {
  /**
   * @description Crea una instancia de ChartData.
   * @param dataProvider El proveedor de datos ya configurado y listo para ser consumido.
   * @param seriesConfig La configuración de las series para el gráfico (ejes, stack, etc.).
   * @param colorPalette Un mapa opcional para asignar colores a las series.
   */
  constructor(
    public dataProvider: DataProvider,
    public seriesConfig: SeriesConfig,
    private readonly colorPalette?: Map<string, string>
  ) {}

  /**
   * @description Obtiene los valores únicos para una columna (clave) específica de los datos procesados.
   * @param column El nombre de la columna (clave) a consultar.
   * @returns Un array de valores únicos (string o number).
   */
  public getItems(column: string): (string | number)[] {
    return this.dataProvider.getValuesByKey(column);
  }

  /**
   * @description Genera la estructura de series completa para el gráfico, procesando los datos del `DataProvider`.
   * @returns Un array de objetos que representan las series de datos para la librería de gráficos.
   */
  public getSeries(): object[] {
    const { stackKey, axis0, axis1, items, items2 } = this.extractVariables();
    const dataStruct = this.createDataStruct(items, items2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = new Map<string, any>();

    this.dataProvider.getData().forEach((row) => {
      const { nameSeries, stack, firstLevel, secondLevel, color } =
        this.processRow(row, stackKey, axis0, axis1, this.colorPalette);
      if (!series.get(nameSeries)) {
        series.set(nameSeries, {
          name: nameSeries,
          stack: stack !== nameSeries ? stack : null,
          data: new Map(dataStruct),
          color,
        });
      }

      const actualSeries = series.get(nameSeries);
      // Asegurarse de que el valor sea numérico o null/undefined
      const rawValue = row['valor'];
      const valor =
        rawValue !== null && rawValue !== undefined
          ? parseFloat(String(rawValue))
          : null;

      if (!firstLevel) {
        throw new Error('FirstLevel is undefined');
      }
      if (actualSeries === undefined) {
        throw new Error('An error occurred when finding series');
      }

      // Solo agregar el valor si es un número válido o null
      if (secondLevel) {
        // Utilizamos concatenación con separador para evitar ambigüedades
        actualSeries.data.set(firstLevel.concat(secondLevel), [
          secondLevel,
          valor,
        ]);
      } else {
        actualSeries.data.set(firstLevel, [firstLevel, valor]);
      }
    });

    series.forEach((seriesElement) => {
      seriesElement.data = Array.from(seriesElement.data.values());
    });
    return Array.from(series.values());
  }

  /**
   * @description Extrae las variables y claves necesarias para la configuración de las series a partir de los datos procesados.
   * @returns Un objeto con las claves de los ejes y los items para construir el gráfico.
   * @private
   */
  private extractVariables() {
    let stackKey = '';
    let axis0 = '';
    let axis1 = '';
    let items: (string | number)[] = [];
    let items2: (string | number)[] = [];

    this.dataProvider.getKeys().forEach((dimensionName) => {
      switch (dimensionName) {
        case this.seriesConfig.x1:
          axis0 = dimensionName;
          items = this.getItems(dimensionName);
          break;
        case this.seriesConfig.x2:
          axis1 = dimensionName;
          items2 = this.getItems(dimensionName);
          break;
        case this.seriesConfig.stack:
          stackKey = dimensionName;
          break;
      }
    });

    return { stackKey, axis0, axis1, items, items2 };
  }

  /**
   * @description Crea una estructura de datos base (un Map) para las series, inicializando todos los valores a `null`.
   * @param items - Array de items para el eje primario.
   * @param items2 - Array de items para el eje secundario (si existe).
   * @returns Un `Map` con la estructura de datos inicializada para una serie.
   * @private
   */
  private createDataStruct(
    items: (string | number)[],
    items2: (string | number)[]
  ) {
    const dataStruct = new Map<string, [string | number, number | null]>();
    items.forEach((item) => {
      if (items2.length > 0) {
        items2.forEach((item2) => {
          dataStruct.set(String(item).concat(String(item2)), [item2, null]);
        });
      } else {
        dataStruct.set(String(item), [item, null]);
      }
    });
    return dataStruct;
  }

  /**
   * @description Procesa una única fila de datos para extraer la información relevante de la serie.
   * @param row - La fila de datos a procesar.
   * @param stackKey - La clave usada para el apilamiento de datos.
   * @param axis0 - La clave para el eje primario.
   * @param axis1 - La clave para el eje secundario.
   * @param palette - El mapa de colores a utilizar.
   * @returns Un objeto con los datos procesados de la fila (nombre de serie, stack, niveles y color).
   * @private
   */
  private processRow(
    row: RowData,
    stackKey: string,
    axis0: string,
    axis1: string,
    palette: Map<string, string> | undefined
  ) {
    let nameSeries: string = '';
    let stack: string | undefined;
    let firstLevel: string | undefined;
    let secondLevel: string | undefined;
    let color: string | undefined;

    Object.entries(row).forEach(([key, value]) => {
      // Aseguramos que value sea string
      const valueStr = String(value);

      switch (key) {
        case stackKey:
          stack = valueStr;
          nameSeries = nameSeries ? `${nameSeries} → ${valueStr}` : valueStr;

          // Manejo seguro de colores desde la paleta
          if (!color && palette) {
            const paletteColor = palette.get(valueStr);
            if (paletteColor) color = paletteColor;
          }
          break;

        case axis0:
          firstLevel = valueStr;
          break;

        case axis1:
          secondLevel = valueStr;
          break;

        case DIMENSION_VALUE:
          nameSeries =
            nameSeries === '' ? this.seriesConfig.measure ?? '' : nameSeries;
          break;

        default:
          nameSeries = nameSeries ? `${nameSeries} → ${valueStr}` : valueStr;

          // Actualizar stack solo si la clave corresponde a stackKey
          if (key === stackKey) {
            stack = valueStr;
          }

          // Manejo seguro de colores desde la paleta
          if (!color && palette) {
            const paletteColor = palette.get(valueStr);
            if (paletteColor) color = paletteColor;
          }
          break;
      }
    });

    return { nameSeries, stack, firstLevel, secondLevel, color };
  }
}
