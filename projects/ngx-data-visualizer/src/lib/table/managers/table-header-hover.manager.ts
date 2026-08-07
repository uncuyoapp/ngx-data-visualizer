/* eslint-disable @typescript-eslint/no-explicit-any */
import { JQueryService } from "../utils/jquery.service";

/**
 * Estructura del índice de la tabla pivot precalculado en memoria.
 */
export interface TableGridIndex {
  /** Map de colIndex -> pila de cabeceras TH de columna desde la hoja hasta la raíz */
  colAncestorsMap: Map<number, HTMLElement[]>;
  /** Map de rowIndex -> pila de cabeceras TH de fila desde la hoja hasta la raíz */
  rowAncestorsMap: Map<number, HTMLElement[]>;
  /** Map de TH -> rango de índices de columna o fila que abarca */
  headerSpanMap: Map<
    HTMLElement,
    { type: "col" | "row"; start: number; end: number }
  >;
  /** Map de colIndex -> celdas TD de esa columna */
  colDataCellsMap: Map<number, HTMLElement[]>;
  /** Map de rowIndex -> celdas TD de esa fila */
  rowDataCellsMap: Map<number, HTMLElement[]>;
  /** Map de TH -> arreglo de sub-cabeceras y celdas TD pertenecientes a su subárbol */
  headerSubtreeMap: Map<HTMLElement, HTMLElement[]>;
}

/**
 * Clase administradora encargada del sistema de resaltado (hover) de cabeceras y celdas en la tabla pivot.
 * Utiliza una matriz de índices en memoria para resolver resaltados jerárquicos y cruzados en O(1),
 * eliminando completamente el Layout Thrashing por lecturas de getBoundingClientRect.
 */
export class TableHeaderHoverManager {
  /** Elementos actualmente resaltados para limpieza directa sin recorrer el DOM */
  private activeHoveredElements: HTMLElement[] = [];

  /** Instancia cacheada del índice de la tabla */
  private cachedGridIndex: TableGridIndex | null = null;
  /** Elemento HTMLTableElement asociado al índice cacheado */
  private cachedTableElement: HTMLElement | null = null;

  constructor(private readonly jQueryService: JQueryService) { }

  /**
   * Obtiene la matriz `TableGridIndex` desde el caché interno o la construye si no existe/cambió la tabla.
   * @param table Elemento HTMLTableElement o contenedor de la tabla.
   */
  public getOrBuildGridIndex(table: HTMLElement): TableGridIndex {
    const htmlTable =
      table.tagName === "TABLE"
        ? (table as HTMLTableElement)
        : table.querySelector("table");

    if (
      this.cachedGridIndex &&
      this.cachedTableElement &&
      htmlTable &&
      this.cachedTableElement === htmlTable
    ) {
      return this.cachedGridIndex;
    }

    const gridIndex = this.buildTableGridIndex(table);
    if (htmlTable) {
      this.cachedTableElement = htmlTable;
      this.cachedGridIndex = gridIndex;
    }
    return gridIndex;
  }

  /**
   * Invalida el caché interno de `TableGridIndex`.
   */
  public clearGridIndexCache(): void {
    this.cachedGridIndex = null;
    this.cachedTableElement = null;
  }

  /**
   * Construye el índice `TableGridIndex` a partir del elemento HTMLTableElement.
   * Interpreta los niveles K dinámicos de filas y columnas, respetando atributos colspan y rowspan.
   * @param table Elemento HTMLTableElement o contenedor de la tabla.
   */
  public buildTableGridIndex(table: HTMLElement): TableGridIndex {
    const colAncestorsMap = new Map<number, HTMLElement[]>();
    const rowAncestorsMap = new Map<number, HTMLElement[]>();
    const headerSpanMap = new Map<
      HTMLElement,
      { type: "col" | "row"; start: number; end: number }
    >();
    const colDataCellsMap = new Map<number, HTMLElement[]>();
    const rowDataCellsMap = new Map<number, HTMLElement[]>();
    const headerSubtreeMap = new Map<HTMLElement, HTMLElement[]>();

    const htmlTable =
      table.tagName === "TABLE"
        ? (table as HTMLTableElement)
        : table.querySelector("table");

    if (!htmlTable) {
      return {
        colAncestorsMap,
        rowAncestorsMap,
        headerSpanMap,
        colDataCellsMap,
        rowDataCellsMap,
        headerSubtreeMap,
      };
    }

    // 1. Indexar cabeceras de columnas en thead (Niveles K)
    const tHead = htmlTable.tHead;
    if (tHead) {
      const headerRows = Array.from(tHead.rows);
      headerRows.forEach((tr) => {
        let colCursor = 0;
        const ths = Array.from(tr.children).filter(
          (el): el is HTMLElement =>
            el.tagName === "TH" &&
            (el.classList.contains("pvtColLabel") ||
              el.classList.contains("pvtColTotalLabel")),
        );

        ths.forEach((th) => {
          const colspan = Number.parseInt(th.getAttribute("colspan") || "1", 10);
          const colStart = colCursor;
          const colEnd = colCursor + colspan - 1;
          headerSpanMap.set(th, { type: "col", start: colStart, end: colEnd });

          for (let c = colStart; c <= colEnd; c++) {
            if (!colAncestorsMap.has(c)) {
              colAncestorsMap.set(c, []);
            }
            colAncestorsMap.get(c)!.push(th);
          }
          colCursor += colspan;
        });
      });
    }

    // 2. Indexar cabeceras de filas y celdas de datos en tbody (Niveles K)
    const tBody = htmlTable.tBodies[0];
    if (tBody) {
      const bodyRows = Array.from(tBody.rows);
      const activeRowSpans: { th: HTMLElement; remaining: number }[] = [];

      bodyRows.forEach((tr, rowIndex) => {
        const rowThs = Array.from(tr.children).filter(
          (el): el is HTMLElement =>
            el.tagName === "TH" &&
            (el.classList.contains("pvtRowLabel") ||
              el.classList.contains("pvtRowTotalLabel")),
        );

        let thIndex = 0;
        const currentAncestors: HTMLElement[] = [];

        for (
          let depth = 0;
          thIndex < rowThs.length || depth < activeRowSpans.length;
          depth++
        ) {
          if (activeRowSpans[depth] && activeRowSpans[depth].remaining > 0) {
            currentAncestors.push(activeRowSpans[depth].th);
            activeRowSpans[depth].remaining--;
          } else if (thIndex < rowThs.length) {
            const th = rowThs[thIndex++];
            const rowspan = Number.parseInt(th.getAttribute("rowspan") || "1", 10);
            activeRowSpans[depth] = { th, remaining: rowspan - 1 };
            currentAncestors.push(th);
            headerSpanMap.set(th, {
              type: "row",
              start: rowIndex,
              end: rowIndex + rowspan - 1,
            });
          }
        }

        rowAncestorsMap.set(rowIndex, currentAncestors);

        // Registrar celdas de datos TD de esta fila
        const rowTds = Array.from(tr.children).filter(
          (el): el is HTMLElement => el.tagName === "TD",
        );
        rowDataCellsMap.set(rowIndex, rowTds);

        rowTds.forEach((td, tdIdx) => {
          let colIdx = tdIdx;
          const classAttr = td.getAttribute("class") || "";
          const match = /col(\d+)/.exec(classAttr);
          if (match) {
            colIdx = Number.parseInt(match[1], 10);
          }
          if (!colDataCellsMap.has(colIdx)) {
            colDataCellsMap.set(colIdx, []);
          }
          colDataCellsMap.get(colIdx)!.push(td);
        });
      });
    }

    // 3. Precalculación de subárboles para TH en headerSpanMap
    headerSpanMap.forEach((span, th) => {
      const subtree: HTMLElement[] = [];
      if (span.type === "col") {
        for (let c = span.start; c <= span.end; c++) {
          const colStack = colAncestorsMap.get(c) || [];
          colStack.forEach((stackTh) => {
            if (stackTh !== th && !subtree.includes(stackTh)) {
              subtree.push(stackTh);
            }
          });
          const colTds = colDataCellsMap.get(c) || [];
          colTds.forEach((td) => {
            if (!subtree.includes(td)) {
              subtree.push(td);
            }
          });
        }
      } else if (span.type === "row") {
        for (let r = span.start; r <= span.end; r++) {
          const rowStack = rowAncestorsMap.get(r) || [];
          rowStack.forEach((stackTh) => {
            if (stackTh !== th && !subtree.includes(stackTh)) {
              subtree.push(stackTh);
            }
          });
          const rowTds = rowDataCellsMap.get(r) || [];
          rowTds.forEach((td) => {
            if (!subtree.includes(td)) {
              subtree.push(td);
            }
          });
        }
      }
      headerSubtreeMap.set(th, subtree);
    });

    return {
      colAncestorsMap,
      rowAncestorsMap,
      headerSpanMap,
      colDataCellsMap,
      rowDataCellsMap,
      headerSubtreeMap,
    };
  }

  /**
   * Configura la delegación de eventos `mouseover` y `mouseout` en el contenedor de la tabla
   * para disparar el resaltado optimizado utilizando la matriz `TableGridIndex`.
   * @param element El elemento `HTMLDivElement` que contiene la tabla.
   */
  public setupHeaderHover(element: HTMLDivElement): void {
    const $ = this.jQueryService.$;
    const htmlTable = element.querySelector("table");
    if (!htmlTable) return;

    this.clearGridIndexCache();
    this.getOrBuildGridIndex(htmlTable);

    $(element).off(".tableHover");

    $(element).on("mouseover.tableHover", (e: any) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const th = target.closest("th") as HTMLElement | null;
      const td = target.closest("td") as HTMLElement | null;

      if (!th && !td) return;

      this.clearActiveHover();

      if (
        th &&
        (th.classList.contains("pvtCorner") ||
          th.classList.contains("pvtMetricAxisLabel"))
      ) {
        return;
      }

      const currentGridIndex = this.getOrBuildGridIndex(htmlTable);

      if (th) {
        this.handleThHover(th, currentGridIndex, htmlTable);
      } else if (td) {
        this.handleTdHover(td, currentGridIndex, htmlTable);
      }
    });

    $(element).on("mouseout.tableHover", (e: any) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !element.contains(related)) {
        this.clearActiveHover();
      }
    });
  }


  /**
   * Maneja el resaltado cuando el cursor está sobre una cabecera TH.
   */
  private handleThHover(
    th: HTMLElement,
    gridIndex: TableGridIndex,
    table: HTMLTableElement,
  ): void {
    if (
      th.classList.contains("pvtCorner") ||
      th.classList.contains("pvtMetricAxisLabel")
    ) {
      return;
    }
    this.addHoverClass(th, "header-hovered");

    const span = gridIndex.headerSpanMap.get(th);
    if (span) {
      // Si la cabecera es una hoja o nivel intermedio, resaltar también sus ancestros padres
      const ancestorsMap =
        span.type === "col"
          ? gridIndex.colAncestorsMap.get(span.start)
          : gridIndex.rowAncestorsMap.get(span.start);

      if (ancestorsMap) {
        ancestorsMap.forEach((parentTh) => {
          if (parentTh !== th) {
            this.addHoverClass(parentTh, "header-hovered");
          }
        });
      }

      // Resaltar todo el subárbol descendiente (sub-cabeceras y celdas de datos)
      const subtree = gridIndex.headerSubtreeMap.get(th) || [];
      subtree.forEach((el) => {
        if (el.tagName === "TH") {
          this.addHoverClass(el, "header-hovered");
        } else if (el.tagName === "TD") {
          this.addHoverClass(el, "data-hovered");
        }
      });
    } else if (th.classList.contains("pvtColTotalLabel")) {
      // Manejar totales (ColTotal, RowTotal, GrandTotal)
      const totalTds = table.querySelectorAll<HTMLElement>("td.colTotal");
      totalTds.forEach((td) => this.addHoverClass(td, "data-hovered"));
    } else if (th.classList.contains("pvtRowTotalLabel")) {
      const totalTds = table.querySelectorAll<HTMLElement>("td.rowTotal");
      totalTds.forEach((td) => this.addHoverClass(td, "data-hovered"));
    }
  }

  /**
   * Maneja el resaltado cuando el cursor está sobre una celda TD.
   */
  private handleTdHover(
    td: HTMLElement,
    gridIndex: TableGridIndex,
    table: HTMLTableElement,
  ): void {
    this.addHoverClass(td, "data-hovered");

    const classAttr = td.getAttribute("class") || "";

    // Extraer colIndex y rowIndex
    let colIdx: number | null = null;
    let rowIdx: number | null = null;

    const colMatch = /col(\d+)/.exec(classAttr);
    if (colMatch) {
      colIdx = Number.parseInt(colMatch[1], 10);
    }

    const rowMatch = /row(\d+)/.exec(classAttr);
    if (rowMatch) {
      rowIdx = Number.parseInt(rowMatch[1], 10);
    }

    // Si es celda de datos estándar con índices de fila y columna
    if (colIdx !== null) {
      const colAncestors = gridIndex.colAncestorsMap.get(colIdx) || [];
      colAncestors.forEach((colTh) => this.addHoverClass(colTh, "header-hovered"));
    }

    if (rowIdx !== null) {
      const rowAncestors = gridIndex.rowAncestorsMap.get(rowIdx) || [];
      rowAncestors.forEach((rowTh) => this.addHoverClass(rowTh, "header-hovered"));
    }

    // Si es celda de totales
    if (td.classList.contains("rowTotal")) {
      const rowTotalLabels = table.querySelectorAll<HTMLElement>(".pvtRowTotalLabel");
      rowTotalLabels.forEach((th) => this.addHoverClass(th, "header-hovered"));
    }
    if (td.classList.contains("colTotal")) {
      const colTotalLabels = table.querySelectorAll<HTMLElement>(".pvtColTotalLabel");
      colTotalLabels.forEach((th) => this.addHoverClass(th, "header-hovered"));
    }
    if (td.classList.contains("pvtGrandTotal")) {
      const grandTotalLabels = table.querySelectorAll<HTMLElement>(
        ".pvtRowTotalLabel, .pvtColTotalLabel",
      );
      grandTotalLabels.forEach((th) => this.addHoverClass(th, "header-hovered"));
    }
  }

  /**
   * Limpia las clases de los elementos activos en O(K).
   */
  private clearActiveHover(): void {
    for (let i = 0; i < this.activeHoveredElements.length; i++) {
      const el = this.activeHoveredElements[i];
      el.classList.remove("header-hovered", "data-hovered");
    }
    this.activeHoveredElements = [];
  }

  /**
   * Agrega la clase de resaltado a un elemento y lo registra en el arreglo activo.
   */
  private addHoverClass(
    el: HTMLElement,
    className: "header-hovered" | "data-hovered",
  ): void {
    if (
      el.classList.contains("pvtCorner") ||
      el.classList.contains("pvtMetricAxisLabel")
    ) {
      return;
    }
    el.classList.add(className);
    this.activeHoveredElements.push(el);
  }
}
