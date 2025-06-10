import { Injectable } from '@angular/core';
import jQuery from 'jquery';
import {
  PivotAggregator,
  PivotDeriver,
  PivotFormatter,
  PivotLocale,
  PivotOptions,
  PivotRenderer,
} from '../types/table-base';

declare global {
  interface Window {
    jQuery: typeof jQuery;
    $: typeof jQuery;
  }
}

// Extender la interfaz de jQuery para incluir los métodos de pivottable
declare global {
  interface JQuery {
    pivot(
      data: Record<string, unknown>[],
      options?: PivotOptions,
      locale?: string
    ): JQuery;
  }

  interface JQueryStatic {
    pivotUtilities: {
      aggregatorTemplates: {
        sum: (
          formatter?: PivotFormatter
        ) => (fields: string[]) => PivotAggregator;
        count: (
          formatter?: PivotFormatter
        ) => (fields: string[]) => PivotAggregator;
        average: (
          formatter?: PivotFormatter
        ) => (fields: string[]) => PivotAggregator;
      };
      renderers: Record<string, PivotRenderer>;
      derivers: Record<string, PivotDeriver>;
      locales: Record<string, PivotLocale>;
      naturalSort: (a: string | number, b: string | number) => number;
      numberFormat: (opts?: {
        digitsAfterDecimal?: number;
        scaler?: number;
        prefix?: string;
        suffix?: string;
      }) => PivotFormatter;
      sortAs: (orderValues: string[]) => (a: string, b: string) => number;
    };
  }
}

// Importar estilos y scripts de pivottable
import 'pivottable/dist/pivot.min.js';
// import 'pivottable/dist/pivot.min.css';
import 'pivottable/dist/pivot.es.min.js';

/**
 * Servicio que proporciona acceso a jQuery y pivottable internamente en la biblioteca.
 * Este servicio asegura que jQuery esté disponible globalmente y que PivotTable
 * esté correctamente inicializado.
 */
@Injectable({
  providedIn: 'root',
})
export class JQueryService {
  /**
   * Instancia de jQuery para uso interno.
   * Esta instancia está configurada con todas las extensiones necesarias,
   * incluyendo PivotTable.
   */
  readonly jQuery: JQueryStatic = jQuery;

  constructor() {
    this.initializeJQuery();
    this.verifyPivotTable();
    this.configureNumberFormat();
  }

  /**
   * Obtiene la instancia de jQuery.
   * @returns La instancia de jQuery con todas las extensiones configuradas
   */
  get $(): JQueryStatic {
    return this.jQuery;
  }

  /**
   * Inicializa jQuery globalmente y configura las variables globales necesarias.
   * @private
   */
  private initializeJQuery(): void {
    window.jQuery = jQuery;
    window.$ = jQuery;
  }

  /**
   * Verifica que PivotTable esté disponible y configurado correctamente.
   * @private
   */
  private verifyPivotTable(): void {
    if (!jQuery.fn.pivot) {
      console.error(
        'PivotTable no está disponible. La funcionalidad de tablas dinámicas no funcionará correctamente.'
      );
      throw new Error(
        'PivotTable no está disponible. Asegúrese de que el módulo pivottable.ts se haya importado correctamente.'
      );
    }
  }

  /**
   * Configura el formato de números por defecto para PivotTable
   * @private
   */
  private configureNumberFormat(): void {
    jQuery.pivotUtilities.numberFormat = (opts = {}) => {
      const defaults = {
        digitsAfterDecimal: 2,
        scaler: 1,
        prefix: '',
        suffix: '',
        thousandsSep: '.',
        decimalSep: ','
      };
      const options = { ...defaults, ...opts };
      
      return (x: number) => {
        if (isNaN(x) || !isFinite(x)) return '';
        const result = (x * options.scaler).toFixed(options.digitsAfterDecimal);
        const parts = result.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandsSep);
        return options.prefix + parts.join(options.decimalSep) + options.suffix;
      };
    };
  }
}
