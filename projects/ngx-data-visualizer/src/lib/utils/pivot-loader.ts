/**
 * Módulo para cargar pivottable y sus dependencias
 */
import * as jQuery from 'jquery';

// Asegurarse de que jQuery esté disponible globalmente
(window as any).jQuery = jQuery;
(window as any).$ = jQuery;

// Importar los estilos de pivottable
import 'pivottable/dist/pivot.css';

// Importar pivottable (debe hacerse después de que jQuery esté disponible globalmente)
import 'pivottable/dist/pivot.js';

// Importar la localización en español
import 'pivottable/dist/pivot.es.js';

/**
 * Clase que proporciona funcionalidad para trabajar con pivottable
 */
export class PivotLoader {
  /**
   * Verifica si pivottable está cargado correctamente
   * @returns true si pivottable está cargado, false en caso contrario
   */
  static isPivotLoaded(): boolean {
    return typeof (window as any).$.fn.pivot === 'function';
  }

  /**
   * Inicializa pivottable si aún no está cargado
   */
  static initialize(): void {
    if (!this.isPivotLoaded()) {
      console.warn('PivotTable no está cargado correctamente. Intentando cargar manualmente...');
      
      // Intentar cargar manualmente si es necesario
      try {
        // Asegurarse de que jQuery esté disponible globalmente
        (window as any).jQuery = jQuery;
        (window as any).$ = jQuery;
        
        // Cargar los scripts de pivottable manualmente
        const pivotScript = document.createElement('script');
        pivotScript.src = 'node_modules/pivottable/dist/pivot.min.js';
        document.head.appendChild(pivotScript);
        
        const pivotEsScript = document.createElement('script');
        pivotEsScript.src = 'node_modules/pivottable/dist/pivot.es.min.js';
        document.head.appendChild(pivotEsScript);
        
        console.log('PivotTable cargado manualmente con éxito.');
      } catch (error) {
        console.error('Error al cargar PivotTable manualmente:', error);
      }
    }
  }
}
