/**
 * Utilidades para trabajar con pivottable
 * Este archivo proporciona las funcionalidades básicas de pivottable que necesitamos
 * sin depender de la carga dinámica de scripts.
 */
import jQuery from 'jquery';

// Asegurarse de que jQuery esté disponible globalmente
(window as any).jQuery = jQuery;
(window as any).$ = jQuery;

/**
 * Clase que proporciona las funcionalidades básicas de pivottable
 */
export class PivotUtilities {
  /**
   * Inicializa las funcionalidades de pivottable
   */
  static initialize(): void {
    const $ = jQuery;
    
    // Agregar la funcionalidad de pivot a jQuery si no existe
    if (!$.fn.pivot) {
      // Definir las utilidades básicas de pivottable
      $.pivotUtilities = {
        // Plantillas de agregadores
        aggregatorTemplates: {
          sum: function(formatter = $.pivotUtilities.numberFormat()) {
            return function(fields: string[]) {
              return function(data: any[], rowKey: string[], colKey: string[]) {
                let sum = 0;
                data.forEach(item => {
                  fields.forEach(field => {
                    if (item[field] !== null && item[field] !== undefined) {
                      sum += parseFloat(item[field]);
                    }
                  });
                });
                return {
                  sum: sum,
                  push: function() {},
                  value: function() { return formatter(sum); },
                  format: formatter
                };
              };
            };
          }
        },
        
        // Formato de números
        numberFormat: function(opts: any = {}) {
          const defaults = {
            digitsAfterDecimal: 2,
            scaler: 1,
            thousandsSep: ",",
            decimalSep: ".",
            prefix: "",
            suffix: ""
          };
          
          const options = { ...defaults, ...opts };
          
          return function(x: number) {
            if (isNaN(x) || !isFinite(x)) {
              return "";
            }
            
            const result = options.prefix + 
              x.toFixed(options.digitsAfterDecimal)
                .replace(".", options.decimalSep)
                .replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandsSep) + 
              options.suffix;
            
            return result;
          };
        },
        
        // Ordenar como
        sortAs: function(orderValues: string[]) {
          return function(a: string, b: string) {
            const aIndex = orderValues.indexOf(a);
            const bIndex = orderValues.indexOf(b);
            
            if (aIndex === -1 && bIndex === -1) {
              return a.localeCompare(b);
            } else if (aIndex === -1) {
              return 1;
            } else if (bIndex === -1) {
              return -1;
            } else {
              return aIndex - bIndex;
            }
          };
        }
      };
      
      // Implementar la función pivot básica
      $.fn.pivot = function(input: any[], opts: any, locale: string = 'en') {
        const table = this;
        
        // Limpiar la tabla
        table.empty();
        
        // Crear la tabla
        const tableElement = $('<table class="pvtTable"></table>');
        
        // Crear el encabezado
        const thead = $('<thead></thead>');
        const headerRow = $('<tr></tr>');
        
        // Añadir columnas
        if (opts.cols && opts.cols.length > 0) {
          opts.cols.forEach((col: string) => {
            headerRow.append($('<th class="pvtColLabel"></th>').text(col));
          });
        }
        
        // Añadir filas
        if (opts.rows && opts.rows.length > 0) {
          opts.rows.forEach((row: string) => {
            const rowElement = $('<tr></tr>');
            rowElement.append($('<th class="pvtRowLabel"></th>').text(row));
            
            // Añadir celdas para cada columna
            if (opts.cols && opts.cols.length > 0) {
              opts.cols.forEach(() => {
                rowElement.append($('<td class="pvtVal"></td>').text('0'));
              });
            } else {
              rowElement.append($('<td class="pvtVal"></td>').text('0'));
            }
            
            tableElement.append(rowElement);
          });
        }
        
        thead.append(headerRow);
        tableElement.append(thead);
        
        // Añadir la tabla al contenedor
        table.append(tableElement);
        
        // Configurar eventos de clic
        if (opts.rendererOptions && opts.rendererOptions.table && opts.rendererOptions.table.clickCallback) {
          table.find('td').on('click', function(e) {
            opts.rendererOptions.table.clickCallback(e, null, {});
          });
        }
        
        return this;
      };
    }
  }
}
