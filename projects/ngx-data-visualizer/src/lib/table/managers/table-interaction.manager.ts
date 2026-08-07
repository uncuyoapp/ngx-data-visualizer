/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableOptions } from "../types/table-base";
import { JQueryService } from "../utils/jquery.service";

/**
 * Clase administradora de interacciones de usuario adicionales en la tabla pivot:
 * - Auto-scroll horizontal al acercarse a los bordes del contenedor.
 * - Tooltip flotante en celdas para vistas porcentuales.
 */
export class TableInteractionManager {
  constructor(private readonly jQueryService: JQueryService) { }

  /**
   * Configura el comportamiento de auto-scroll horizontal cuando el cursor del mouse
   * se acerca a los bordes izquierdo o derecho del contenedor de la tabla.
   * @param element El elemento `HTMLDivElement` que contiene la tabla.
   */
  public setupAutoScroll(element: HTMLDivElement): void {
    const $ = this.jQueryService.$;
    const scrollThreshold = 50;
    const scrollSpeed = 10;
    let scrollInterval: number | null = null;

    $(element).off(".autoScroll");

    $(element).on("mousemove.autoScroll", (e: any) => {
      const rect = element.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const maxX = rect.width;

      if (scrollInterval) {
        window.clearInterval(scrollInterval);
        scrollInterval = null;
      }

      let scrollX = 0;
      const target = e.target as HTMLElement;

      if (mouseX > maxX - scrollThreshold) {
        scrollX = scrollSpeed;
      } else {
        const thElement = target.closest("th.pvtRowLabel");
        if (thElement?.getAttribute("rowspan") === "1") {
          const thRect = thElement.getBoundingClientRect();
          const tableRect = element.getBoundingClientRect();
          const thRightEdge = thRect.right - tableRect.left;
          const halfThreshold = scrollThreshold / 2;

          if (
            mouseX >= thRightEdge - halfThreshold &&
            mouseX <= thRightEdge + halfThreshold
          ) {
            scrollX = -scrollSpeed;
          }
        }
      }

      if (scrollX !== 0) {
        scrollInterval = window.setInterval(() => {
          element.scrollLeft += scrollX;
        }, 16);
      }
    });

    $(element).on("mouseleave.autoScroll", () => {
      if (scrollInterval) {
        window.clearInterval(scrollInterval);
        scrollInterval = null;
      }
    });
  }

  /**
   * Configura los tooltips flotantes en celdas para vistas porcentuales simples utilizando delegación de eventos.
   * @param element Elemento HTML que contiene la tabla.
   * @param config Opciones de la tabla.
   */
  public setupCellTooltips(
    element: HTMLDivElement,
    config: TableOptions,
  ): void {
    const $ = this.jQueryService.$;
    let suffix = "";
    if (config.suffix) {
      suffix = config.suffix.startsWith(" ") ? config.suffix : ` ${config.suffix}`;
    }

    $(element).find(".pvt-cell-tooltip").remove();
    $(element).off(".cellTooltip");

    // Crear un único elemento tooltip reutilizable en el contenedor
    let tooltip = element.querySelector<HTMLElement>(".pvt-cell-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "pvt-cell-tooltip";
      tooltip.style.display = "none";
      element.appendChild(tooltip);
    }

    $(element).on("mouseover.cellTooltip", (e: any) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const td = target.closest("td.pvtVal") as HTMLElement | null;
      if (!td) {
        if (tooltip) tooltip.style.display = "none";
        return;
      }

      const rawValue = td.getAttribute("data-raw-value");
      if (!rawValue) {
        if (tooltip) tooltip.style.display = "none";
        return;
      }

      if (tooltip) {
        tooltip.textContent = `Nominal: ${rawValue}${suffix}`;
        tooltip.style.display = "block";

        const tdRect = td.getBoundingClientRect();
        const containerRect = element.getBoundingClientRect();

        let top =
          tdRect.top -
          containerRect.top +
          element.scrollTop -
          tooltip.offsetHeight -
          6;

        if (top < element.scrollTop) {
          top =
            tdRect.bottom -
            containerRect.top +
            element.scrollTop +
            6;
        }

        const left =
          tdRect.left -
          containerRect.left +
          element.scrollLeft +
          tdRect.width / 2 -
          tooltip.offsetWidth / 2;

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }
    });

    $(element).on("mouseout.cellTooltip", (e: any) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !element.contains(related)) {
        if (tooltip) tooltip.style.display = "none";
      }
    });

    $(element).on("scroll.cellTooltip", () => {
      if (tooltip) tooltip.style.display = "none";
    });
  }
}
