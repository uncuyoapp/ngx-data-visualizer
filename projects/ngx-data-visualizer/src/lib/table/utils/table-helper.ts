/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JQueryService } from './jquery.service';
import { PivotConfiguration } from '../types/table-configuration';
import { PivotFormatter, PivotAggregator, PivotRenderer, PivotDeriver, PivotLocale } from '../types/pivot-types';

// Extender la interfaz de jQuery para incluir los métodos de pivottable
declare global {
  interface JQuery {
    pivot(data: any[], options?: any, locale?: string): JQuery;
  }

  interface JQueryStatic {
    pivotUtilities: {
      aggregatorTemplates: {
        sum: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
        count: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
        average: (formatter?: PivotFormatter) => (fields: string[]) => PivotAggregator;
      };
      renderers: Record<string, PivotRenderer>;
      derivers: Record<string, PivotDeriver>;
      locales: Record<string, PivotLocale>;
      naturalSort: (a: string | number, b: string | number) => number;
      numberFormat: (opts?: { digitsAfterDecimal?: number; scaler?: number; prefix?: string; suffix?: string }) => PivotFormatter;
      sortAs: (orderValues: string[]) => (a: string, b: string) => number;
    };
  }
}

/**
 * Clase auxiliar para la manipulación y renderizado de tablas pivot
 * Proporciona funcionalidades para:
 * - Renderizar tablas pivot con configuración personalizada
 * - Implementar efectos de "sticky" para mejorar la navegación
 * - Manejar interacciones del usuario como hover y clics
 * - Configurar ordenamiento y formato de datos
 */
export class TableHelper {
  // Instancia estática de jQuery proporcionada por el servicio
  private static jQueryService: JQueryService;

  /**
   * Inicializa el TableHelper con el servicio de jQuery
   * @param jQueryService Servicio que proporciona jQuery
   */
  static initialize(jQueryService: JQueryService): void {
    TableHelper.jQueryService = jQueryService;
  }

  /**
   * Render an HTMLTable in an HTMLElement using pivotJS
   *
   * @param element HTMLElement is al element to binding the pivot table
   * @param data any[] is the array with data for pivot
   * @param config PivotConfiguration is the configuration for pivot table
   */
  static renderPivot(
    element: HTMLDivElement,
    data: any[],
    config: PivotConfiguration
  ): void {
    // Asegurarse de que jQuery esté inicializado
    if (!TableHelper.jQueryService) {
      throw new Error(
        'TableHelper no ha sido inicializado. Llama a TableHelper.initialize() primero.'
      );
    }

    const $ = TableHelper.jQueryService.$;
    const pivotConfiguration = TableHelper.configurePivot(config);
    $(element).pivot(data, pivotConfiguration, 'es');
    $('td').on('mouseenter', function (e: any) {
      $(e.currentTarget).trigger('click');
    });
    $('td').on('click', () => {});
  }

  /**
   * Hace que la tabla sea "sticky" (fija) para mejorar la navegación en tablas grandes
   * @param div Elemento HTML que contiene la tabla
   */
  static stickyTable(div: HTMLDivElement) {
    if (div.hasChildNodes()) {
      const table = div.childNodes[0] as HTMLTableElement;
      if (table.offsetHeight === 0) {
        setTimeout(() => TableHelper.stickyTable(div));
      } else if (table.tHead) {
        const offsetTop = table.getBoundingClientRect().top;
        const offsetLeft = table.getBoundingClientRect().left;
        TableHelper.stickyHeader(div, offsetTop, offsetLeft, table.tHead);
        TableHelper.stickyBody(
          table.tHead.clientHeight + 10,
          offsetLeft,
          table.tBodies[0],
          'pvtRowLabel'
        );
        TableHelper.stickyBody(
          table.tHead.clientHeight + 10,
          offsetLeft,
          table.tBodies[0],
          'pvtTotalLabel'
        );
      }
    }
  }

  /**
   * Configura las opciones del pivot table
   * @param config Configuración del pivot table
   * @returns Objeto de configuración para el pivot table
   */
  private static configurePivot(config: PivotConfiguration) {
    const $ = TableHelper.jQueryService.$;
    const sum = $.pivotUtilities.aggregatorTemplates.sum;
    const numberFormat = $.pivotUtilities.numberFormat;
    const intFormat = numberFormat({
      digitsAfterDecimal: config.digitsAfterDecimal ?? undefined,
      suffix: config.suffix,
    });
    const sorters = TableHelper.configureSorters(config);
    return TableHelper.getPivotObject(sum, intFormat, sorters, config);
  }

  /**
   * Configura los ordenadores personalizados para el pivot table
   * @param config Configuración del pivot table
   * @returns Objeto con los ordenadores configurados
   */
  private static configureSorters(config: PivotConfiguration) {
    const $ = TableHelper.jQueryService.$;
    const sorters: Record<string, (a: string, b: string) => number> = {};
    config.sorters.forEach((sorter: { name: string; items: Array<{ name: string; order: number }> }) => {
      const items = [...sorter.items]
        .sort((a, b) => a.order - b.order)
        .map((a) => a.name);
      Object.defineProperty(sorters, sorter.name, {
        value: $.pivotUtilities.sortAs(items),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    });
    return sorters;
  }

  /**
   * Genera el objeto de configuración final para el pivot table
   * @param aggregator Función agregadora para los valores
   * @param numberFormat Formateador de números
   * @param sorters Ordenadores configurados
   * @param config Configuración del pivot table
   * @returns Objeto de configuración completo para el pivot table
   */
  private static getPivotObject(
    aggregator: any,
    numberFormat: any,
    sorters: any,
    config: PivotConfiguration
  ) {
    return {
      showDecimals: config.digitsAfterDecimal > 0,
      aggregator: aggregator(numberFormat)(['valor']),
      cols: config.cols,
      rows: config.rows,
      sorters,
      rendererOptions: {
        table: {
          rowTotals: config.cols.length > 0 ? config.totalRow : true,
          colTotals: config.rows.length > 0 ? config.totalCol : true,
          clickCallback: (e: any, _value: any, filter: any) =>
            TableHelper.hoverFunction(e, filter),
        },
      },
    };
  }

  /**
   * Maneja el efecto hover en las celdas de la tabla
   * @param e Evento del mouse
   * @param filter Filtros aplicados
   */
  private static hoverFunction(e: any, filter: any) {
    const $ = TableHelper.jQueryService.$;
    const currentTarget = $(e.currentTarget);
    const rect = e.currentTarget.getBoundingClientRect();

    // Obtener las coordenadas relativas al elemento
    const x = rect.left;
    const y = rect.top;

    currentTarget.addClass('hovered');
    Object.values(filter).forEach((item) => {
      const aux = $('th:contains(' + (item as string) + ')').filter(
        (_i: any, th: any) => $(th).text() === item
      );
      if (aux.length > 1) {
        const parentType = aux[0].parentElement?.parentElement?.tagName;
        // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
        if (parentType === 'THEAD') {
          // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
          aux
            .filter((i: number) => {
              // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
              const rect = aux[i].getBoundingClientRect();
              return x >= rect.x && x <= rect.x + rect.width;
            })
            .addClass('hovered');
        } else {
          // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
          aux
            .filter((i: number) => {
              // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
              const rect = aux[i].getBoundingClientRect();
              return y >= rect.y && y <= rect.y + rect.height;
            })
            .addClass('hovered');
        }
      } else {
        aux.addClass('hovered');
      }
    });

    if (currentTarget.hasClass('rowTotal')) {
      $('.pvtRowTotalLabel').addClass('hovered');
    }
    if (currentTarget.hasClass('colTotal')) {
      $('.pvtColTotalLabel').addClass('hovered');
    }
    if (currentTarget.hasClass('pvtGrandTotal')) {
      $('.pvtRowTotalLabel').addClass('hovered');
      $('.pvtColTotalLabel').addClass('hovered');
    }

    currentTarget.on('mouseout', () => {
      $('th, td').removeClass('hovered');
    });
  }

  /**
   * Hace que el encabezado de la tabla sea "sticky"
   * @param div Elemento contenedor de la tabla
   * @param offsetTop Desplazamiento superior
   * @param _offsetLeft Desplazamiento izquierdo
   * @param tHead Elemento del encabezado de la tabla
   */
  private static stickyHeader(
    div: HTMLDivElement,
    offsetTop: number,
    _offsetLeft: number,
    tHead: HTMLElement
  ) {
    tHead.childNodes.forEach((tr) => {
      tr.childNodes.forEach((th: any) => {
        const top = th.getBoundingClientRect().top - offsetTop;
        const left = tHead.clientWidth > div.clientWidth ? th.offsetLeft : 0;
        const css = th.getAttribute('class');
        if (!css) {
          th.setAttribute(
            'style',
            'position:sticky;top:' +
              top +
              'px;left:' +
              left +
              'px;z-index:999;background:white;border:2px solid white;'
          );
          th.setAttribute('class', 'pvtCorner');
        } else if (css === 'pvtColLabel') {
          th.setAttribute(
            'style',
            'position:sticky;top:' +
              top +
              'px;z-index: 99;background: white; border: 2px solid white;'
          );
        } else if (css === 'pvtAxisLabel') {
          th.setAttribute(
            'style',
            'position:sticky;top:' +
              (top - 2) +
              'px;left:' +
              (left > 0 ? left + 4 : 0) +
              'px; z-index: 999; background:white; border: 2px solid white;'
          );
        } else {
          th.setAttribute(
            'style',
            'position:sticky;top:' +
              top +
              'px;z-index:99;background: white; border: 2px solid white;'
          );
        }
      });
    });
  }

  /**
   * Hace que las celdas del cuerpo de la tabla sean "sticky"
   * @param offsetTop Desplazamiento superior
   * @param offsetLeft Desplazamiento izquierdo
   * @param tBody Elemento del cuerpo de la tabla
   * @param className Nombre de la clase CSS para las celdas
   */
  private static stickyBody(
    offsetTop: number,
    offsetLeft: number,
    tBody: HTMLElement,
    className: string
  ) {
    const trs = tBody.getElementsByClassName(className);
    Array.from(trs).forEach((element) => {
      const content = element.innerHTML;
      const left = element.getBoundingClientRect().left - offsetLeft;
      if (element.getBoundingClientRect().height > 100) {
        element.innerHTML =
          '<span style="position: sticky; top: ' +
          offsetTop +
          'px;">' +
          content +
          '</span>';
      }
      element.setAttribute('style', 'position: sticky; left: ' + left + 'px;');
    });
  }
}
