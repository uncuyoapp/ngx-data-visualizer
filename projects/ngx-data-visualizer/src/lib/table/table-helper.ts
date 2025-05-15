/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PivotConfiguration } from "./table-configuration";
import { JQueryService } from "../utils/jquery.service";

// Extender la interfaz de jQuery para incluir los métodos de pivottable
declare global {
  interface JQuery {
    pivot(data: any[], options?: any, locale?: string): JQuery;
  }

  interface JQueryStatic {
    pivotUtilities: {
      aggregatorTemplates: {
        sum: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
        count: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
        average: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
      };
      renderers: {
        [key: string]: any;
      };
      derivers: {
        [key: string]: any;
      };
      locales: {
        [key: string]: any;
      };
      naturalSort: (a: any, b: any) => number;
      numberFormat: (opts?: any) => (num: number) => string;
      sortAs: (orderValues: string[]) => (a: string, b: string) => number;
    };
  }
}

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
  static renderPivot(element: HTMLDivElement, data: any[], config: PivotConfiguration): void {
    // Asegurarse de que jQuery esté inicializado
    if (!TableHelper.jQueryService) {
      throw new Error('TableHelper no ha sido inicializado. Llama a TableHelper.initialize() primero.');
    }
    
    const $ = TableHelper.jQueryService.$;
    const pivotConfiguration = TableHelper.configurePivot(config);
    $(element).pivot(data, pivotConfiguration, 'es');
    $('td').on('mouseenter', function (e: any) { $(e.currentTarget).click() });
    $('td').on('click', () => { });
  }

  static stickyTable(div: HTMLDivElement) {
    if (div.hasChildNodes()) {
      const table = div.childNodes[0] as HTMLTableElement;
      if (table.offsetHeight === 0) {
        setTimeout(() => TableHelper.stickyTable(div));
      } else if (table.tHead) {
        const offsetTop = table.getBoundingClientRect().top;
        const offsetLeft = table.getBoundingClientRect().left;
        TableHelper.stickyHeader(div, offsetTop, offsetLeft, table.tHead);
        TableHelper.stickyBody(table.tHead.clientHeight + 10, offsetLeft, table.tBodies[0], 'pvtRowLabel');
        TableHelper.stickyBody(table.tHead.clientHeight + 10, offsetLeft, table.tBodies[0], 'pvtTotalLabel');
      }
    }
  }

  private static configurePivot(config: PivotConfiguration) {
    const $ = TableHelper.jQueryService.$;
    const sum = $.pivotUtilities.aggregatorTemplates.sum;
    const numberFormat = $.pivotUtilities.numberFormat;
    const intFormat = numberFormat({
      decimalSep: ',',
      thousandsSep: '.',
      digitsAfterDecimal: config.digitsAfterDecimal ?? undefined,
      suffix: config.suffix
    });
    const sorters = TableHelper.configureSorters(config);
    return TableHelper.getPivotObject(sum, intFormat, sorters, config);
  }

  private static configureSorters(config: PivotConfiguration) {
    const $ = TableHelper.jQueryService.$;
    const sorters = {};
    config.sorters.forEach(sorter => {
      const items = [...sorter.items].sort((a, b) => a.order - b.order).map(a => a.name);
      Object.defineProperty(sorters, sorter.name, {
        value: $.pivotUtilities.sortAs(items),
        writable: true,
        enumerable: true,
        configurable: true
      });

    });
    return sorters;
  }

  private static getPivotObject(aggregator: any, numberFormat: any, sorters: any, config: PivotConfiguration) {
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
          clickCallback: (e: any, _value: any, filter: any) => TableHelper.hoverFunction(e, filter)
        }
      }
    };
  }

  private static hoverFunction(e: any, filter: any) {
    const $ = TableHelper.jQueryService.$;
    const x = e.clientX - e.offsetX;
    const y = e.clientY - e.offsetY - 1;
    const currentTarget = $(e.currentTarget);
    currentTarget.addClass('hovered');
    Object.values(filter).forEach(item => {
      const aux =
        $('th:contains(' + (item as string) + ')').filter((_i: any, th: any) => $(th).text() === item);
      if (aux.length > 1) {
        const parentType = aux[0].parentElement?.parentElement?.tagName;
        // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
        if (parentType === 'THEAD') {
          // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
          aux.filter((i: number) => {
            // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
            const rect = aux[i].getBoundingClientRect();
            return (x >= rect.x && x <= rect.x + rect.width);
          }).addClass('hovered');
        } else {
          // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
          aux.filter((i: number) => {
            // @ts-ignore - Ignorar errores de TypeScript para la manipulación de jQuery
            const rect = aux[i].getBoundingClientRect();
            return (y >= rect.y && y <= rect.y + rect.height);
          }).addClass('hovered');
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

  private static stickyHeader(div: HTMLDivElement, offsetTop: number, _offsetLeft: number, tHead: HTMLElement) {
    tHead.childNodes.forEach(tr => {
      tr.childNodes.forEach((th: any) => {
        const top = th.getBoundingClientRect().top - offsetTop;
        const left = tHead.clientWidth > div.clientWidth ? th.offsetLeft : 0;
        const css = th.getAttribute('class');
        if (!css) {
          th.setAttribute('style', 'position:sticky;top:' + top + 'px;left:' + left + 'px;z-index:999;background:white;border:2px solid white;');
          th.setAttribute('class', 'pvtCorner');
        } else if (css === 'pvtColLabel') {
          th.setAttribute('style', 'position:sticky;top:' + top + 'px;z-index: 99;background: white; border: 2px solid white;');
        } else if (css === 'pvtAxisLabel') {
          th.setAttribute('style', 'position:sticky;top:' + (top - 2) + 'px;left:' + (left > 0 ? left + 4 : 0) + 'px; z-index: 999; background:white; border: 2px solid white;');
        } else {
          th.setAttribute('style', 'position:sticky;top:' + top + 'px;z-index:99;background: white; border: 2px solid white;');
        }
      });
    });
  }

  private static stickyBody(offsetTop: number, offsetLeft: number, tBody: HTMLElement, className: string) {
    const trs = tBody.getElementsByClassName(className);
    Array.from(trs).forEach(element => {
      const content = element.innerHTML;
      const left = element.getBoundingClientRect().left - offsetLeft;
      if (element.getBoundingClientRect().height > 100) {
        element.innerHTML = '<span style="position: sticky; top: ' + offsetTop + 'px;">' + content + '</span>';
      }
      element.setAttribute('style', 'position: sticky; left: ' + left + 'px;');
    });
  }

}
