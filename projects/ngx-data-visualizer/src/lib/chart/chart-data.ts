import { DataProvider, DIMENSION_VALUE } from "../data-provider";
import { Dimension, RowData } from "../models";
import { SeriesConfig } from "./chart-configuration";

/**
 * Clase encargada de transformar y preparar datos para visualizaciones gráficas.
 * Gestiona la estructuración de datos en series, dimensiones y valores para representación visual.
 */
export class ChartData {

  /**
   * Constructor de la clase ChartData
   * @param dataProvider Proveedor de datos para las visualizaciones
   * @param seriesConfig Configuración de las series para el gráfico
   */
  constructor(
    public dataProvider: DataProvider,
    public seriesConfig: SeriesConfig
  ) { }

  /**
   * Obtiene los items de una columna específica
   * @param column Nombre de la columna para obtener items
   * @param withoutFilter Si es true, obtiene todos los items sin aplicar filtros
   * @returns Array de strings con los nombres de los items
   */
  public getItems(column: string, withoutFilter?: boolean): string[] {
    if (withoutFilter) {
      const dimension = this.dataProvider.dimensions.find(d => d.nameView === column);
      return dimension?.items?.map(i => i.name) ?? [];
    } else {
      return this.dataProvider.getItems(column);
    }
  }

  /**
   * Genera las series de datos para el gráfico
   * @returns Array de objetos que representan las series de datos
   */
  public getSeries(): object[] {
    const { stackKey, axis0, axis1, items, items2, palette } = this.extractVariables();
    const dataStruct = this.createDataStruct(items, items2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = new Map<string, any>();

    this.dataProvider.getData().forEach(row => {
      const { nameSeries, stack, firstLevel, secondLevel, color } = this.processRow(row, stackKey, axis0, axis1, palette);
      if (!series.get(nameSeries)) {
        series.set(nameSeries, {
          name: nameSeries,
          stack: stack !== nameSeries ? stack : null,
          data: new Map(dataStruct),
          color
        });
      }

      const actualSeries = series.get(nameSeries);
      // Asegurarse de que el valor sea numérico o null/undefined
      const rawValue = row['valor'];
      const valor = (rawValue !== null && rawValue !== undefined) ? Number(rawValue) : null;
      
      if (!firstLevel) {
        throw new Error('FirstLevel is undefined');
      }
      if (actualSeries === undefined) {
        throw new Error('An error occurred when finding series');
      }
      
      // Solo agregar el valor si es un número válido o null
      if (secondLevel) {
        // Utilizamos concatenación con separador para evitar ambigüedades
        actualSeries.data.set(`${firstLevel}_${secondLevel}`, [secondLevel, valor]);
      } else {
        actualSeries.data.set(firstLevel, [firstLevel, valor]);
      }

    });

    series.forEach(seriesElement => {
      seriesElement.data = Array.from(seriesElement.data.values());
    });
    return Array.from(series.values());
  }

  /**
   * Extrae variables necesarias para la configuración de series
   * @returns Objeto con las variables extraídas (stackKey, ejes, items y paleta)
   */
  private extractVariables() {
    let stackKey = '';
    let axis0 = '';
    let axis1 = '';
    let items: string[] = [];
    let items2: string[] = [];
    let palette: Map<string, string> | undefined;


    this.dataProvider.dimensions.forEach(dimension => {
      if (dimension.selected && (!palette || palette.size === 0)) {
        palette = this.getPalette(dimension);
      }
    });

    this.dataProvider.getDimensionsNames().forEach(dimensionName => {
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

    return { stackKey, axis0, axis1, items, items2, palette };
  }

  /**
   * Crea la estructura de datos base para las series
   * @param items Array de items primarios
   * @param items2 Array de items secundarios
   * @returns Map con la estructura de datos inicializada para las series
   */
  private createDataStruct(items: string[], items2: string[]) {
    const dataStruct = new Map<string, [string, number | null]>();
    items.forEach(item => {
      if (items2.length > 0) {
        items2.forEach(item2 => {
          dataStruct.set(item.concat(item2), [item2, null]);
        });
      } else {
        dataStruct.set(item, [item, null]);
      }
    });
    return dataStruct;
  }


  /**
   * Procesa una fila de datos para integrarla en las series
   * @param row Fila de datos a procesar
   * @param stackKey Clave para el apilamiento de datos
   * @param axis0 Nombre de la dimensión para el eje primario
   * @param axis1 Nombre de la dimensión para el eje secundario
   * @param palette Mapa de colores para las series
   * @returns Objeto con los datos procesados (nombre de serie, stack, niveles y color)
   */
  private processRow(row: RowData, stackKey: string, axis0: string, axis1: string, palette: Map<string, string> | undefined) {
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
          nameSeries = nameSeries === '' ? this.seriesConfig.measure ?? '' : nameSeries;
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

  /**
   * Obtiene la paleta de colores a partir de una dimensión
   * @param dimension Dimensión de la cual extraer la paleta de colores
   * @returns Mapa con nombres de items y sus colores asociados
   */
  private getPalette(dimension: Dimension): Map<string, string> {
    const mapColors = new Map<string, string>();
    // Filtramos los items que tienen color definido y no es undefined
    dimension.items
      .filter(item => item.color !== undefined && item.color !== null)
      .forEach(i => {
        // Estamos seguros de que i.color no es undefined gracias al filtro previo
        mapColors.set(i.name, i.color as string);
      });
    return mapColors;
  }
}
