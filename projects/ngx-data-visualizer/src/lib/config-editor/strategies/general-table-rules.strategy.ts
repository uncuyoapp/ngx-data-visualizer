import { BaseTableRules } from './base-table-rules.strategy';

/**
 * Estrategia general por defecto para la configuración de tablas.
 */
export class GeneralTableRules extends BaseTableRules {
  readonly type = 'general';
  readonly label = 'Tabla General';
}
