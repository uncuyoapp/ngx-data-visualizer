import { Dataset } from '../../services/dataset';
import { WizardStep } from '../types/wizard.types';
import {
  TableControlRuleEvaluator,
  TableRules
} from './table-rules.interface';

/**
 * Clase base abstracta para implementar estrategias de reglas de configuración de tablas.
 * Provee evaluadores globales comunes y comportamientos por defecto.
 */
export abstract class BaseTableRules implements TableRules {
  abstract readonly type: string;
  abstract readonly label: string;

  public isSupported(dataset: Dataset): boolean {
    return !!dataset;
  }

  public getDisabledReason(dataset: Dataset): string | null {
    return dataset ? null : 'Dataset no válido';
  }

  public getSteps(): WizardStep[] {
    return [
      { id: 'structure', label: 'Estructura Pivot' },
      { id: 'formatting', label: 'Visualización y Formato' },
      { id: 'totals', label: 'Totales' }
    ];
  }

  /**
   * Devuelve las reglas de control por defecto para tablas.
   */
  public getControlRules(): Record<string, TableControlRuleEvaluator> {
    return {
      digitsAfterDecimal: () => ({ enabled: true }),
      percentDigitsAfterDecimal: (ctx) => {
        if (ctx.dataset?.isPercent) {
          return {
            enabled: false,
            disabledReason: 'El dataset ya contiene datos porcentuales'
          };
        }
        if (ctx.formValue.valueDisplay === 'nominal' && ctx.formValue.disableSetValueDisplay) {
          return {
            enabled: false,
            disabledReason: 'No aplica cuando el modo de visualización es Nominal y el cambio está bloqueado'
          };
        }
        return { enabled: true };
      },
      valueDisplay: (ctx) => {
        if (ctx.dataset?.isPercent) {
          return {
            enabled: false,
            valueOnDisable: 'nominal',
            disabledReason: 'El dataset contiene datos porcentuales, el modo se fija en Nominal por defecto'
          };
        }
        return { enabled: true };
      },
      disableSetValueDisplay: (ctx) => {
        if (ctx.dataset?.isPercent) {
          return {
            enabled: false,
            valueOnDisable: true,
            disabledReason: 'Deshabilitado para datasets porcentuales'
          };
        }
        return { enabled: true };
      },
      percentDisplayMode: (ctx) => {
        if (ctx.dataset?.isPercent) {
          return {
            enabled: false,
            valueOnDisable: 'single',
            disabledReason: 'El modo multi-métrica no está disponible para datasets porcentuales'
          };
        }
        if (ctx.formValue.valueDisplay === 'nominal' && ctx.formValue.disableSetValueDisplay) {
          return {
            enabled: false,
            valueOnDisable: 'single',
            disabledReason: 'Deshabilitado cuando el modo de visualización es Nominal y el cambio está bloqueado'
          };
        }
        return { enabled: true };
      },
      suffix: (ctx) => {
        if (ctx.dataset?.isPercent) {
          return {
            enabled: false,
            valueOnDisable: '%',
            disabledReason: 'El dataset contiene datos porcentuales, el sufijo se fija en "%" por defecto'
          };
        }
        return { enabled: true };
      },
      totalRow: () => ({ enabled: true }),
      totalCol: () => ({ enabled: true })
    };
  }
}
