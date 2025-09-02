/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { RowData } from "../../types/data.types";
import { TableOptions } from "../types/table-base";
import { JQueryService } from "./jquery.service";

/**
 * Clase auxiliar para la manipulación y renderizado de tablas pivot
 * Proporciona funcionalidades para:
 * - Renderizar tablas pivot con configuración personalizada
 * - Implementar efectos de "sticky" para mejorar la navegación
 * - Manejar interacciones del usuario como hover y clics
 * - Configurar ordenamiento y formato de datos
 */
export class TableHelper {
  /** Instancia estática de jQuery proporcionada por el servicio */
  private static jQueryService: JQueryService;

  /** Clases de cabecera relevantes para hover (definidas una sola vez) */
  private static readonly HEADER_CLASSES = [
    "pvtColLabel",
    "pvtRowLabel",
    "pvtColTotalLabel",
    "pvtRowTotalLabel",
  ];

  /**
   * Mapeo de clase a función handler (definido una sola vez)
   * Permite extender fácilmente el soporte a nuevas cabeceras.
   */
  private static readonly hoverHandlers: Record<
    string,
    (th: JQuery<HTMLElement>, table: JQuery<HTMLElement>) => void
  > = {
    pvtColLabel: TableHelper.highlightColHeaders,
    pvtRowLabel: TableHelper.highlightRowHeaders,
    pvtColTotalLabel: TableHelper.highlightColTotals,
    pvtRowTotalLabel: TableHelper.highlightRowTotals,
  };

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
    config: TableOptions,
  ): void {
    // Asegurarse de que jQuery esté inicializado
    if (!TableHelper.jQueryService) {
      throw new Error(
        "TableHelper no ha sido inicializado. Llama a TableHelper.initialize() primero.",
      );
    }
    const $ = TableHelper.jQueryService.$;
    const pivotConfiguration = TableHelper.configurePivot(config);
    $(element).pivot(data, pivotConfiguration, "es");

    // Aplicar eventos solo a los elementos td de esta tabla específica
    $(element)
      .find("td")
      .on("mouseenter", function (e: any) {
        $(e.currentTarget).trigger("click");
      });
    $(element)
      .find("td")
      .on("click", () => {});

    // Agregar el manejo de auto-scroll
    TableHelper.setupAutoScroll(element);
    // Agregar el manejo de hover en cabeceras
    TableHelper.setupHeaderHover(element);
  }

  /**
   * Configura el comportamiento de auto-scroll cuando el mouse se acerca a los bordes
   * @param element Elemento contenedor de la tabla
   */
  private static setupAutoScroll(element: HTMLDivElement): void {
    const $ = TableHelper.jQueryService.$;
    const scrollThreshold = 50; // Distancia en píxeles desde el borde para activar el scroll
    const scrollSpeed = 10; // Velocidad del scroll en píxeles por frame
    let scrollInterval: number | null = null;

    $(element).on("mousemove", (e: any) => {
      const rect = element.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const maxX = rect.width;

      // Detener cualquier scroll anterior
      if (scrollInterval) {
        window.clearInterval(scrollInterval);
        scrollInterval = null;
      }

      // Determinar la dirección del scroll horizontal únicamente
      let scrollX = 0;

      const target = e.target as HTMLElement;

      // Scroll hacia la derecha: cuando el mouse está sobre el borde derecho de la tabla
      if (mouseX > maxX - scrollThreshold) {
        scrollX = scrollSpeed;
      }
      // Scroll hacia la izquierda: cuando el mouse está en una zona centrada en el borde derecho de un th.pvtRowLabel con rowspan=1
      else {
        const thElement = target.closest("th.pvtRowLabel");
        if (thElement && thElement.getAttribute("rowspan") === "1") {
          const thRect = thElement.getBoundingClientRect();
          const tableRect = element.getBoundingClientRect();
          const thRightEdge = thRect.right - tableRect.left;
          const halfThreshold = scrollThreshold / 2;

          // Activar scroll hacia la izquierda si está en la zona centrada alrededor del borde derecho
          if (
            mouseX >= thRightEdge - halfThreshold &&
            mouseX <= thRightEdge + halfThreshold
          ) {
            scrollX = -scrollSpeed;
          }
        }
      }

      // Iniciar el scroll horizontal si es necesario
      if (scrollX !== 0) {
        scrollInterval = window.setInterval(() => {
          element.scrollLeft += scrollX;
        }, 16); // Aproximadamente 60fps
      }
    });

    // Detener el scroll cuando el mouse sale del elemento
    $(element).on("mouseleave", () => {
      if (scrollInterval) {
        window.clearInterval(scrollInterval);
        scrollInterval = null;
      }
    });
  }

  /**
   * Configura y aplica el efecto hover sobre cabeceras y celdas de datos.
   * @param element Elemento contenedor de la tabla
   */
  private static setupHeaderHover(element: HTMLDivElement): void {
    const $ = TableHelper.jQueryService.$;
    $(element)
      .find(TableHelper.HEADER_CLASSES.map((cls) => "th." + cls).join(", "))
      .on("mouseenter", function (e: any) {
        const $th = $(e.currentTarget);
        if (!$th || $th.length === 0) {
          // eslint-disable-next-line no-console
          console.warn("TableHelper: th no encontrado en mouseenter");
          return;
        }
        const table = $th.closest("table");
        if (!table || table.length === 0) {
          // eslint-disable-next-line no-console
          console.warn("TableHelper: tabla no encontrada en mouseenter");
          return;
        }
        TableHelper.clearHoverClasses(table);
        const thClass = TableHelper.HEADER_CLASSES.find((cls) =>
          $th.hasClass(cls),
        );
        if (!thClass) {
          // eslint-disable-next-line no-console
          console.warn(
            "TableHelper: clase de cabecera no mapeada",
            $th.attr("class"),
          );
          return;
        }
        TableHelper.hoverHandlers[thClass]($th, table);
      })
      .on("mouseleave", function (e: any) {
        const $th = $(e.currentTarget);
        if (!$th || $th.length === 0) return;
        $th.removeClass("header-hovered");
        const table = $th.closest("table");
        if (!table || table.length === 0) return;
        TableHelper.clearHoverClasses(table);
      });
  }

  /**
   * Limpia todas las clases de hover de cabeceras y celdas de datos.
   *
   * Se llama tanto en mouseenter como en mouseleave para garantizar que:
   * - No queden clases pegadas si el usuario mueve el mouse rápidamente entre cabeceras.
   * - Se eliminan efectos colaterales en tablas dinámicas o con cambios de DOM.
   * - La experiencia visual es siempre consistente, incluso ante edge cases.
   *
   * Si se desea optimizar, podría limpiarse solo los elementos afectados, pero esta versión prioriza robustez y simplicidad.
   *
   * @param table Tabla jQuery
   */
  private static clearHoverClasses(table: JQuery<HTMLElement>): void {
    table
      .find(
        "th.pvtColLabel, th.pvtRowLabel, th.pvtColTotalLabel, th.pvtRowTotalLabel",
      )
      .removeClass("header-hovered");
    table.find("td").removeClass("data-hovered");
  }

  /**
   * Resalta todas las cabeceras de columna y celdas de datos relacionadas al hacer hover sobre una cabecera de columna.
   *
   * @param $th Cabecera de columna sobre la que se hace hover
   * @param table Tabla jQuery
   */
  private static highlightColHeaders(
    $th: JQuery<HTMLElement>,
    table: JQuery<HTMLElement>,
  ): void {
    // Obtener el tr padre
    const $tr = $th.parent();
    // Listar todos los th.pvtColLabel en el tr
    const $allColLabels = $tr.children("th.pvtColLabel");
    // Sumar los colspan de los hermanos previos para obtener colStart
    let colStart = 0;
    $allColLabels.each(function () {
      if (this === $th[0]) {
        return false;
      }
      colStart += parseInt($(this).attr("colspan") ?? "1", 10);
      return undefined;
    });
    // Leer colspan del th actual
    const colspan = parseInt($th.attr("colspan") ?? "1", 10);
    // Resaltar todas las columnas correspondientes al colspan
    for (let i = 0; i < colspan; i++) {
      const colIndex = colStart + i;
      const colClass = "col" + colIndex;
      // Resaltar celdas de datos
      table
        .find("td.pvtVal,td.pvtTotal")
        .filter("." + colClass)
        .addClass("data-hovered");
      // Resaltar celdas de total de columna
      table
        .find('td.pvtTotal.colTotal[data-for="col' + colIndex + '"]')
        .addClass("data-hovered");
    }
    // Resaltar subcabeceras th.pvtColLabel en niveles inferiores
    const $thead = table.find("thead");
    const $trs = $thead.find("tr");
    const currentTrIndex = $tr.index();
    // Para cada tr debajo del actual
    for (let t = currentTrIndex + 1; t < $trs.length; t++) {
      let colCursor = 0;
      $trs
        .eq(t)
        .children("th.pvtColLabel")
        .each(function () {
          const $subTh = $(this);
          const subColspan = parseInt($subTh.attr("colspan") ?? "1", 10);
          // Si el rango de este th se solapa con el rango del hover, colorear
          const subStart = colCursor;
          const subEnd = colCursor + subColspan - 1;
          const hoverStart = colStart;
          const hoverEnd = colStart + colspan - 1;
          if (subEnd >= hoverStart && subStart <= hoverEnd) {
            $subTh.addClass("header-hovered");
          }
          colCursor += subColspan;
          return undefined;
        });
    }
    // Resaltar cabeceras padre en todas las filas superiores (ancestros)
    let parentTrIndex = currentTrIndex - 1;
    const parentHoverStart = colStart;
    const parentHoverEnd = colStart + colspan - 1;
    while (parentTrIndex >= 0) {
      let colCursor = 0;
      const $parentTr = $trs.eq(parentTrIndex);
      $parentTr.children("th.pvtColLabel").each(function () {
        const $parentTh = $(this);
        const parentColspan = parseInt($parentTh.attr("colspan") ?? "1", 10);
        const parentStart = colCursor;
        const parentEnd = colCursor + parentColspan - 1;
        if (parentEnd >= parentHoverStart && parentStart <= parentHoverEnd) {
          $parentTh.addClass("header-hovered");
        }
        colCursor += parentColspan;
        return undefined;
      });
      parentTrIndex--;
    }
    // Resaltar la cabecera activa
    $th.addClass("header-hovered");
  }

  /**
   * Resalta todas las cabeceras de fila y celdas de datos relacionadas al hacer hover sobre una cabecera de fila.
   * Utiliza coordenadas visuales para detectar solapamientos.
   *
   * @param $th Cabecera de fila sobre la que se hace hover
   * @param table Tabla jQuery
   */
  private static highlightRowHeaders(
    $th: JQuery<HTMLElement>,
    table: JQuery<HTMLElement>,
  ): void {
    const thRect = $th[0].getBoundingClientRect();
    const thYStart = thRect.y;
    const thYEnd = thRect.bottom;
    const $tbody = table.find("tbody");
    const $trs = $tbody.find("tr");
    $trs.each(function () {
      const trRect = this.getBoundingClientRect();
      const trYStart = trRect.y;
      const trYEnd = trRect.bottom;
      // Colorear th.pvtRowLabel de este tr que se solapen con el rango
      $(this)
        .find("th.pvtRowLabel")
        .each(function () {
          const subThRect = this.getBoundingClientRect();
          if (subThRect.bottom > thYStart && subThRect.y < thYEnd) {
            $(this).addClass("header-hovered");
          }
        });
      // Si el tr está completamente antes del rango, seguir
      if (trYEnd <= thYStart) return undefined;
      // Si el tr está completamente después del rango, cortar el bucle
      if (trYStart >= thYEnd) return false;
      // Si el tr está dentro o solapa el rango de la cabecera, colorear los td
      $(this).find("td.pvtVal,td.pvtTotal").addClass("data-hovered");
      return undefined;
    });
    // Colorear la cabecera activa
    $th.addClass("header-hovered");
  }

  /**
   * Resalta todas las celdas de totales de columna y la cabecera de total al hacer hover.
   *
   * @param $th Cabecera de total de columna
   * @param table Tabla jQuery
   */
  private static highlightColTotals(
    $th: JQuery<HTMLElement>,
    table: JQuery<HTMLElement>,
  ): void {
    table.find("td.colTotal").addClass("data-hovered");
    $th.addClass("header-hovered");
  }

  /**
   * Resalta todas las celdas de totales de fila y la cabecera de total al hacer hover.
   *
   * @param $th Cabecera de total de fila
   * @param table Tabla jQuery
   */
  private static highlightRowTotals(
    $th: JQuery<HTMLElement>,
    table: JQuery<HTMLElement>,
  ): void {
    table.find("td.rowTotal").addClass("data-hovered");
    $th.addClass("header-hovered");
  }

  /**
   * Hace que la tabla sea "sticky" (fija) para mejorar la navegación en tablas grandes
   * @param div Elemento HTML que contiene la tabla
   */
  static stickyTable(div: HTMLDivElement) {
    if (div.hasChildNodes()) {
      const table = div.childNodes[0] as HTMLTableElement;

      if (table.offsetHeight === 0) {
        requestAnimationFrame(() => TableHelper.stickyTable(div));
        return;
      } else if (table.tHead) {
        // Limpiar estilos sticky existentes antes de aplicar nuevos
        TableHelper.clearStickyStyles(table);

        const offsetTop = table.getBoundingClientRect().top;
        const offsetLeft = TableHelper.getOffsetLeft(table);

        TableHelper.stickyHeader(div, offsetTop, offsetLeft, table.tHead);
        TableHelper.stickyBody(
          table.tHead.clientHeight,
          offsetLeft,
          table.tBodies[0],
          "pvtRowLabel",
        );
        TableHelper.stickyBody(
          table.tHead.clientHeight,
          offsetLeft,
          table.tBodies[0],
          "pvtTotalLabel",
        );
      }
    }
  }

  /**
   * Limpia los estilos sticky existentes de la tabla
   * @param table Elemento de la tabla
   */
  private static clearStickyStyles(table: HTMLTableElement): void {
    // Limpiar estilos de todos los elementos th
    const allThs = table.querySelectorAll("th");
    allThs.forEach((th) => {
      (th as HTMLElement).style.position = "";
      (th as HTMLElement).style.top = "";
      (th as HTMLElement).style.left = "";
      (th as HTMLElement).style.zIndex = "";
    });

    // Limpiar estilos de elementos td con clases específicas
    const stickyTds = table.querySelectorAll(".pvtRowLabel, .pvtTotalLabel");
    stickyTds.forEach((td) => {
      (td as HTMLElement).style.position = "";
      (td as HTMLElement).style.left = "";
      // Remover spans internos con sticky
      const stickySpans = td.querySelectorAll(
        'span[style*="position: sticky"]',
      );
      stickySpans.forEach((span) => {
        (span as HTMLElement).style.position = "";
        (span as HTMLElement).style.top = "";
      });
    });
  }

  /**
   * Configura las opciones del pivot table
   * @param config Configuración del pivot table
   * @returns Objeto de configuración para el pivot table
   */
  private static configurePivot(config: TableOptions) {
    const $ = TableHelper.jQueryService.$;
    const aggregators = $.pivotUtilities.aggregators;

    let aggregator;
    switch (config.valueDisplay) {
      case "percentOfTotal":
        aggregator = aggregators["Sum as Fraction of Total"];
        break;
      case "percentOfRow":
        aggregator = aggregators["Sum as Fraction of Rows"];
        break;
      case "percentOfColumn":
        aggregator = aggregators["Sum as Fraction of Columns"];
        break;
      default: // 'nominal' o indefinido
        aggregator = aggregators["Sum"];
        break;
    }

    const sorters = TableHelper.configureSorters(config);

    return {
      aggregator: aggregator([
        "valor",
      ]),
      cols: config.cols as string[],
      rows: config.rows as string[],
      sorters,
      derivedAttributes: config.derivedAttributes,
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
   * Configura los ordenadores personalizados para el pivot table
   * @param config Configuración del pivot table
   * @returns Objeto con los ordenadores configurados
   */
  private static configureSorters(config: TableOptions) {
    const $ = TableHelper.jQueryService.$;
    const sorters: Record<string, (a: string, b: string) => number> = {};
    (config.sorters as { name: string; items: { name: string; order: number }[] }[]).forEach(
      (sorter) => {
        const items = [...sorter.items]
          .sort((a, b) => a.order - b.order)
          .map((a) => a.name);
        Object.defineProperty(sorters, sorter.name, {
          value: $.pivotUtilities.sortAs(items),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
    );
    return sorters;
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
    const currentTable = currentTarget.closest("table");

    // Obtener las coordenadas relativas al elemento
    const x = rect.left;
    const y = rect.top;

    // Identificar si el target es un label o una celda de datos
    const isLabel = currentTarget.is(
      "th.pvtColLabel, th.pvtRowLabel, th.pvtColTotalLabel, th.pvtRowTotalLabel, th.pvtAxisLabel, th.pvtTotalLabel",
    );
    const isData = currentTarget.is("td.pvtVal, td.pvtTotal, td.pvtGrandTotal");

    if (isLabel) {
      currentTarget.addClass("header-hovered");
    } else if (isData) {
      currentTarget.addClass("data-hovered");
    }

    Object.values(filter).forEach((item) => {
      const aux = $(currentTable)
        .find("th:contains(" + (item as string) + ")")
        .filter((_i: any, th: any) => $(th).text() == item);
      if (aux.length > 1) {
        const parentType = aux[0].parentElement?.parentElement?.tagName;
        if (parentType === "THEAD") {
          aux
            .filter((i: number) => {
              const rect = aux[i].getBoundingClientRect();
              return x >= rect.x && x <= rect.x + rect.width;
            })
            .addClass("header-hovered");
        } else {
          aux
            .filter((i: number) => {
              const rect = aux[i].getBoundingClientRect();
              return y >= rect.y && y <= rect.y + rect.height;
            })
            .addClass("header-hovered");
        }
      } else {
        aux.addClass("header-hovered");
      }
    });

    if (currentTarget.hasClass("rowTotal")) {
      $(currentTable).find(".pvtRowTotalLabel").addClass("header-hovered");
    }
    if (currentTarget.hasClass("colTotal")) {
      $(currentTable).find(".pvtColTotalLabel").addClass("header-hovered");
    }
    if (currentTarget.hasClass("pvtGrandTotal")) {
      $(currentTable).find(".pvtRowTotalLabel").addClass("header-hovered");
      $(currentTable).find(".pvtColTotalLabel").addClass("header-hovered");
    }

    // Si es una celda de datos, resaltar también con data-hovered
    if (isData) {
      currentTarget.addClass("data-hovered");
    }

    currentTarget.on("mouseout", () => {
      $(currentTable)
        .find("th, td")
        .removeClass("header-hovered data-hovered hovered");
    });
  }

  /**
   * Aplica estilos CSS a un elemento HTML de manera segura
   * @param element Elemento HTML al que se aplicarán los estilos
   * @param styles Objeto con los estilos a aplicar
   */
  private static applyStyles(
    element: HTMLElement,
    styles: Record<string, string | number>,
  ): void {
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
    tHead: HTMLElement,
  ) {
    tHead.childNodes.forEach((tr) => {
      tr.childNodes.forEach((th: any) => {
        const top = th.getBoundingClientRect().top - offsetTop;
        const left =
          tHead.clientWidth > div.clientWidth
            ? th.clientLeft + th.offsetLeft
            : 0;
        const css = th.getAttribute("class");

        const baseStyles = {
          position: "sticky",
          top: `${top}px`,
          // zIndex: '1',
        };

        if (!css) {
          TableHelper.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
          });
          th.setAttribute("class", "pvtCorner");
        } else if (css === "pvtColLabel") {
          TableHelper.applyStyles(th, {
            ...baseStyles,
            // zIndex: 2
          });
        } else if (css === "pvtAxisLabel") {
          TableHelper.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
          });
        } else if (css === "pvtCorner") {
          // Manejar elementos pvtCorner existentes
          TableHelper.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
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
    className: string,
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
          "</span>";
      }
      element.setAttribute("style", "position: sticky; left: " + left + "px;");
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
