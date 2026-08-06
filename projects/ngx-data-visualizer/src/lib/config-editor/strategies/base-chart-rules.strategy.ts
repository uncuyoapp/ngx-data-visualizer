import { Dataset } from '../../services/dataset';
import { ChartType } from '../../types/data.types';
import { WizardStep } from '../types/wizard.types';
import {
  ChartTypeRules,
  ControlRuleEvaluator
} from './chart-type-rules.interface';

/**
 * Determina si una dimensión está siendo utilizada en el nivel principal o secundario del Eje X.
 */
export function isDimensionUsedInAxis(
  dimId: string | number | undefined | null,
  firstLevel?: string | number | null,
  secondLevel?: string | number | null
): boolean {
  const isUsedInFirst = firstLevel !== null && firstLevel !== undefined && String(firstLevel) !== '' && String(dimId) === String(firstLevel);
  const isUsedInSecond = secondLevel !== null && secondLevel !== undefined && String(secondLevel) !== '' && String(dimId) === String(secondLevel);
  return isUsedInFirst || isUsedInSecond;
}

/**
 * Clase base abstracta para implementar estrategias de reglas de configuración de gráficos.
 * Provee evaluadores globales comunes y comportamientos por defecto.
 */
export abstract class BaseChartTypeRules implements ChartTypeRules {
  abstract readonly type: ChartType;
  abstract readonly label: string;
  public readonly allowDimensionStacking: boolean = true;

  public isSupported(dataset: Dataset): boolean {
    return dataset.getActiveDimensions().length >= 1;
  }

  public getDisabledReason(dataset: Dataset): string | null {
    if (!this.isSupported(dataset)) {
      return 'El dataset requiere al menos 1 dimensión activa';
    }
    return null;
  }

  public getSteps(): WizardStep[] {
    return [
      { id: 'general', label: 'General' },
      { id: 'xaxis', label: 'Eje X y Navegador' },
      { id: 'yaxis', label: 'Eje Y y Apilado' },
      { id: 'tooltip', label: 'Tooltip' }
    ];
  }

  /**
   * Devuelve las reglas de control por defecto compartidas por la mayoría de los gráficos.
   */
  public getControlRules(): Record<string, ControlRuleEvaluator> {
    return {
      // Eje X y Navegador
      'xAxis.disableAutoTitle': () => ({ enabled: true }),
      'xAxis.firstLevel': () => ({ enabled: true }),
      'xAxis.rotateLabels': () => ({ enabled: true }),
      'navigator.show': () => ({ enabled: true }),

      // Eje Y
      'yAxis.title': () => ({ enabled: true }),
      'yAxis.max': () => ({ enabled: true }),

      // Tooltip
      'tooltip.shared': () => ({ enabled: true }),
      'tooltip.decimals': () => ({ enabled: true }),

      // Regla de sufijo: si el dataset es porcentual, se fija en "%" y se deshabilita
      'tooltip.suffix': (ctx) => {
        if (ctx.dataset.isPercent) {
          return {
            enabled: false,
            valueOnDisable: '%',
            disabledReason: 'El dataset contiene datos porcentuales, el sufijo se fija en "%" por defecto'
          };
        }
        return { enabled: true };
      },

      // Regla de mostrar porcentaje: deshabilitado si el dataset ya es porcentual o si requiere tooltip compartido
      'tooltip.showPercentage': (ctx) => {
        if (ctx.dataset.isPercent) {
          return {
            enabled: false,
            valueOnDisable: false,
            disabledReason: 'El dataset ya contiene datos porcentuales'
          };
        }
        if (!ctx.formValue.tooltip?.shared) {
          return {
            enabled: false,
            valueOnDisable: false,
            disabledReason: 'Requiere activar tooltip compartido'
          };
        }
        return { enabled: true };
      },

      // Regla de mostrar total: deshabilitado si no hay tooltip compartido
      'tooltip.showTotal': (ctx) => {
        if (!ctx.formValue.tooltip?.shared) {
          return {
            enabled: false,
            valueOnDisable: false,
            disabledReason: 'Requiere activar tooltip compartido'
          };
        }
        return { enabled: true };
      },

      // Regla de apilado (stacked): requiere que exista el Nivel Principal y al menos 1 dimensión activa libre no usada en Eje X
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

        // Dimensiones activas que no están siendo utilizadas en ningún nivel del Eje X
        const freeDims = activeDims.filter(dim => !isDimensionUsedInAxis(dim.id, firstLevel, secondLevel));

        if (freeDims.length === 0) {
          return {
            enabled: false,
            valueOnDisable: null,
            disabledReason: 'No hay dimensiones libres disponibles para apilar (todas están en uso en el Eje X)'
          };
        }

        return { enabled: true };
      },

      // Regla de Eje X nivel secundario: requiere al menos 2 dimensiones activas
      'xAxis.secondLevel': (ctx) => {
        const activeDims = ctx.dataset.getActiveDimensions();
        if (activeDims.length < 2) {
          return {
            enabled: false,
            valueOnDisable: null,
            disabledReason: 'Se requieren al menos 2 dimensiones activas para un segundo nivel'
          };
        }
        return { enabled: true };
      }
    };
  }
}
