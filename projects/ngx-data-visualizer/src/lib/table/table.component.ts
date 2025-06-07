import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input
} from '@angular/core';

import { TableService } from './services/table.service';
import { PivotConfiguration, TableConfiguration } from './types/table-base';
import { TableHelper } from './utils/table-helper';

/**
 * Componente de tabla que muestra datos en formato tabular con capacidad de pivotado.
 * Soporta características como tablas fijas (sticky) y configuración dinámica.
 */
@Component({
  selector: 'lib-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {
  // Servicios
  private readonly tableService = inject(TableService);

  // Inputs
  /** Configuración de la tabla */
  protected readonly tableConfiguration = input.required<TableConfiguration>();

  // Referencias a elementos del DOM
  @ViewChild('pivotTable', { static: true })
  private readonly pivotTable!: ElementRef<HTMLDivElement>;

  /**
   * Efecto que se activa cuando cambia la configuración de la tabla.
   * @private
   */
  private readonly configEffect = effect(() => {
    const config = this.tableConfiguration();
    if (config) {
      this.configure();
    }
  });

  /**
   * Configura la tabla con la configuración proporcionada.
   * Obtiene la configuración del servicio y renderiza la tabla.
   */
  public configure(): void {
    const pivotConfig = this.tableService.getTableConfiguration(
      this.tableConfiguration()
    );
    this.render(pivotConfig);
  }

  /**
   * Obtiene el HTML de la tabla generada.
   * @returns El HTML de la tabla como cadena.
   */
  public getHtmlTable(): string {
    const tableElement = this.pivotTable.nativeElement;
    const firstChild = tableElement.firstElementChild;

    if (firstChild) {
      firstChild.classList.add('table', 'table-bordered');
    }

    return tableElement.innerHTML;
  }

  /**
   * Obtiene el elemento nativo de la tabla.
   * @returns El elemento HTML de la tabla.
   * @internal
   */
  public getTableElement(): HTMLElement | null {
    return this.pivotTable?.nativeElement || null;
  }

  /**
   * Renderiza la tabla con la configuración de pivotado.
   * @param pivotConfig - Configuración para el pivotado de la tabla.
   * @private
   */
  private render(pivotConfig: PivotConfiguration): void {
    const tableElement = this.pivotTable.nativeElement;
    const tableData = this.tableConfiguration().data.getData();

    // Asegurar que el elemento es un HTMLDivElement
    if (tableElement instanceof HTMLDivElement) {
      TableHelper.renderPivot(tableElement, tableData, pivotConfig);
      TableHelper.stickyTable(tableElement);
    } else {
      console.error('El elemento pivotTable no es un HTMLDivElement');
    }
  }
}
