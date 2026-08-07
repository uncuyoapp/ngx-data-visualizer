import { Injectable } from '@angular/core';
import { DEFAULT_OPTIONS, Table } from '../../types/constants';
import { ChartOptions, TableOptions } from '../../types/data.types';

@Injectable({
    providedIn: 'root'
})
export class ConfigFactory {
    /**
     * Returns a copy of the default chart options.
     */
    getDefaultChartOptions(): ChartOptions {
        return structuredClone(DEFAULT_OPTIONS);
    }

    /**
     * Returns a default table configuration.
     */
    getDefaultTableOptions(): TableOptions {
        return {
            digitsAfterDecimal: Table.PIVOT_CONFIG.digitsAfterDecimal,
            totalRow: Table.PIVOT_CONFIG.totalRow,
            totalCol: Table.PIVOT_CONFIG.totalCol,
            sorters: [],
            cols: [],
            rows: [],
            suffix: Table.PIVOT_CONFIG.suffix,
            valueDisplay: Table.PIVOT_CONFIG.valueDisplay,
            percentDigitsAfterDecimal: Table.PIVOT_CONFIG.percentDigitsAfterDecimal,
            disableSetValueDisplay: Table.PIVOT_CONFIG.disableSetValueDisplay,
            percentDisplayMode: Table.PIVOT_CONFIG.percentDisplayMode
        };
    }

    /**
     * Returns a default configuration based on the type.
     */
    getDefaultOptions(type: 'chart' | 'table'): ChartOptions | TableOptions {
        return type === 'chart'
            ? this.getDefaultChartOptions()
            : this.getDefaultTableOptions();
    }
}
