import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { ConfigEditorOverlayService } from '../config-editor/services/config-editor-overlay.service';

import { AuditService } from "../services/audit.service";
import { Dataset } from "../services/dataset";
import { EventBusService } from "../services/event-bus.service";
import { TableOptions as TableOptionsType } from "../types/data.types";
import { VisualizerEventType } from "../types/visualizer-event.types";
import { injectAutoUpdate } from "../utils/auto-update.helper";
import { ExcelService } from "./services/excel.service";
import { TableService } from "./services/table.service";
import { TableConfiguration, TableOptions } from "./types/table-base";
import { TableHelperService } from "./utils/table-helper.service";

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "libTable, [libTable]",
  standalone: true,
  exportAs: "libTable",
  imports: [CommonModule],
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnDestroy {
  private readonly tableService = inject(TableService);
  private readonly tableHelperService = inject(TableHelperService);
  private readonly excelService = inject(ExcelService);
  private readonly elementRef = inject(ElementRef);
  private readonly eventBus = inject(EventBusService);
  private readonly auditService = inject(AuditService);
  private readonly editorOverlayService = inject(ConfigEditorOverlayService);
  private readonly instanceId = `table-${Math.floor(Math.random() * 10000)}`;

  private readonly DEFAULT_EXPORT_NAME = "tabla";

  // ============================================
  // INPUTS & OUTPUTS PRINCIPALES (PÚBLICOS)
  // ============================================

  /** Conjunto de datos para la tabla */
  dataset = input.required<Dataset>();

  /** Opciones de configuración de la tabla */
  tableOptions = input.required<TableOptionsType>();


  /** Controla la apertura y cierre del panel de edición de configuración de forma bidireccional. */
  showEditor = model<boolean>(false);

  /** Evento de salida para soportar el enlace bidireccional de la configuración [(tableOptions)] */
  tableOptionsChange = output<TableOptionsType>();

  // ============================================
  // ESTADOS Y SEÑALES INTERNAS
  // ============================================

  /** Opciones internas "en vivo" para la tabla */
  internalOptions = signal<TableOptionsType | null>(null);

  /** Referencia al elemento DOM de la tabla pivot del template */
  @ViewChild("pivotTable", { static: true })
  private readonly pivotTable!: ElementRef<HTMLDivElement>;

  /** Referencia al overlay de CDK para el editor */
  private overlayRef?: OverlayRef;

  /** Instancia del editor de configuración inyectado en el overlay */
  private configEditorComponentRef?: ComponentRef<unknown>;



  // ============================================
  // SIGNALS COMPUTADOS
  // ============================================

  /** Genera la configuración de la tabla de forma reactiva */
  tableConfiguration = computed<TableConfiguration | null>(() => {
    const ds = this.dataset();
    const opts = this.internalOptions();
    if (!ds || !opts) return null;
    return {
      dataset: ds,
      options: opts as TableOptions,
    };
  });

  // ============================================
  // CONSTRUCTOR & EFECTOS DE INICIALIZACIÓN
  // ============================================

  constructor() {
    // Sincronizar internalOptions cuando el input tableOptions cambie desde afuera
    effect(() => {
      this.internalOptions.set(this.tableOptions());
    }, { allowSignalWrites: true });

    // Efecto reactivo que gatilla el renderizado e inicializa la tabla
    effect(() => {
      const config = this.tableConfiguration();
      if (config) {
        this.configure();
      }
    });

    // Registrar la suscripción automática para actualizar los datos en caliente con 200ms de debounce
    injectAutoUpdate(
      () => this.dataset(),
      () => this.internalOptions(),
      () => this.configure(),
      200
    );

    // Reactivamente abrir/cerrar el editor según el input showEditor
    effect(() => {
      const show = this.showEditor();
      if (show) {
        this.createEditorComponent();
      } else {
        this.destroyEditorComponent();
      }
    }, { allowSignalWrites: true });


  }

  // ============================================
  // PROCESAMIENTO Y RENDEREADO DE TABLAS
  // ============================================

  public configure(): void {
    const config = this.tableConfiguration();
    if (!config) return;

    this.eventBus.emit({
      type: VisualizerEventType.TABLE_CONFIGURE,
      instanceId: this.instanceId,
      payload: { columns: config.options.cols || [], rows: config.options.rows || [] }
    });

    const { dataset, options } = config;

    const aliasMap: Record<string | number, string> = {};
    const derivedAttributes: Record<
      string,
      (record: Record<string, unknown>) => unknown
    > = {};

    for (const dim of dataset.getActiveDimensions()) {
      const dataKey = dataset.getDimensionKey(dim.id);
      if (dataKey) {
        aliasMap[dim.id] = dim.nameView;
        aliasMap[dim.name] = dim.nameView;
        aliasMap[dim.nameView] = dim.nameView;
        derivedAttributes[dim.nameView] = (record) => record[dataKey];
      }
    }

    const translatedCols = options.cols
      .map((idOrName: string | number) => aliasMap[idOrName])
      .filter(Boolean);
    const translatedRows = options.rows
      .map((idOrName: string | number) => aliasMap[idOrName])
      .filter(Boolean);

    const enrichedConfig: TableConfiguration = {
      ...config,
      options: {
        ...options,
        cols: translatedCols,
        rows: translatedRows,
        derivedAttributes: derivedAttributes,
      },
    };

    const pivotConfig = this.tableService.getTableConfiguration(enrichedConfig);
    this.render(pivotConfig);
  }

  private render(pivotConfig: TableOptions): void {
    this.eventBus.emit({
      type: VisualizerEventType.TABLE_RENDER,
      instanceId: this.instanceId
    });
    const tableElement = this.pivotTable.nativeElement;
    const config = this.tableConfiguration();
    if (!config) return;

    const tableData = config.dataset.dataProvider.getData();

    if (tableElement instanceof HTMLDivElement) {
      this.tableHelperService.renderPivot(tableElement, tableData, pivotConfig);
      this.tableHelperService.stickyTable(tableElement);
    } else {
      throw new Error("El elemento pivotTable debe ser un HTMLDivElement");
    }
  }



  // ============================================
  // API PÚBLICA DEL COMPONENTE (MÉTODOS)
  // ============================================

  /**
   * Cambia el modo de visualización de los valores de la tabla.
   * @param mode El modo de visualización: 'nominal', 'percentOfTotal', 'percentOfRow', o 'percentOfColumn'.
   */
  public setValueDisplay(
    mode: "nominal" | "percentOfTotal" | "percentOfRow" | "percentOfColumn",
  ): void {
    const config = this.tableConfiguration();
    if (config) {
      config.options.valueDisplay = mode;
      this.configure();
    }
  }

  /**
   * Exporta la tabla en diferentes formatos
   * @param type Tipo de exportación ('html' o 'xlsx')
   * @param name Nombre opcional para el archivo exportado
   * @returns Dependiendo del tipo, puede devolver el HTML o el resultado de la exportación
   */
  public export(type: "html" | "xlsx", name: string = this.DEFAULT_EXPORT_NAME) {
    try {
      this.eventBus.emit({
        type: VisualizerEventType.TABLE_EXPORT,
        instanceId: this.instanceId,
        payload: { type, name }
      });
      switch (type) {
        case "html":
          return this.getHtmlTable();

        case "xlsx": {
          const tableElement = this.getTableElement();
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
  }

  public getHtmlTable(): string {
    const tableElement = this.pivotTable.nativeElement;
    const firstChild = tableElement.firstElementChild;

    if (firstChild) {
      firstChild.classList.add("table", "table-bordered");
    }

    return tableElement.innerHTML;
  }

  public getTableElement(): HTMLElement | null {
    return this.pivotTable?.nativeElement || null;
  }

  public onThemeApplied(): void {
    setTimeout(() => {
      const tableElement = this.getTableElement();
      if (tableElement instanceof HTMLDivElement) {
        this.tableHelperService.stickyTable(tableElement);
      }
    }, 5);
  }

  // ============================================
  // LÓGICA DEL EDITOR DE CONFIGURACIÓN (CDK OVERLAY)
  // ============================================

  /** Alterna la visibilidad del editor de configuración. */
  public toggleEditor(): void {
    this.showEditor.set(!this.showEditor());
  }

  private async createEditorComponent() {
    if (this.overlayRef) return;

    const { TableConfigEditorComponent } = await import('../config-editor/table-config-editor/table-config-editor.component');

    const { overlayRef, componentRef } = this.editorOverlayService.create({
      elementRef: this.elementRef,
      component: TableConfigEditorComponent,
      dataset: this.dataset(),
      options: this.internalOptions(),
      onOptionsChange: (newOptions) => {
        if (newOptions) {
          this.internalOptions.set(newOptions);
          this.tableOptionsChange.emit(newOptions);
        }
      },
      onClose: () => {
        this.showEditor.set(false);
      }
    });

    this.overlayRef = overlayRef;
    this.configEditorComponentRef = componentRef;
  }

  private destroyEditorComponent() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.configEditorComponentRef = undefined;
    }
  }

  // ============================================
  // DESTRUCCIÓN
  // ============================================

  ngOnDestroy(): void {
    this.destroyEditorComponent();
  }
}

/** @deprecated Usar TableComponent en su lugar. Se mantiene por motivos de retrocompatibilidad. */
export { TableComponent as TableDirective };
