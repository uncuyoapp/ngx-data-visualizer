import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppEvent, VisualizerEvent, VisualizerEventType } from '../types/visualizer-event.types';

/**
 * @description
 * Servicio EventBusService encargado de centralizar y propagar eventos del ciclo de vida,
 * configuración, renderizado e interacción de los componentes de visualización de datos.
 * 
 * Funciona como un bus de eventos reactivo basado en RxJS que permite desacoplar los componentes
 * visuales de Angular de los servicios de infraestructura y analítica.
 * 
 * Provee tipado estricto para las emisiones y filtrado automático para los suscriptores.
 */
@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private readonly eventSubject = new Subject<AppEvent>();
  private globalCounter = 1;

  /** Stream público de todos los eventos del sistema */
  get events$(): Observable<AppEvent> {
    return this.eventSubject.asObservable();
  }

  /** Publica un evento en el bus con validación de tipos estricta */
  emit(event: VisualizerEvent): void {
    this.eventSubject.next({
      ...event,
      id: this.globalCounter++,
      timestamp: new Date()
    });
  }

  /**
   * Obtiene un Observable filtrado y tipado estrictamente según el tipo de evento.
   * Utiliza el tipo utilitario 'Extract' para evitar casteos manuales en los suscriptores.
   */
  on<T extends VisualizerEventType>(type: T): Observable<Extract<VisualizerEvent, { type: T }> & { timestamp: Date; id: number }> {
    return this.eventSubject.asObservable().pipe(
      filter((event): event is Extract<VisualizerEvent, { type: T }> & { timestamp: Date; id: number } => event.type === type)
    );
  }
}
