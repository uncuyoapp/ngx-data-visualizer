import { Injectable } from '@angular/core';
import { ChartType } from '../../types/data.types';
import { AreaChartRules } from '../strategies/area-chart-rules.strategy';
import { ChartTypeRules } from '../strategies/chart-type-rules.interface';
import { ColumnChartRules } from '../strategies/column-chart-rules.strategy';
import { LineChartRules } from '../strategies/line-chart-rules.strategy';
import { PieChartRules } from '../strategies/pie-chart-rules.strategy';

/**
 * Servicio de registro centralizado para las estrategias de reglas por tipo de gráfico.
 * Permite resolver estrategias y registrar nuevos tipos de gráfico de forma extensible.
 */
@Injectable({
  providedIn: 'root'
})
export class ChartRulesRegistryService {
  private readonly strategies = new Map<ChartType, ChartTypeRules>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registra las estrategias por defecto incluidas en la librería.
   * @private
   */
  private registerDefaults(): void {
    this.registerStrategy(new ColumnChartRules('column', 'Columnas'));
    this.registerStrategy(new LineChartRules('line', 'Líneas'));
    this.registerStrategy(new LineChartRules('spline', 'Líneas Curvas (Spline)'));
    this.registerStrategy(new ColumnChartRules('bar', 'Barras'));
    this.registerStrategy(new AreaChartRules('area', 'Área'));
    this.registerStrategy(new AreaChartRules('areaspline', 'Área Curva (Spline)'));
    this.registerStrategy(new PieChartRules());
  }

  /**
   * Registra o reemplaza la estrategia asociada a un tipo de gráfico.
   */
  public registerStrategy(strategy: ChartTypeRules): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Obtiene la estrategia correspondiente a un tipo de gráfico.
   * Si no se encuentra, retorna una estrategia por defecto (ColumnChartRules).
   */
  public getStrategy(type: ChartType): ChartTypeRules {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      return new ColumnChartRules(type, type);
    }
    return strategy;
  }

  /**
   * Devuelve todas las estrategias registradas en el orden de definición.
   */
  public getAllStrategies(): ChartTypeRules[] {
    return Array.from(this.strategies.values());
  }
}
