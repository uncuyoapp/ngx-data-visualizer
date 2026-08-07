import { ChartType } from '../../types/data.types';
import { BaseChartTypeRules } from './base-chart-rules.strategy';

/**
 * Estrategia de reglas para gráficos estándar (Columnas, Barras, Líneas, Área).
 */
export class ColumnChartRules extends BaseChartTypeRules {
  constructor(
    public readonly type: ChartType = 'column',
    public readonly label: string = 'Columnas'
  ) {
    super();
  }
}
