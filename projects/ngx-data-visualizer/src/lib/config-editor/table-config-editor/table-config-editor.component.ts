import {
    CdkDragDrop,
    DragDropModule,
    moveItemInArray,
    transferArrayItem
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    effect,
    inject,
    input,
    OnInit,
    output,
    signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { saveAs } from 'file-saver';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BackComponent } from '../../icons/back/back.component';
import { CheckComponent } from '../../icons/check/check.component';
import { CloseComponent } from '../../icons/close/close.component';
import { ExportComponent } from '../../icons/export/export.component';
import { ForwardComponent } from '../../icons/forward/forward.component';
import { ResetComponent } from '../../icons/reset/reset.component';
import { Dataset } from '../../services/dataset';
import { Dimension, TableOptions } from '../../types/data.types';
import { ConfigFactory } from '../services/config-factory.service';

/**
 * Componente editor para la configuración de tablas.
 * Permite configurar dimensiones, totales y formatos mediante una interfaz drag & drop.
 */
@Component({
    selector: 'lib-table-config-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DragDropModule,
        BackComponent,
        ForwardComponent,
        CloseComponent,
        ResetComponent,
        CheckComponent,
        ExportComponent
    ],
    templateUrl: './table-config-editor.component.html',
    styleUrl: './table-config-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableConfigEditorComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly configFactory = inject(ConfigFactory);
    private readonly destroyRef = inject(DestroyRef);

    /** Conjunto de datos para obtener las dimensiones disponibles */
    dataset = input.required<Dataset>();

    /** Opciones actuales de la tabla */
    options = input<TableOptions | null>(null);

    /** Emite cuando la configuración ha cambiado */
    optionsChange = output<TableOptions>();

    /** Emite cuando se solicita cerrar el editor */
    closeEditor = output<void>();

    /** Paso actual del asistente (1 a 3) */
    public readonly currentStep = signal<number>(1);

    /** Lista de pasos del asistente */
    public readonly steps = [
        { label: 'Estructura Pivot' },
        { label: 'Visualización y Formato' },
        { label: 'Totales' }
    ];

    /** Formulario de configuración */
    configForm!: FormGroup;

    /** Estado de columnas seleccionadas para el drag & drop */
    public selectedCols: Dimension[] = [];

    /** Estado de filas seleccionadas para el drag & drop */
    public selectedRows: Dimension[] = [];

    /**
     * Inicializa el componente y sus efectos reactivos.
     */
    constructor() {
        this.initializeEffects();
    }

    ngOnInit() {
        this.initForm();
    }

    /**
     * Inicializa los efectos reactivos para sincronizar el estado.
     */
    private initializeEffects() {
        // Sincronizar formulario cuando cambian las opciones externas o el dataset
        effect(() => {
            const currentOptions = this.options();

            if (this.configForm) {
                if (currentOptions) {
                    this.configForm.patchValue(currentOptions, { emitEvent: false });
                }
                this.syncPivotState();
            }
        }, { allowSignalWrites: true });
    }

    /**
     * Inicializa el formulario con valores por defecto u opciones actuales.
     */
    private initForm() {
        const defaults = this.configFactory.getDefaultTableOptions();
        const initialValues = this.options() || defaults;

        this.configForm = this.fb.group({
            digitsAfterDecimal: [initialValues.digitsAfterDecimal, [Validators.required, Validators.min(0)]],
            totalRow: [initialValues.totalRow],
            totalCol: [initialValues.totalCol],
            cols: [initialValues.cols || []],
            rows: [initialValues.rows || []],
            suffix: [initialValues.suffix],
            valueDisplay: [initialValues.valueDisplay || 'nominal']
        });

        this.syncPivotState();
        this.setupAutoUpdate();
    }

    /**
     * Configura la emisión automática de cambios cuando el formulario se modifica.
     */
    private setupAutoUpdate() {
        this.configForm.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(value => {
                this.optionsChange.emit(value);
            });
    }

    /**
     * Exporta la configuración actual como un archivo JSON descargable.
     */
    public exportConfig() {
        const config = this.configForm.value;
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        saveAs(blob, `config-table-${Date.now()}.json`);
    }

    /**
     * Sincroniza el estado de las listas de drag & drop con los valores del formulario.
     */
    private syncPivotState() {
        const dataset = this.dataset();
        if (!dataset) return;

        const allDims = [...dataset.dimensions];
        let colIds = (this.configForm.get('cols')?.value || []) as (string | number)[];
        let rowIds = (this.configForm.get('rows')?.value || []) as (string | number)[];

        // Normalización: Convertir nombres a IDs si es necesario
        const normalize = (ids: (string | number)[]) => ids.map(id => {
            const dim = allDims.find(d => String(d.id) === String(id) || d.name === String(id) || d.nameView === String(id));
            return dim ? dim.id : id;
        });

        colIds = normalize(colIds);
        rowIds = normalize(rowIds);

        // Mapear dimensiones a objetos
        this.selectedCols = colIds
            .map(id => allDims.find(d => String(d.id) === String(id)))
            .filter((d): d is Dimension => !!d);

        this.selectedRows = rowIds
            .map(id => allDims.find(d => String(d.id) === String(id)))
            .filter((d): d is Dimension => !!d);

        // Asegurar que todas las dimensiones estén presentes (por defecto en filas si faltan)
        const assignedIds = new Set([...colIds, ...rowIds].map(String));
        const missingDims = allDims.filter(d => !assignedIds.has(String(d.id)));

        if (missingDims.length > 0) {
            this.selectedRows = [...this.selectedRows, ...missingDims];
            this.configForm.patchValue({
                cols: this.selectedCols.map(d => d.id),
                rows: this.selectedRows.map(d => d.id)
            }, { emitEvent: false });
        }
    }

    /**
     * Maneja el evento de soltar elementos en las listas de drag & drop.
     * @param event Evento de CdkDragDrop.
     */
    public drop(event: CdkDragDrop<Dimension[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }

        // Actualizar valores del formulario
        this.configForm.patchValue({
            cols: this.selectedCols.map(d => d.id),
            rows: this.selectedRows.map(d => d.id)
        });
    }

    /**
     * Avanza al siguiente paso del asistente, o finaliza si está en el último.
     */
    public nextStep(): void {
        const step = this.currentStep();
        if (step < this.steps.length) {
            this.currentStep.set(step + 1);
        } else {
            this.closeEditor.emit();
        }
    }

    /**
     * Retrocede al paso anterior del asistente.
     */
    public prevStep(): void {
        const step = this.currentStep();
        if (step > 1) {
            this.currentStep.set(step - 1);
        }
    }

    /**
     * Salta a un paso específico del asistente.
     * @param step Número de paso (1 a N)
     */
    public goToStep(step: number): void {
        if (step >= 1 && step <= this.steps.length) {
            this.currentStep.set(step);
        }
    }
}
