import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppEvent, VisualizerEventType } from '../types/visualizer-event.types';
import { EventBusService } from './event-bus.service';

/**
 * @description
 * Servicio AuditService encargado de auditar y registrar los eventos emitidos por el EventBusService.
 * 
 * Permite filtrar y depurar eventos en tiempo real mediante la consola del navegador basados en:
 *   1. LocalStorage (`ngx-viz-debug`).
 *   2. Parámetros de consulta URL query params (`?ngx-viz-debug=*` o `?ngx-viz-debug=CHART_*`).
 *   3. Patrones de búsqueda estáticos inyectados mediante providers.
 * 
 * Mantiene un historial circular de los últimos eventos (`MAX_HISTORY`) y previene errores
 * de serialización de payloads complejos (referencias circulares o estructuras muy profundas).
 */
@Injectable({
  providedIn: 'root'
})
export class AuditService implements OnDestroy {
  /** Servicio EventBus inyectado para escuchar el flujo de eventos. */
  private readonly eventBus = inject(EventBusService);

  /** Suscripción activa al flujo de eventos del bus. */
  private sub?: Subscription;

  /** Tamaño máximo del historial de auditoría retenido en memoria. */
  private readonly MAX_HISTORY = 200;

  /** Búfer en memoria que almacena los últimos eventos auditados de forma circular. */
  private readonly historyBuffer: AppEvent[] = [];

  /** Conjunto estático de patrones de tipos de eventos habilitados globalmente para auditoría. */
  private static readonly activePatterns = new Set<string>();

  /**
   * Crea una instancia de AuditService e inicia la escucha de eventos.
   */
  constructor() {
    this.startListening();
  }

  /**
   * Habilita un patrón de filtrado de eventos de forma estática.
   * Utilizado comúnmente en la inicialización o configuración de la app.
   * 
   * @param pattern Patrón de tipo de evento (ej. 'CHART_*', '*') a habilitar.
   */
  static enablePattern(pattern: string): void {
    this.activePatterns.add(pattern);
  }

  /**
   * Se suscribe al canal de eventos del EventBusService y procesa aquellos
   * que coincidan con los criterios de depuración activos.
   */
  private startListening(): void {
    this.sub = this.eventBus.events$.subscribe((event) => {
      if (this.isEventEnabled(event.type)) {
        this.processEvent(event);
      }
    });
  }

  /**
   * Determina si un tipo de evento específico tiene la auditoría habilitada.
   * Comprueba de manera secuencial: LocalStorage, URL Query Params y los patrones estáticos.
   * 
   * @param type Tipo del evento a evaluar.
   * @returns `true` si el evento debe ser auditado, de lo contrario `false`.
   */
  private isEventEnabled(type: VisualizerEventType): boolean {
    if (typeof window === 'undefined') return false; // SSR Safe

    // 1. Chequeo por LocalStorage
    try {
      const ls = localStorage.getItem('ngx-viz-debug');
      if (ls) {
        if (ls === '*' || ls === 'true') return true;
        if (ls.split(',').some(p => this.matchPattern(type, p.trim()))) return true;
      }
    } catch { }

    // 2. Chequeo por URL Query Params
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVal = urlParams.get('ngx-viz-debug');
      if (urlVal) {
        if (urlVal === '*' || urlVal === 'true') return true;
        if (urlVal.split(',').some(p => this.matchPattern(type, p.trim()))) return true;
      }
    } catch { }

    // 3. Chequeo por configuración estática de providers (DI)
    return Array.from(AuditService.activePatterns).some(p => this.matchPattern(type, p));
  }

  /**
   * Procesa un evento válido serializando su payload con seguridad,
   * imprimiéndolo en consola y guardándolo en el buffer circular.
   * 
   * @param event Evento capturado del bus.
   */
  private processEvent(event: AppEvent): void {
    const safePayload = this.safeSerialize(event.payload);
    const auditedEvent = { ...event, payload: safePayload };

    this.printToConsole(auditedEvent);

    this.historyBuffer.push(auditedEvent);
    if (this.historyBuffer.length > this.MAX_HISTORY) {
      this.historyBuffer.shift();
    }
  }

  /**
   * Retorna una copia del historial de eventos auditados hasta el momento.
   * 
   * @returns Array de eventos auditados.
   */
  getHistory(): AppEvent[] {
    return [...this.historyBuffer];
  }

  /**
   * Evalúa si un tipo de evento coincide con un patrón wildcard.
   * 
   * @param type Tipo de evento de la aplicación.
   * @param pattern Patrón de búsqueda (ej: 'CHART_*').
   * @returns `true` si coincide con el patrón, de lo contrario `false`.
   */
  private matchPattern(type: string, pattern: string): boolean {
    if (pattern === '*') return true;
    const regexPattern = '^' + pattern
      .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`) // Escapar caracteres especiales de regex excepto '*'
      .replaceAll('*', '.*') + '$'; // Reemplazar '*' por '.*'
    try {
      const regex = new RegExp(regexPattern);
      return regex.test(type);
    } catch {
      return false;
    }
  }

  /**
   * Serializa un objeto de forma segura previniendo desbordamientos por profundidad,
   * truncando arreglos muy largos y detectando referencias circulares.
   * 
   * @param obj Objeto a serializar/sanitizar.
   * @returns Una copia limpia y serializable del objeto.
   */
  private safeSerialize(obj: any): any {
    if (obj === undefined || obj === null) return obj;
    if (typeof obj !== 'object') return obj;

    const seen = new WeakSet();
    const clean = (val: any, depth = 0): any => {
      if (depth > 2) return '[Object (Trunked Depth)]';
      if (val === null || typeof val !== 'object') return val;
      if (seen.has(val)) return '[Circular Reference]';

      seen.add(val);

      if (Array.isArray(val)) {
        if (val.length > 20) {
          return [...val.slice(0, 5).map(i => clean(i, depth + 1)), `... (${val.length - 5} items omitidos)`];
        }
        return val.map(i => clean(i, depth + 1));
      }

      const res: any = {};
      for (const key of Object.keys(val)) {
        res[key] = clean(val[key], depth + 1);
      }
      return res;
    };

    try {
      return clean(obj);
    } catch {
      return '[Serialization Error]';
    }
  }

  /**
   * Imprime el evento con formato estilizado en la consola de depuración.
   * 
   * @param event Evento con payload sanitizado.
   */
  private printToConsole(event: AppEvent): void {
    const color = event.type.startsWith('[Chart]') ? '#007acc' : '#2e7d32';
    const instanceStr = event.instanceId ? ` [${event.instanceId}]` : '';
    console.log(
      `%c[BusEvent]${instanceStr} [${event.type}]`,
      `color: ${color}; font-weight: bold; background: ${color}10; padding: 2px 4px; border-radius: 3px; border: 1px solid ${color}30;`,
      event.payload ?? ''
    );
  }

  /**
   * Limpieza de recursos al destruir el servicio.
   * Desinscribe la suscripción al EventBus para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
