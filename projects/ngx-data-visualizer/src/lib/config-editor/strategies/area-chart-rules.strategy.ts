import { ChartType } from '../../types/data.types';
import { BaseChartTypeRules, isDimensionUsedInAxis } from './base-chart-rules.strategy';
import { ControlRuleEvaluator } from './chart-type-rules.interface';

/**
 * Estrategia de reglas para gráficos de tipo Área y Área Curva (Areaspline).
 * Permite únicamente el apilado "Único" ('all') y deshabilita el apilado por dimensiones individuales.
 */
export class AreaChartRules extends BaseChartTypeRules {
  override readonly allowDimensionStacking: boolean = false;

  constructor(
    public readonly type: ChartType = 'area',
    public readonly label: string = 'Área'
  ) {
    super();
  }

  override getControlRules(): Record<string, ControlRuleEvaluator> {
    const baseRules = super.getControlRules();
    return {
      ...baseRules,
      'stacked': (ctx) => {
        const firstLevel = ctx.formValue.xAxis?.firstLevel;
        if (firstLevel === null || firstLevel === undefined || String(firstLevel) === '') {
          return {
            enabled: false,
            valueOnDisable: null,
            disabledReason: 'Seleccione primero el Nivel Principal del Eje X'
          };
        }

        const secondLevel = ctx.formValue.xAxis?.secondLevel;
        const activeDims = ctx.dataset.getActiveDimensions();
        const freeDims = activeDims.filter(dim => !isDimensionUsedInAxis(dim.id, firstLevel, secondLevel));

        if (freeDims.length === 0) {
          return {
            enabled: false,
            valueOnDisable: null,
            disabledReason: 'No hay dimensiones libres disponibles para apilar (todas están en uso en el Eje X)'
          };
        }

        return { enabled: true };
      }
    };
  }
}
