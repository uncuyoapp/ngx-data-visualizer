import { Dataset } from '../../services/dataset';
import { ChartOptions, ChartType } from '../../types/data.types';
import { WizardStep } from '../types/wizard.types';

/** Estado resultante de evaluar las reglas de un control de formulario */
export interface ControlState {
  enabled: boolean;
  disabledReason?: string;
  valueOnDisable?: unknown;
}

/** Contexto completo proveído a las reglas de control */
export interface ControlRuleContext {
  chartType: ChartType;
  dataset: Dataset;
  formValue: Partial<ChartOptions>;
}

/** Función evaluadora de una regla de control */
export type ControlRuleEvaluator = (ctx: ControlRuleContext) => ControlState;

/**
 * Contrato de Estrategia para definir las reglas y comportamientos específicos
 * de un tipo de gráfico en el configurador.
 */
export interface ChartTypeRules {
  readonly type: ChartType;
  readonly label: string;
  /** Indica si la estrategia del tipo de gráfico permite apilar por dimensiones individuales */
  readonly allowDimensionStacking?: boolean;

  /** Determina si el tipo de gráfico es soportado para el dataset actual */
  isSupported(dataset: Dataset): boolean;

  /** Devuelve la razón por la que no está soportado (si aplica) */
  getDisabledReason(dataset: Dataset): string | null;

  /** Devuelve los pasos aplicables para el asistente/wizard */
  getSteps(dataset: Dataset, formValue?: Partial<ChartOptions>): WizardStep[];

  /** Devuelve los evaluadores de reglas de control específicos de este gráfico */
  getControlRules(): Record<string, ControlRuleEvaluator>;
}
