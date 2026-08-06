/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Clase administradora encargada del posicionamiento `sticky` en tablas pivot.
 * Permite mantener visibles las cabeceras de columna y fila durante la navegación por scroll.
 */
export class TableStickyManager {

  /**
   * Hace que la tabla sea "sticky" (fija) para mejorar la navegación en tablas grandes.
   * @param div Elemento HTML que contiene la tabla
   */
  public stickyTable(div: HTMLDivElement): void {
    if (div.hasChildNodes()) {
      const table = div.childNodes[0] as HTMLTableElement;

      if (table.offsetHeight === 0) {
        requestAnimationFrame(() => this.stickyTable(div));
        return;
      } else if (table.tHead) {
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
   * Limpia los estilos sticky aplicados previamente a las cabeceras y celdas de la tabla.
   * @param table Tabla HTML a limpiar.
   */
  public clearStickyStyles(table: HTMLTableElement): void {
    const allThs = table.querySelectorAll("th");
    allThs.forEach((th) => {
      (th as HTMLElement).style.position = "";
      (th as HTMLElement).style.top = "";
      (th as HTMLElement).style.left = "";
      (th as HTMLElement).style.zIndex = "";
    });

    const stickyTds = table.querySelectorAll(".pvtRowLabel, .pvtTotalLabel");
    stickyTds.forEach((td) => {
      (td as HTMLElement).style.position = "";
      (td as HTMLElement).style.left = "";
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
   * Aplica posicionamiento `sticky` a la cabecera superior de la tabla (`thead`).
   */
  private stickyHeader(
    div: HTMLDivElement,
    offsetTop: number,
    _offsetLeft: number,
    tHead: HTMLElement,
  ): void {
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
        };

        if (!css) {
          this.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
          });
          th.setAttribute("class", "pvtCorner");
        } else if (
          css === "pvtAxisLabel" ||
          css === "pvtAxisLabel pvtMetricAxisLabel" ||
          css === "pvtCorner"
        ) {
          this.applyStyles(th, {
            ...baseStyles,
            left: `${left}px`,
          });
        } else {
          this.applyStyles(th, baseStyles);
        }
      });
    });
  }

  /**
   * Aplica posicionamiento `sticky` a las celdas de cabecera de fila (`th.pvtRowLabel`).
   */
  private stickyBody(
    offsetTop: number,
    offsetLeft: number,
    tBody: HTMLElement,
    className: string,
  ): void {
    const trs = tBody.getElementsByClassName(className);
    Array.from(trs).forEach((element) => {
      const left = element.getBoundingClientRect().left - offsetLeft;
      if (element.getBoundingClientRect().height > 100) {
        if (!element.querySelector("span.pvt-sticky-span")) {
          const span = document.createElement("span");
          span.className = "pvt-sticky-span";
          span.style.position = "sticky";
          span.style.top = `${offsetTop}px`;
          while (element.firstChild) {
            span.appendChild(element.firstChild);
          }
          element.appendChild(span);
        }
      }
      element.setAttribute("style", "position: sticky; left: " + left + "px;");
    });
  }

  /**
   * Aplica dinámicamente un mapa de estilos CSS en línea a un elemento HTMLElement.
   */
  private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.assign(element.style, styles);
  }

  /**
   * Calcula el `offsetLeft` real de la tabla, considerando padding y márgenes.
   */
  private getOffsetLeft(table: HTMLElement): number {
    const offsetLeft = table.getBoundingClientRect().left;
    const style = window.getComputedStyle(table);
    const paddingLeft = Number.parseFloat(style.paddingLeft);
    const marginLeft = Number.parseFloat(style.marginLeft);
    return offsetLeft + paddingLeft + marginLeft;
  }
}
