/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PivotConfiguration } from '../types/table-base';
import { JQueryService } from './jquery.service';
import { RowData } from '../../types/data.types';

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
   * Renderiza una tabla HTML en un elemento HTMLElement usando pivotJS
   *
   * @param element HTMLElement es el elemento donde se vinculará la tabla pivot
   * @param data RowData[] es el array con los datos para el pivot
   * @param config PivotConfiguration es la configuración para la tabla pivot
   */
  static renderPivot(
    element: HTMLDivElement,
    data: RowData[],
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
    $('td').on('click', () => { });
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
        const offsetLeft = TableHelper.getOffsetLeft(table);

        TableHelper.stickyHeader(div, offsetTop, offsetLeft, table.tHead);
        TableHelper.stickyBody(
          table.tHead.clientHeight,
          offsetLeft,
          table.tBodies[0],
          'pvtRowLabel'
        );
        TableHelper.stickyBody(
          table.tHead.clientHeight,
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
    config.sorters.forEach(
      (sorter: {
        name: string;
        items: Array<{ name: string; order: number }>;
      }) => {
        const items = [...sorter.items]
          .sort((a, b) => a.order - b.order)
          .map((a) => a.name);
        Object.defineProperty(sorters, sorter.name, {
          value: $.pivotUtilities.sortAs(items),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    );
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
   * Aplica estilos CSS a un elemento HTML de manera segura
   * @param element Elemento HTML al que se aplicarán los estilos
   * @param styles Objeto con los estilos a aplicar
   */
  private static applyStyles(element: HTMLElement, styles: Record<string, string | number>): void {
    Object.assign(element.style, styles);
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

        const baseStyles = {
          position: 'sticky',
          top: `${top}px`,
          zIndex: '99',
          background: 'white',
          border: '2px solid white'
        };

        if (!css) {
          TableHelper.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            zIndex: '999'
          });
          th.setAttribute('class', 'pvtCorner');
        } else if (css === 'pvtColLabel') {
          TableHelper.applyStyles(th, baseStyles);
        } else if (css === 'pvtAxisLabel') {
          TableHelper.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            zIndex: '999'
          });
        } else {
          TableHelper.applyStyles(th, baseStyles);
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

  /**
   * Calcula el offset izquierdo de la tabla considerando padding y margin
   * @param table Elemento HTML de la tabla
   * @returns Número que representa el offset izquierdo ajustado
   */
  private static getOffsetLeft(table: HTMLElement): number {
    const offsetLeft = table.getBoundingClientRect().left;
    const style = window.getComputedStyle(table);
    const paddingLeft = parseFloat(style.paddingLeft);
    const marginLeft = parseFloat(style.marginLeft);
    return offsetLeft + paddingLeft + marginLeft;
  }
}
