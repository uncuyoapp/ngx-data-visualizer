import { ChartType } from '../../types/data.types';
import { BaseChartTypeRules } from './base-chart-rules.strategy';
import { ControlRuleEvaluator } from './chart-type-rules.interface';

/**
 * Estrategia de reglas para gráficos de tipo Líneas y Líneas Curvas (Spline).
 * Deshabilita el apilado independientemente de las dimensiones disponibles.
 */
export class LineChartRules extends BaseChartTypeRules {
  constructor(
    public readonly type: ChartType = 'line',
    public readonly label: string = 'Líneas'
  ) {
    super();
  }

  override getControlRules(): Record<string, ControlRuleEvaluator> {
    const baseRules = super.getControlRules();
    return {
      ...baseRules,
      'stacked': () => ({
        enabled: false,
        valueOnDisable: null,
        disabledReason: 'El apilado no está disponible para gráficos de líneas'
      })
    };
  }
}
