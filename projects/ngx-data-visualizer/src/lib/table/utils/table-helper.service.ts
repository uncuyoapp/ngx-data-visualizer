/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from "@angular/core";
import { RowData } from "../../types/data.types";
import { PivotEngineManager } from "../managers/pivot-engine.manager";
import { TableHeaderHoverManager } from "../managers/table-header-hover.manager";
import { TableInteractionManager } from "../managers/table-interaction.manager";
import { TableStickyManager } from "../managers/table-sticky.manager";
import { TableOptions } from "../types/table-base";
import { JQueryService } from "./jquery.service";

/**
 * Servicio Fachada (Facade) para la manipulación y renderizado de tablas pivot.
 * Integra y coordina los administradores especializados:
 * - PivotEngineManager: Configuración y renderizado de Pivot.js
 * - TableStickyManager: Efectos sticky para navegación en tablas grandes
 * - TableInteractionManager: Auto-scroll y tooltips flotantes en celdas
 * - TableHeaderHoverManager: Sistema de resaltado hover en cabeceras
 */
@Injectable()
export class TableHelperService {
  private readonly pivotEngine: PivotEngineManager;
  private readonly stickyManager: TableStickyManager;
  private readonly interactionManager: TableInteractionManager;
  private readonly hoverManager: TableHeaderHoverManager;

  constructor(private readonly jQueryService: JQueryService) {
    this.pivotEngine = new PivotEngineManager(jQueryService);
    this.stickyManager = new TableStickyManager();
    this.interactionManager = new TableInteractionManager(jQueryService);
    this.hoverManager = new TableHeaderHoverManager(jQueryService);
  }

  /**
   * Renderiza una tabla HTML en un elemento HTMLElement usando pivotJS y configura sus interacciones.
   *
   * @param element HTMLElement donde se vinculará la tabla pivot.
   * @param data RowData[] datos para la tabla pivot.
   * @param config TableOptions configuración de la tabla.
   */
  public renderPivot(
    element: HTMLDivElement,
    data: RowData[],
    config: TableOptions,
  ): void {
    const $ = this.jQueryService.$;

    const { isMultiMetric, splitAxis, effectiveConfig } =
      this.pivotEngine.resolveMultiMetricMode(config);

    const processedData =
      effectiveConfig.percentDisplayMode === "multiMetric"
        ? this.pivotEngine.prepareMultiMetricData(data)
        : data;

    const pivotConfiguration = this.configurePivot(effectiveConfig);
    $(element).pivot(processedData, pivotConfiguration, "es");

    if (isMultiMetric) {
      this.pivotEngine.applyMultiMetricClasses(element, splitAxis);
    }

    this.interactionManager.setupAutoScroll(element);
    this.hoverManager.setupHeaderHover(element);

    const isPercentView =
      effectiveConfig.valueDisplay && effectiveConfig.valueDisplay !== "nominal";
    const isSingleMode = (effectiveConfig.percentDisplayMode ?? "single") === "single";
    const isTooltipEnabled = effectiveConfig.showCellTooltip !== false;

    if (isPercentView && isSingleMode && isTooltipEnabled) {
      this.interactionManager.setupCellTooltips(element, effectiveConfig);
    }
  }

  /**
   * Genera el objeto de configuración compatible con pivotJS.
   * @param config Opciones de la tabla (`TableOptions`).
   */
  public configurePivot(config: TableOptions): any {
    return this.pivotEngine.configurePivot(config, (e, filter) =>
      this.hoverManager.hoverFunction(e, filter),
    );
  }

  /**
   * Hace que la tabla sea "sticky" (fija) para mejorar la navegación.
   * @param div Contenedor HTML de la tabla.
   */
  public stickyTable(div: HTMLDivElement): void {
    this.stickyManager.stickyTable(div);
  }
}
