import { Dataset } from '../../services/dataset';
import { ChartType } from '../../types/data.types';
import { WizardStep } from '../types/wizard.types';
import { BaseChartTypeRules } from './base-chart-rules.strategy';
import { ControlRuleEvaluator } from './chart-type-rules.interface';

/**
 * Estrategia de reglas para gráficos circulares (Pie).
 */
export class PieChartRules extends BaseChartTypeRules {
  readonly type: ChartType = 'pie';
  readonly label: string = 'Circular';
  override readonly allowDimensionStacking: boolean = false;

  /**
   * Los gráficos circulares están permitidos únicamente si hay exactamente 1 dimensión activa.
   */
  override isSupported(dataset: Dataset): boolean {
    return dataset.getActiveDimensions().length === 1;
  }

  override getDisabledReason(dataset: Dataset): string | null {
    const activeLength = dataset.getActiveDimensions().length;
    if (activeLength !== 1) {
      return `Los gráficos circulares requieren exactamente 1 dimensión activa (actual: ${activeLength})`;
    }
    return null;
  }

  /**
   * Los gráficos circulares tienen únicamente 2 pasos (General y Tooltip).
   */
  override getSteps(): WizardStep[] {
    return [
      { id: 'general', label: 'General' },
      { id: 'tooltip', label: 'Tooltip' }
    ];
  }

  /**
   * Sobrescribe las reglas de control para gráficos circulares.
   */
  override getControlRules(): Record<string, ControlRuleEvaluator> {
    const baseRules = super.getControlRules();

    return {
      ...baseRules,

      // Controles no aplicables en pie deshabilitados con sus motivos
      'xAxis.disableAutoTitle': () => ({
        enabled: false,
        disabledReason: 'El Eje X no aplica para gráficos circulares'
      }),
      'xAxis.firstLevel': () => ({
        enabled: false,
        disabledReason: 'Los gráficos circulares usan la dimensión como categorías'
      }),
      'xAxis.secondLevel': () => ({
        enabled: false,
        valueOnDisable: null,
        disabledReason: 'Los gráficos circulares no admiten segundo nivel'
      }),
      'xAxis.rotateLabels': () => ({
        enabled: false,
        disabledReason: 'La rotación de etiquetas no aplica para gráficos circulares'
      }),
      'navigator.show': () => ({
        enabled: false,
        valueOnDisable: false,
        disabledReason: 'El navegador de rangos no aplica para gráficos circulares'
      }),
      'yAxis.title': () => ({
        enabled: false,
        valueOnDisable: '',
        disabledReason: 'El Eje Y no aplica para gráficos circulares'
      }),
      'yAxis.max': () => ({
        enabled: false,
        valueOnDisable: null,
        disabledReason: 'El Eje Y no aplica para gráficos circulares'
      }),
      'stacked': () => ({
        enabled: false,
        valueOnDisable: null,
        disabledReason: 'El apilado no aplica para gráficos circulares'
      }),

      // Tooltip en gráfico pie
      'tooltip.shared': () => ({
        enabled: true
      }),

      // Mostrar total: Marcar independientemente de si está compartido o no
      'tooltip.showTotal': () => ({
        enabled: true
      }),

      // Mostrar porcentaje: Marcar independientemente de compartido, salvo si el dataset es porcentual
      'tooltip.showPercentage': (ctx) => {
        if (ctx.dataset.isPercent) {
          return {
            enabled: false,
            valueOnDisable: false,
            disabledReason: 'El dataset ya contiene datos porcentuales'
          };
        }
        return {
          enabled: true
        };
      },

      // Sufijo: Habilitado solo si el dataset no es porcentual; si es porcentual, fijar en "%" por defecto
      'tooltip.suffix': (ctx) => {
        if (ctx.dataset.isPercent) {
          return {
            enabled: false,
            valueOnDisable: '%',
            disabledReason: 'El dataset contiene datos porcentuales, el sufijo se fija en "%" por defecto'
          };
        }
        return {
          enabled: true
        };
      }
    };
  }
}
