/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from "../../types/constants";
import { TableOptions } from "../types/table-base";

/**
 * Verifica si una celda corresponde a la dimensión 'Porcentaje'
 */
function checkIsPercentCell(
  splitAxis: "cols" | "rows",
  rowKey?: any[],
  colKey?: any[]
): boolean {
  const key = splitAxis === "cols" ? colKey : rowKey;
  return key?.at(-1) === "Porcentaje";
}

/**
 * Verifica si la celda es de Totales (donde entraron tanto registros Nominales como Porcentuales)
 */
function checkIsTotalCell(
  splitAxis: "cols" | "rows",
  rowKey: any[],
  colKey: any[],
  data: any
): boolean {
  if (splitAxis === "cols") {
    return colKey.length < (data.colAttrs?.length || 0);
  }
  return rowKey.length < (data.rowAttrs?.length || 0);
}

/**
 * Suma los valores nominales de todas las columnas 'Nominal' en una fila dada
 */
function sumRowNominals(
  data: any,
  rowKey: any[],
  splitAxis: "cols" | "rows"
): number {
  let sum = 0;
  if (splitAxis === "cols") {
    const allCols = data.getColKeys();
    for (let i = 0; i < allCols.length; i++) {
      const cKey = allCols[i];
      if (cKey?.at(-1) === "Nominal") {
        const agg = data.getAggregator(rowKey, cKey);
        sum += agg.sum;
      }
    }
  } else {
    const nominalRowKey = [...rowKey.slice(0, -1), "Nominal"];
    const allCols = data.getColKeys();
    for (let i = 0; i < allCols.length; i++) {
      const agg = data.getAggregator(nominalRowKey, allCols[i]);
      sum += agg.sum;
    }
  }
  return sum;
}

/**
 * Suma los valores nominales de todas las filas 'Nominal' en una columna dada
 */
function sumColNominals(
  data: any,
  colKey: any[],
  splitAxis: "cols" | "rows"
): number {
  let sum = 0;
  if (splitAxis === "rows") {
    const allRows = data.getRowKeys();
    for (let i = 0; i < allRows.length; i++) {
      const rKey = allRows[i];
      if (rKey?.at(-1) === "Nominal") {
        const agg = data.getAggregator(rKey, colKey);
        sum += agg.sum;
      }
    }
  } else {
    const nominalColKey = [...colKey.slice(0, -1), "Nominal"];
    const allRows = data.getRowKeys();
    for (let i = 0; i < allRows.length; i++) {
      const agg = data.getAggregator(allRows[i], nominalColKey);
      sum += agg.sum;
    }
  }
  return sum;
}

/**
 * Suma los valores nominales de todas las celdas 'Nominal' de la tabla entera
 */
function sumTotalNominals(data: any, splitAxis: "cols" | "rows"): number {
  let sum = 0;
  const allRows = data.getRowKeys();
  const allCols = data.getColKeys();
  for (let i = 0; i < allRows.length; i++) {
    for (let j = 0; j < allCols.length; j++) {
      if (splitAxis === "cols") {
        if (allCols[j]?.at(-1) === "Nominal") {
          const agg = data.getAggregator(allRows[i], allCols[j]);
          sum += agg.sum;
        }
      } else {
        if (allRows[i]?.at(-1) === "Nominal") {
          const agg = data.getAggregator(allRows[i], allCols[j]);
          sum += agg.sum;
        }
      }
    }
  }
  return sum;
}

/**
 * Calcula el denominador acumulando valores nominales según la modalidad de visualización seleccionada
 */
function calculateDenominator(
  valueDisplay: string,
  data: any,
  rowKey: any[],
  colKey: any[],
  splitAxis: "cols" | "rows"
): number {
  switch (valueDisplay) {
    case "percentOfRow":
      return sumRowNominals(data, rowKey, splitAxis);
    case "percentOfColumn":
      return sumColNominals(data, colKey, splitAxis);
    case "percentOfTotal":
      return sumTotalNominals(data, splitAxis);
    default:
      return 0;
  }
}

/**
 * Crea una plantilla de agregador personalizada para PivotTable.js que calcula
 * el valor nominal o porcentual dinámicamente según la posición de la celda (rowKey/colKey).
 *
 * @param $ Instancia de jQuery con $.pivotUtilities
 * @param config Opciones de configuración de la tabla
 * @param splitAxis Dirección de subdivisión ('cols' | 'rows')
 */
export function createMultiMetricAggregator(
  $: any,
  config: TableOptions,
  splitAxis: "cols" | "rows"
) {
  const digitsAfterDecimal = config.digitsAfterDecimal ?? Table.PIVOT_CONFIG.digitsAfterDecimal;
  const percentDigitsAfterDecimal = config.percentDigitsAfterDecimal ?? Table.PIVOT_CONFIG.percentDigitsAfterDecimal;
  let suffix = "";
  if (config.suffix) {
    suffix = config.suffix.startsWith(" ") ? config.suffix : ` ${config.suffix}`;
  }

  const formatNominal = (val: any): string => {
    if (val === null || val === undefined || Number.isNaN(val)) return "";
    if ($.pivotUtilities?.numberFormat) {
      return $.pivotUtilities.numberFormat({
        digitsAfterDecimal,
        suffix,
      })(val);
    }
    return Number(val).toFixed(digitsAfterDecimal) + suffix;
  };

  const formatPercent = (val: any): string => {
    if (val === null || val === undefined || Number.isNaN(val)) return "";
    if ($.pivotUtilities?.numberFormat) {
      return $.pivotUtilities.numberFormat({
        digitsAfterDecimal: percentDigitsAfterDecimal,
        scaler: 100,
        suffix: "%",
      })(val);
    }
    return (Number(val) * 100).toFixed(percentDigitsAfterDecimal) + "%";
  };

  const valueDisplay = config.valueDisplay || "percentOfRow";

  return (valAttrs: string[]) => {
    const valKey = valAttrs && valAttrs.length > 0 ? valAttrs[0] : "valor";

    return (data: any, rowKey: any[], colKey: any[]) => {
      return {
        sum: 0,
        push(record: any) {
          const val = Number.parseFloat(record[valKey]);
          if (!Number.isNaN(val)) {
            this.sum += val;
          }
        },
        value() {
          const isPercentCell = checkIsPercentCell(splitAxis, rowKey, colKey);

          if (!isPercentCell) {
            const isTotalCell = checkIsTotalCell(splitAxis, rowKey, colKey, data);
            return isTotalCell ? this.sum / 2 : this.sum;
          }

          const denominator = calculateDenominator(valueDisplay, data, rowKey, colKey, splitAxis);
          return denominator > 0 ? this.sum / denominator : 0;
        },
        format(val: any) {
          const isPercentCell = checkIsPercentCell(splitAxis, rowKey, colKey);
          return isPercentCell ? formatPercent(val) : formatNominal(val);
        },
      };
    };
  };
}

