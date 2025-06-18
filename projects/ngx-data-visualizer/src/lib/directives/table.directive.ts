import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Dataset } from '../services/dataset';
import { ExcelService } from '../table/services/excel.service';
import { TableComponent } from '../table/table.component';
import {
  PivotConfiguration,
  TableConfiguration,
} from '../table/types/table-base';

/**
 * Directiva que permite incrustar una tabla dinámica en un componente contenedor.
 * Maneja la creación, configuración y exportación de tablas con datos dinámicos.
 */
@Directive({
  selector: 'libTable, [libTable]',
  standalone: true,
  exportAs: 'libTable',
})
export class TableDirective implements OnDestroy {
  private readonly DEFAULT_EXPORT_NAME = 'tabla';
  /** Conjunto de datos para la tabla */
  dataset = input.required<Dataset>();

  /** Opciones de configuración de la tabla */
  options = input.required<PivotConfiguration>();

  /** Configuración de la tabla */
  tableConfiguration!: TableConfiguration;

  /** Referencia al componente de tabla creado */
  tableRenderComponentRef!: ComponentRef<TableComponent>;

  /** Instancia del componente de tabla */
  public tableComponent!: TableComponent;

  /** Suscripción para cambios en los datos */
  subscription!: Subscription;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly excelService: ExcelService
  ) {
    this.initializeTable();
  }

  /**
   * Inicializa la tabla y configura las suscripciones necesarias
   */
  private initializeTable(): void {
    effect(() => {
      this.createTableComponent();
      this.subscribeDataChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Crea y configura el componente de tabla con la configuración actual
   */
  createTableComponent() {
    this.viewContainerRef.clear();
    this.tableConfiguration = {
      data: this.dataset().dataProvider,
      dimensions: this.dataset().dimensions,
      options: this.options(),
    };
    // Crear el componente
    this.tableRenderComponentRef =
      this.viewContainerRef.createComponent<TableComponent>(TableComponent);
    this.tableComponent = this.tableRenderComponentRef.instance;

    // Configurar la entrada usando setInput
    this.tableRenderComponentRef.setInput(
      'tableConfiguration',
      this.tableConfiguration
    );
  }

  /**
   * Actualiza las dimensiones de la tabla cuando cambian los datos
   */
  updateTable() {
    this.tableConfiguration.dimensions =
      this.dataset().dataProvider.getDimensions();
    this.tableComponent.configure();
  }

  /**
   * Suscribe los cambios en los datos para actualizar la tabla automáticamente
   */
  private subscribeDataChanges() {
    this.subscription = this.dataset().dataUpdated.subscribe(() => {
      this.updateTable();
    });
  }

  /**
   * Exporta la tabla en diferentes formatos
   * @param type Tipo de exportación ('html' o 'xlsx')
   * @param name Nombre opcional para el archivo exportado
   * @returns Dependiendo del tipo, puede devolver el HTML o el resultado de la exportación
   * @throws {Error} Si no se puede acceder al elemento de la tabla para la exportación
   */
  export(type: 'html' | 'xlsx', name: string = this.DEFAULT_EXPORT_NAME) {
    if (!this.tableComponent) {
      console.warn('El componente de tabla no está inicializado');
      return null;
    }

    try {
      switch (type) {
        case 'html':
          return this.tableComponent.getHtmlTable();

        case 'xlsx': {
          const tableElement = this.tableComponent.getTableElement();
          if (!tableElement) {
            throw new Error('No se pudo acceder al elemento de la tabla');
          }
          return this.excelService.exportAsExcelFile(tableElement, name);
        }

        default:
          console.warn(`Tipo de exportación no soportado: ${type}`);
          return null;
      }
    } catch (error) {
      console.error('Error al exportar la tabla:', error);
      throw error;
    }
  }
}
