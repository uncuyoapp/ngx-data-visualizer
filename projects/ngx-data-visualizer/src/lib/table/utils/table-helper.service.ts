/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from "@angular/core";
import { RowData } from "../../types/data.types";
import { TableOptions } from "../types/table-base";
import { JQueryService } from "./jquery.service";

/**
 * Servicio para la manipulación y renderizado de tablas pivot.
 * Proporciona funcionalidades para:
 * - Renderizar tablas pivot con configuración personalizada
 * - Implementar efectos de "sticky" para mejorar la navegación
 * - Manejar interacciones del usuario como hover y clics
 * - Configurar ordenamiento y formato de datos
 */
@Injectable()
export class TableHelperService {
  /** Clases de cabecera relevantes para hover (definidas una sola vez) */
  private readonly HEADER_CLASSES = [
    "pvtColLabel",
    "pvtRowLabel",
    "pvtColTotalLabel",
    "pvtRowTotalLabel",
  ];

  /**
   * Mapeo de clase a función handler (definido una sola vez)
   * Permite extender fácilmente el soporte a nuevas cabeceras.
   */
  private readonly hoverHandlers: Record<
    string,
    (th: JQuery<HTMLElement>, table: JQuery<HTMLElement>) => void
  > = {
    pvtColLabel: this.highlightColHeaders,
    pvtRowLabel: this.highlightRowHeaders,
    pvtColTotalLabel: this.highlightColTotals,
    pvtRowTotalLabel: this.highlightRowTotals,
  };

  constructor(private readonly jQueryService: JQueryService) {}

  /**
   * Renderiza una tabla HTML en un elemento HTMLElement usando pivotJS
   *
   * @param element HTMLElement es el elemento donde se vinculará la tabla pivot
   * @param data RowData[] es el array con los datos para el pivot
   * @param config PivotConfiguration es la configuración para la tabla pivot
   */
  renderPivot(
    element: HTMLDivElement,
    data: RowData[],
    config: TableOptions,
  ): void {
    const $ = this.jQueryService.$;
    const pivotConfiguration = this.configurePivot(config);
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
    this.setupAutoScroll(element);
    // Agregar el manejo de hover en cabeceras
    this.setupHeaderHover(element);
  }

  /**
   * Hace que la tabla sea "sticky" (fija) para mejorar la navegación en tablas grandes
   * @param div Elemento HTML que contiene la tabla
   */
  stickyTable(div: HTMLDivElement) {
    if (div.hasChildNodes()) {
      const table = div.childNodes[0] as HTMLTableElement;

      if (table.offsetHeight === 0) {
        requestAnimationFrame(() => this.stickyTable(div));
        return;
      } else if (table.tHead) {
        // Limpiar estilos sticky existentes antes de aplicar nuevos
        this.clearStickyStyles(table);

        const offsetTop = table.getBoundingClientRect().top;
        const offsetLeft = this.getOffsetLeft(table);

        this.stickyHeader(div, offsetTop, offsetLeft, table.tHead);
        this.stickyBody(
          table.tHead.clientHeight,
          offsetLeft,
          table.tBodies[0],
          "pvtRowLabel",
        );
        this.stickyBody(
          table.tHead.clientHeight,
          offsetLeft,
          table.tBodies[0],
          "pvtTotalLabel",
        );
      }
    }
  }

  /**
   * Configura el comportamiento de auto-scroll horizontal cuando el cursor del mouse
   * se acerca a los bordes izquierdo o derecho del contenedor de la tabla.
   * @param element - El elemento `HTMLDivElement` que contiene la tabla pivot.
   * @private
   */
  private setupAutoScroll(element: HTMLDivElement): void {
    const $ = this.jQueryService.$;
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
   * Vincula los eventos `mouseenter` y `mouseleave` a las cabeceras de la tabla
   * para disparar la lógica de resaltado (hover).
   * @param element - El elemento `HTMLDivElement` que contiene la tabla pivot.
   * @private
   */
  private setupHeaderHover(element: HTMLDivElement): void {
    const $ = this.jQueryService.$;
    $(element)
      .find(this.HEADER_CLASSES.map((cls) => "th." + cls).join(", "))
      .on("mouseenter", (e: any) => {
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
        this.clearHoverClasses(table);
        const thClass = this.HEADER_CLASSES.find((cls) => $th.hasClass(cls));
        if (!thClass) {
          // eslint-disable-next-line no-console
          console.warn(
            "TableHelper: clase de cabecera no mapeada",
            $th.attr("class"),
          );
          return;
        }
        this.hoverHandlers[thClass]($th, table);
      })
      .on("mouseleave", (e: any) => {
        const $th = $(e.currentTarget);
        if (!$th || $th.length === 0) return;
        $th.removeClass("header-hovered");
        const table = $th.closest("table");
        if (!table || table.length === 0) return;
        this.clearHoverClasses(table);
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
  private clearHoverClasses(table: JQuery<HTMLElement>): void {
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
  private highlightColHeaders(
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
  private highlightRowHeaders(
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
  private highlightColTotals(
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
  private highlightRowTotals(
    $th: JQuery<HTMLElement>,
    table: JQuery<HTMLElement>,
  ): void {
    table.find("td.rowTotal").addClass("data-hovered");
    $th.addClass("header-hovered");
  }

  /**
   * Limpia todos los estilos de posicionamiento `sticky` aplicados a la tabla.
   * Es crucial para evitar estilos residuales al redibujar o actualizar la tabla.
   * @param table - El elemento `HTMLTableElement` a limpiar.
   * @private
   */
  private clearStickyStyles(table: HTMLTableElement): void {
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
   * Transforma la configuración de la tabla de la librería a un formato compatible con `pivot.js`.
   * @param config - La configuración de la tabla (`TableOptions`).
   * @returns Un objeto de configuración listo para ser usado por `pivot.js`.
   * @private
   */
  private configurePivot(config: TableOptions) {
    const $ = this.jQueryService.$;
    const aggregators = $.pivotUtilities.aggregators;
    const numberFormat = $.pivotUtilities.numberFormat;

    // Configurar el formato de números con decimales y sufijo
    const intFormat = numberFormat({
      digitsAfterDecimal: config.digitsAfterDecimal ?? 0,
      suffix: config.suffix || "",
    });

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
        aggregator = ($.pivotUtilities as any).aggregatorTemplates.sum(
          intFormat,
        );
        break;
    }

    const sorters = this.configureSorters(config);

    return {
      showDecimals: config.digitsAfterDecimal > 0,
      aggregator: aggregator(["valor"]),
      cols: config.cols as string[],
      rows: config.rows as string[],
      sorters,
      derivedAttributes: config.derivedAttributes,
      rendererOptions: {
        table: {
          rowTotals: config.cols.length > 0 ? config.totalRow : true,
          colTotals: config.rows.length > 0 ? config.totalCol : true,
          clickCallback: (e: any, _value: any, filter: any) =>
            this.hoverFunction(e, filter),
        },
      },
    };
  }

  /**
   * Configura las funciones de ordenamiento para cada dimensión de la tabla pivotante.
   * @param config - La configuración de la tabla que contiene los `sorters`.
   * @returns Un objeto donde cada clave es una dimensión y el valor es una función de ordenamiento.
   * @private
   */
  private configureSorters(config: TableOptions) {
    const $ = this.jQueryService.$;
    const sorters: Record<string, (a: string, b: string) => number> = {};
    (
      config.sorters as {
        name: string;
        items: { name: string; order: number }[];
      }[]
    ).forEach((sorter) => {
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
   * Función de callback que se ejecuta al hacer clic o `mouseenter` en una celda.
   * Aplica clases de resaltado a las cabeceras y celdas correspondientes.
   * @param e - El evento del mouse.
   * @param filter - Un objeto de `pivot.js` que contiene los filtros de la celda actual.
   * @private
   */
  private hoverFunction(e: any, filter: any) {
    const $ = this.jQueryService.$;
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
   * Aplica un conjunto de estilos CSS a un elemento HTML.
   * @param element - El elemento al que se aplicarán los estilos.
   * @param styles - Un objeto de clave-valor con los estilos CSS.
   * @private
   */
  private applyStyles(
    element: HTMLElement,
    styles: Record<string, string | number>,
  ): void {
    Object.assign(element.style, styles);
  }

  /**
   * Aplica posicionamiento `sticky` a las celdas del encabezado (`thead`) de la tabla
   * para mantenerlas visibles durante el scroll vertical.
   * @param div - El contenedor de la tabla.
   * @param offsetTop - El desplazamiento superior para calcular la posición `top`.
   * @param _offsetLeft - Desplazamiento izquierdo (actualmente no usado aquí, pero mantenido por consistencia).
   * @param tHead - El elemento `thead` de la tabla.
   * @private
   */
  private stickyHeader(
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
          this.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
          });
          th.setAttribute("class", "pvtCorner");
        } else if (css === "pvtColLabel") {
          this.applyStyles(th, {
            ...baseStyles,
            // zIndex: 2
          });
        } else if (css === "pvtAxisLabel") {
          this.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
          });
        } else if (css === "pvtCorner") {
          // Manejar elementos pvtCorner existentes
          this.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
            // zIndex: '3',
          });
        } else {
          this.applyStyles(th, baseStyles);
        }
      });
    });
  }

  /**
   * Aplica posicionamiento `sticky` a las celdas de cabecera de fila (`th.pvtRowLabel`)
   * para mantenerlas visibles durante el scroll horizontal.
   * @param offsetTop - El desplazamiento superior para el contenido `sticky` dentro de la celda.
   * @param offsetLeft - El desplazamiento izquierdo para calcular la posición `left`.
   * @param tBody - El elemento `tbody` de la tabla.
   * @param className - La clase de las celdas a las que se aplicará el efecto (`pvtRowLabel`, `pvtTotalLabel`).
   * @private
   */
  private stickyBody(
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
   * Calcula el `offsetLeft` real de la tabla, teniendo en cuenta el padding y margen del contenedor.
   * @param table - El elemento `HTMLTableElement`.
   * @returns El desplazamiento izquierdo calculado.
   * @private
   */
  private getOffsetLeft(table: HTMLElement): number {
    const offsetLeft = table.getBoundingClientRect().left;
    const style = window.getComputedStyle(table);
    const paddingLeft = parseFloat(style.paddingLeft);
    const marginLeft = parseFloat(style.marginLeft);
    return offsetLeft + paddingLeft + marginLeft;
  }
}
