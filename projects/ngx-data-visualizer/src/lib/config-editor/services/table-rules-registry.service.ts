import { Injectable } from '@angular/core';
import { GeneralTableRules } from '../strategies/general-table-rules.strategy';
import { TableRules } from '../strategies/table-rules.interface';

/**
 * Servicio de registro centralizado para las estrategias de reglas por tipo de tabla.
 * Permite resolver estrategias y registrar nuevas estrategias de tabla de forma extensible.
 */
@Injectable({
  providedIn: 'root'
})
export class TableRulesRegistryService {
  private readonly strategies = new Map<string, TableRules>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registra las estrategias por defecto incluidas en la librería.
   * @private
   */
  private registerDefaults(): void {
    this.registerStrategy(new GeneralTableRules());
  }

  /**
   * Registra o reemplaza la estrategia asociada a un tipo de tabla.
   */
  public registerStrategy(strategy: TableRules): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Obtiene la estrategia correspondiente a un tipo de tabla.
   * Si no se encuentra, retorna la estrategia general por defecto (`GeneralTableRules`).
   */
  public getStrategy(type: string = 'general'): TableRules {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      return new GeneralTableRules();
    }
    return strategy;
  }

  /**
   * Devuelve todas las estrategias de tabla registradas.
   */
  public getAllStrategies(): TableRules[] {
    return Array.from(this.strategies.values());
  }
}
