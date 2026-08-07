import { Dataset } from '../../services/dataset';
import { TableOptions } from '../../types/data.types';
import { WizardStep } from '../types/wizard.types';

/** Estado resultante de evaluar las reglas de un control de formulario en tablas */
export interface TableControlState {
  enabled: boolean;
  disabledReason?: string;
  valueOnDisable?: unknown;
}

/** Contexto completo proveído a las reglas de control de tablas */
export interface TableControlRuleContext {
  dataset: Dataset;
  formValue: Partial<TableOptions>;
}

/** Función evaluadora de una regla de control para tablas */
export type TableControlRuleEvaluator = (ctx: TableControlRuleContext) => TableControlState;

/**
 * Contrato de Estrategia para definir las reglas y comportamientos específicos
 * de una estrategia de tabla en el configurador.
 */
export interface TableRules {
  readonly type: string;
  readonly label: string;

  /** Determina si la estrategia de tabla es soportada para el dataset actual */
  isSupported(dataset: Dataset): boolean;

  /** Devuelve la razón por la que no está soportada (si aplica) */
  getDisabledReason(dataset: Dataset): string | null;

  /** Devuelve los pasos aplicables para el asistente/wizard */
  getSteps(dataset: Dataset, formValue?: Partial<TableOptions>): WizardStep[];

  /** Devuelve los evaluadores de reglas de control específicos de esta estrategia de tabla */
  getControlRules(): Record<string, TableControlRuleEvaluator>;
}
