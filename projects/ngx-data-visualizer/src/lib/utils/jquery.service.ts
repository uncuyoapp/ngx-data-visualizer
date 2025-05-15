import { Injectable } from '@angular/core';
import jQuery from 'jquery';

// Extender la interfaz de jQuery para incluir los métodos de pivottable
declare global {
  interface JQuery {
    pivot(data: any[], options?: any, locale?: string): JQuery;
  }

  interface JQueryStatic {
    pivotUtilities: {
      aggregatorTemplates: {
        sum: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
        count: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
        average: (formatter?: any) => (fields: string[]) => (data: any[], rowKey: string[], colKey: string[]) => any;
      };
      renderers: {
        [key: string]: any;
      };
      derivers: {
        [key: string]: any;
      };
      locales: {
        [key: string]: any;
      };
      naturalSort: (a: any, b: any) => number;
      numberFormat: (opts?: any) => (num: number) => string;
      sortAs: (orderValues: string[]) => (a: string, b: string) => number;
    };
  }
}

// Importar estilos de pivottable
import 'pivottable/dist/pivot.css';

// Importar pivottable y su localización
import 'pivottable/dist/pivot.js';
import 'pivottable/dist/pivot.es.js';

/**
 * Servicio que proporciona acceso a jQuery y pivottable internamente en la biblioteca
 */
@Injectable({
  providedIn: 'root'
})
export class JQueryService {
  /**
   * Instancia de jQuery para uso interno
   */
  readonly jQuery: JQueryStatic = jQuery;

  constructor() {
    // Hacer jQuery disponible globalmente
    (window as any).jQuery = jQuery;
    (window as any).$ = jQuery;
    
    // Verificar que pivottable esté disponible
    if (!jQuery.fn.pivot) {
      console.warn('PivotTable no está disponible. Algunas funcionalidades pueden no funcionar correctamente.');
    }
  }
  
  /**
   * Obtiene la instancia de jQuery
   */
  get $(): JQueryStatic {
    return this.jQuery;
  }
}
