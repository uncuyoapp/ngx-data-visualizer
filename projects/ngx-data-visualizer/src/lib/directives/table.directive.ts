import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
} from "@angular/core";
import { Subscription, debounceTime } from "rxjs";
import { Dataset } from "../services/dataset";
import { ExcelService } from "../table/services/excel.service";
import { TableComponent } from "../table/table.component";
import { TableConfiguration } from "../table/types/table-base";
import { TableOptions } from "../types/data.types";

/**
 * Directiva que permite incrustar una tabla dinámica en un componente contenedor.
 * Maneja la creación, configuración y exportación de tablas con datos dinámicos.
 */
@Directive({
  selector: "libTable, [libTable]",
  standalone: true,
  exportAs: "libTable",
})
export class TableDirective implements OnDestroy {
  private readonly DEFAULT_EXPORT_NAME = "tabla";
  /** Conjunto de datos para la tabla */
  dataset = input.required<Dataset>();

  /** Opciones de configuración de la tabla */
  tableOptions = input.required<TableOptions>();

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
    private readonly excelService: ExcelService,
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
   * @description
   * Crea dinámicamente el `TableComponent` en el host de la directiva.
   * Borra cualquier vista anterior, construye la configuración de la tabla
   * a partir de los inputs y la pasa al nuevo componente.
   * @private
   */
  createTableComponent() {
    this.viewContainerRef.clear();
    this.tableConfiguration = {
      dataset: this.dataset(),
      options: this.tableOptions(),
    };
    // Crear el componente
    this.tableRenderComponentRef =
      this.viewContainerRef.createComponent<TableComponent>(TableComponent);
    this.tableComponent = this.tableRenderComponentRef.instance;

    // Configurar la entrada usando setInput
    this.tableRenderComponentRef.setInput(
      "tableConfiguration",
      this.tableConfiguration,
    );
  }

  /**
   * @description
   * Dispara la re-configuración de la tabla pivot en el `TableComponent` hijo.
   * Este método se llama generalmente cuando los datos subyacentes han cambiado.
   */
  updateTable(): void {
    this._executeOnTable((table) => table.configure());
  }

  /**
   * Suscribe los cambios en los datos para actualizar la tabla automáticamente
   */
  private subscribeDataChanges() {
    this.subscription?.unsubscribe(); // Cancelar suscripción anterior
    this.subscription = this.dataset()
      .dataUpdated.pipe(debounceTime(200))
      .subscribe(() => {
        this.updateTable();
      });
  }

  /**
   * Cambia el modo de visualización de los valores de la tabla.
   * @param mode El modo de visualización: 'nominal', 'percentOfTotal', 'percentOfRow', o 'percentOfColumn'.
   */
  public setValueDisplay(
    mode: "nominal" | "percentOfTotal" | "percentOfRow" | "percentOfColumn",
  ): void {
    this._executeOnTable((table) => {
      this.tableConfiguration.options.valueDisplay = mode;
      table.configure();
    });
  }

  /**
   * Exporta la tabla en diferentes formatos
   * @param type Tipo de exportación ('html' o 'xlsx')
   * @param name Nombre opcional para el archivo exportado
   * @returns Dependiendo del tipo, puede devolver el HTML o el resultado de la exportación
   * @throws {Error} Si no se puede acceder al elemento de la tabla para la exportación
   */
  export(type: "html" | "xlsx", name: string = this.DEFAULT_EXPORT_NAME) {
    return this._executeOnTable((table) => {
      try {
        switch (type) {
          case "html":
            return table.getHtmlTable();

          case "xlsx": {
            const tableElement = table.getTableElement();
            if (!tableElement) {
              throw new Error("No se pudo acceder al elemento de la tabla");
            }
            return this.excelService.exportAsExcelFile(tableElement, name);
          }

          default:
            console.warn(`Tipo de exportación no soportado: ${type}`);
            return null;
        }
      } catch (error) {
        console.error("Error al exportar la tabla:", error);
        throw error;
      }
    });
  }

  /**
   * Ejecuta una acción en el componente de tabla si está listo.
   * @param action La función a ejecutar con la instancia del componente como argumento.
   * @returns El resultado de la función de acción, o `void` si la tabla no está lista.
   * @private
   */
  private _executeOnTable<T>(action: (table: TableComponent) => T): T | void {
    if (this.tableComponent) {
      return action(this.tableComponent);
    }
    console.warn("El componente de tabla no está inicializado. Acción omitida.");
  }
}
