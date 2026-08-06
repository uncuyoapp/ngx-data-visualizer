/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from "../../types/constants";
import { RowData } from "../../types/data.types";
import { TableOptions } from "../types/table-base";
import { JQueryService } from "../utils/jquery.service";
import { createMultiMetricAggregator } from "../utils/multi-metric-renderer";

/**
 * Clase administradora encargada del motor de configuración y renderizado de PivotTable.js.
 * Responsabilidades:
 * - Resuelve el modo multi-métrica y transforma datos.
 * - Configura opciones de agregación, formato y sorters para pivot.js.
 * - Asocia valores raw a las celdas DOM y aplica clases CSS multi-métrica.
 */
export class PivotEngineManager {
  constructor(private readonly jQueryService: JQueryService) { }

  /**
   * Resuelve el modo multi-métrica efectivo y la configuración correspondiente.
   * @param config Configuración de la tabla
   */
  public resolveMultiMetricMode(config: TableOptions): {
    isMultiMetric: boolean;
    splitAxis: "cols" | "rows";
    effectiveConfig: TableOptions;
  } {
    const isMultiMetric =
      config.percentDisplayMode === "multiMetric" &&
      config.valueDisplay !== undefined &&
      config.valueDisplay !== "nominal";
    const splitAxis: "cols" | "rows" =
      config.valueDisplay === "percentOfColumn" ? "rows" : "cols";
    const effectiveConfig: TableOptions = {
      ...config,
      percentDisplayMode: isMultiMetric ? "multiMetric" : "single",
    };
    return { isMultiMetric, splitAxis, effectiveConfig };
  }

  /**
   * Prepara los datos para vista multi-métrica duplicando registros con la dimensión 'Métrica'.
   * @param data Datos originales.
   */
  public prepareMultiMetricData(data: RowData[]): RowData[] {
    const METRIC_DIM = "Métrica";
    const processedData: RowData[] = [];
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      processedData.push(
        { ...record, [METRIC_DIM]: "Nominal" },
        { ...record, [METRIC_DIM]: "Porcentaje" },
      );
    }
    return processedData;
  }

  /**
   * Transforma la configuración de la tabla a un objeto compatible con `pivot.js`.
   * @param config La configuración de la tabla (`TableOptions`).
   * @param hoverCallback Callback opcional para eventos de hover/click en celdas.
   */
  public configurePivot(config: TableOptions, hoverCallback?: (e: any, filter: any) => void): any {
    const $ = this.jQueryService.$;
    const tpl = ($.pivotUtilities as any).aggregatorTemplates;
    const numberFormat = $.pivotUtilities.numberFormat;
    const METRIC_DIM = "Métrica";

    const { isMultiMetric, splitAxis } = this.resolveMultiMetricMode(config);

    const cols = [...(config.cols as string[])];
    const rows = [...(config.rows as string[])];

    if (isMultiMetric) {
      if (splitAxis === "cols") {
        cols.push(METRIC_DIM);
      } else {
        rows.push(METRIC_DIM);
      }
    }

    const sorters = this.configureSorters(config);
    if (isMultiMetric) {
      sorters[METRIC_DIM] = $.pivotUtilities.sortAs(["Nominal", "Porcentaje"]);
    }

    let aggregator;
    if (isMultiMetric) {
      aggregator = createMultiMetricAggregator($, config, splitAxis);
    } else {
      const rawNominalFormat = numberFormat({
        digitsAfterDecimal: config.digitsAfterDecimal ?? Table.PIVOT_CONFIG.digitsAfterDecimal,
        suffix: "",
      });
      const fullNominalFormat = numberFormat({
        digitsAfterDecimal: config.digitsAfterDecimal ?? Table.PIVOT_CONFIG.digitsAfterDecimal,
        suffix: config.suffix || "",
      });
      const pctFormat = numberFormat({
        digitsAfterDecimal: config.percentDigitsAfterDecimal ?? Table.PIVOT_CONFIG.percentDigitsAfterDecimal,
        scaler: 100,
        suffix: "%",
      });

      switch (config.valueDisplay) {
        case "percentOfTotal":
          aggregator = tpl.fractionOf(tpl.sum(rawNominalFormat), "total", pctFormat);
          break;
        case "percentOfRow":
          aggregator = tpl.fractionOf(tpl.sum(rawNominalFormat), "row", pctFormat);
          break;
        case "percentOfColumn":
          aggregator = tpl.fractionOf(tpl.sum(rawNominalFormat), "col", pctFormat);
          break;
        default:
          aggregator = tpl.sum(fullNominalFormat);
          break;
      }
    }

    return {
      showDecimals: config.digitsAfterDecimal > 0,
      aggregator: aggregator(["valor"]),
      cols,
      rows,
      sorters,
      derivedAttributes: config.derivedAttributes,
      rendererOptions: {
        table: {
          rowTotals: config.cols.length > 0 ? config.totalRow : true,
          colTotals: config.rows.length > 0 ? config.totalCol : true,
          clickCallback: (e: any, _value: any, filter: any) => {
            if (hoverCallback) {
              hoverCallback(e, filter);
            }
          },
        },
      },
      renderer: (pivotData: any, opts: any) => {
        const defaultRenderer = $.pivotUtilities.renderers["Table"];
        const table = defaultRenderer(pivotData, opts) as unknown as HTMLElement;
        if (table && typeof table.querySelector === "function") {
          this.attachRawValuesToTable(table, pivotData);
        }
        return table;
      },
    };
  }

  /**
   * Asocia el valor nominal original a cada celda td.pvtVal mediante el atributo DOM data-raw-value.
   */
  public attachRawValuesToTable(table: HTMLElement, pivotData: any): void {
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();

    rowKeys.forEach((rowKey: any[], i: number) => {
      colKeys.forEach((colKey: any[], j: number) => {
        const agg = pivotData.getAggregator(rowKey, colKey);
        const rawVal = agg.inner ? agg.inner.value() : agg.value();
        const formattedRaw =
          agg.inner?.format ? agg.inner.format(rawVal) : rawVal;
        const td = table.querySelector(`td.pvtVal.row${i}.col${j}`);
        if (td && formattedRaw !== null && formattedRaw !== undefined) {
          td.setAttribute("data-raw-value", String(formattedRaw));
        }
      });
    });
  }

  /**
   * Agrega clases CSS específicas a las celdas y cabeceras generadas en vista multi-métrica.
   */
  public applyMultiMetricClasses(
    element: HTMLDivElement,
    splitAxis: "cols" | "rows",
  ): void {
    const $ = this.jQueryService.$;
    const prefix = splitAxis === "cols" ? "col" : "row";
    const indexRegex = new RegExp(prefix + String.raw`(\d+)`);

    $(element).find("td").each(function (this: HTMLElement) {
      const $td = $(this);
      const classAttr = $td.attr("class") || "";
      const match = indexRegex.exec(classAttr);
      if (match) {
        const index = Number.parseInt(match[1], 10);
        $td.addClass(index % 2 === 0 ? "multi-metric-nominal" : "multi-metric-percent");
      }
    });

    $(element).find("th").each(function (this: HTMLElement) {
      const $th = $(this);
      const text = $th.text().trim();
      if (text === "Nominal") {
        $th.addClass("pvtSubMetricLabel multi-metric-nominal");
      } else if (text === "Porcentaje") {
        $th.addClass("pvtSubMetricLabel multi-metric-percent");
      }
    });

    $(element).find("th.pvtAxisLabel").each(function (this: HTMLElement) {
      const $th = $(this);
      if ($th.text().trim() === "Métrica") {
        $th.addClass("pvtMetricAxisLabel");
      }
    });
  }

  /**
   * Configura las funciones de ordenamiento para cada dimensión de la tabla pivotante.
   */
  private configureSorters(config: TableOptions): Record<string, (a: string, b: string) => number> {
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
}
