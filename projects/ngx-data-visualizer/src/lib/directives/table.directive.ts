import {
  ComponentRef,
  Directive,
  OnDestroy,
  ViewContainerRef,
  effect,
  input,
  output,
  signal,
  inject,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, debounceTime } from "rxjs";
import { Dataset } from "../services/dataset";
import { ExcelService } from "../table/services/excel.service";
import { TableComponent } from "../table/table.component";
import { TableConfiguration } from "../table/types/table-base";
import { TableOptions } from "../types/data.types";
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly excelService = inject(ExcelService);
  private readonly overlay = inject(Overlay);

  private readonly DEFAULT_EXPORT_NAME = "tabla";
  /** Conjunto de datos para la tabla */
  dataset = input.required<Dataset>();

  /** Opciones de configuración de la tabla */
  tableOptions = input.required<TableOptions>();

  /** Configuración de la tabla */
  tableConfiguration!: TableConfiguration;

  /** Instancia del componente de tabla renderizado */
  private tableRenderComponentRef!: ComponentRef<TableComponent>;

  /** Referencia al componente del editor de configuración */
  private configEditorComponentRef?: ComponentRef<any>;

  /** Referencia al overlay de CDK para el editor */
  private overlayRef?: OverlayRef;

  /** Instancia del componente de tabla */
  public tableComponent!: TableComponent;

  /** Opciones internas "en vivo" para la tabla */
  internalOptions = signal<TableOptions | null>(null);

  /** Suscripción para cambios en los datos */
  subscription!: Subscription;

  /** Indica si se debe mostrar el editor de configuración */
  enableEditor = input<boolean>(false);

  /** Evento que emite los cambios en la configuración */
  optionsChange = output<TableOptions>();

  /** Evento que emite cuando la configuración cambia desde el editor */
  onConfigChange = output<TableOptions>();

  /** Evento que emite cuando se cierra el editor */
  close = output<void>();

  /**
   * Inicializa la directiva, configurando la creación de la tabla y sus actualizaciones.
   */
  constructor() {
    // Sincronizar internalOptions cuando el input tableOptions cambie desde afuera
    effect(() => {
      this.internalOptions.set(this.tableOptions());
    }, { allowSignalWrites: true });

    this.initializeTable();
  }

  /**
   * Alterna la visibilidad del editor de configuración
   */
  public toggleEditor(): void {
    if (this.overlayRef) {
      this.destroyEditorComponent();
    } else {
      this.createEditorComponent();
    }
  }

  /**
   * Crea dinámicamente el componente del editor usando Overlay
   */
  private async createEditorComponent() {
    if (this.overlayRef) return;

    const { TableConfigEditorComponent } = await import('../config-editor/table-config-editor/table-config-editor.component');

    // Crear el overlay
    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.tableComponent.configToggleButton)
        .withPush(false)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'top',
            offsetX: -12
          }
        ])
    });

    const portal = new ComponentPortal(TableConfigEditorComponent);
    this.configEditorComponentRef = this.overlayRef.attach(portal);

    this.configEditorComponentRef.setInput('dataset', this.dataset());
    this.configEditorComponentRef.setInput('options', this.internalOptions());

    this.configEditorComponentRef.instance.optionsChange
      .subscribe((newOptions: TableOptions) => {
        // Actualizar estado interno para impacto inmediato (Live Preview)
        this.internalOptions.set(newOptions);
        this.optionsChange.emit(newOptions);
        this.onConfigChange.emit(newOptions);
      });

    this.configEditorComponentRef.instance.close
      .subscribe(() => {
        this.close.emit();
        this.destroyEditorComponent();
      });
  }

  /**
   * Destruye el componente del editor y limpia el overlay.
   * @private
   */
  private destroyEditorComponent() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.configEditorComponentRef = undefined;
    }
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
    this.destroyEditorComponent();
    this.viewContainerRef.clear();
  }

  /**
   * @description
   * Crea dinámicamente el `TableComponent` en el host de la directiva.
   * Borra cualquier vista anterior, construye la configuración de la tabla
   * a partir de los inputs y la pasa al nuevo componente.
   * @private
   */
  createTableComponent() {
    // Si queremos preservar el editor, no podemos usar clear() indiscriminadamente
    if (this.tableRenderComponentRef) {
      this.tableRenderComponentRef.destroy();
    }

    const options = this.internalOptions();
    if (!options) return;

    this.tableConfiguration = {
      dataset: this.dataset(),
      options: options,
    };
    // Crear el componente de tabla
    this.tableRenderComponentRef =
      this.viewContainerRef.createComponent<TableComponent>(TableComponent);
    this.tableComponent = this.tableRenderComponentRef.instance;

    // Configurar la entrada usando setInput
    this.tableRenderComponentRef.setInput(
      "tableConfiguration",
      this.tableConfiguration,
    );
    this.tableRenderComponentRef.setInput("showConfigToggle", this.enableEditor());

    // Escuchar el evento de alternancia de configuración
    this.tableComponent.toggleConfig.subscribe(() => {
      this.toggleEditor();
    });

    // Si el editor existe, hay que asegurarse que esté arriba o manejar su referencia
    if (this.configEditorComponentRef) {
      this.configEditorComponentRef.instance.options = options;
      this.configEditorComponentRef.instance.dataset = this.dataset();
    }
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
    this.dataset()
      .dataUpdated.pipe(
        debounceTime(200),
        takeUntilDestroyed(this.destroyRef)
      )
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
