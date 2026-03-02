import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnChanges,
    SimpleChanges,
    inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Dataset } from '../../services/dataset';
import { TableOptions, Dimension } from '../../types/data.types';
import { ConfigFactory } from '../services/config-factory.service';
import { saveAs } from 'file-saver';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
    DragDropModule
} from '@angular/cdk/drag-drop';

@Component({
    selector: 'lib-table-config-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DragDropModule],
    templateUrl: './table-config-editor.component.html',
    styleUrl: './table-config-editor.component.scss'
})
export class TableConfigEditorComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private configFactory = inject(ConfigFactory);

    @Input() dataset!: Dataset;
    @Input() options?: TableOptions | null;

    @Output() optionsChange = new EventEmitter<TableOptions>();
    @Output() close = new EventEmitter<void>();

    configForm!: FormGroup;

    // Pivot state for Drag & Drop
    selectedCols: Dimension[] = [];
    selectedRows: Dimension[] = [];

    // Position state for future draggability
    position = { top: '24px', right: '24px', left: 'auto' };

    constructor() { }

    ngOnInit() {
        this.initForm();
        this.setupAutoUpdate();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['options'] && this.options && this.configForm) {
            this.configForm.patchValue(this.options, { emitEvent: false });
            this.syncPivotState();
        }
        if (changes['dataset']) {
            this.initForm();
        }
    }

    private initForm() {
        const defaults = this.configFactory.getDefaultTableOptions();
        const initialValues = this.options || defaults;

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

        if (this.configForm) {
            this.setupAutoUpdate();
        }
    }

    private setupAutoUpdate() {
        this.configForm.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
            )
            .subscribe(value => {
                this.optionsChange.emit(value);
            });
    }

    exportConfig() {
        const config = this.configForm.value;
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        saveAs(blob, `config-table-${Date.now()}.json`);
    }

    private syncPivotState() {
        if (!this.dataset) return;

        const allDims = [...this.dataset.dimensions];
        let colIds = (this.configForm.get('cols')?.value || []) as (string | number)[];
        let rowIds = (this.configForm.get('rows')?.value || []) as (string | number)[];

        // Normalization: Convert names to IDs if necessary
        const normalize = (ids: (string | number)[]) => ids.map(id => {
            const dim = allDims.find(d => String(d.id) === String(id) || d.name === String(id) || d.nameView === String(id));
            return dim ? dim.id : id;
        });

        colIds = normalize(colIds);
        rowIds = normalize(rowIds);

        // Map dimensions to objects
        this.selectedCols = colIds
            .map(id => allDims.find(d => String(d.id) === String(id)))
            .filter((d): d is Dimension => !!d);

        this.selectedRows = rowIds
            .map(id => allDims.find(d => String(d.id) === String(id)))
            .filter((d): d is Dimension => !!d);

        // All dimensions must be present. Add missing ones to rows by default.
        const assignedIds = new Set([...colIds, ...rowIds].map(String));
        const missingDims = allDims.filter(d => !assignedIds.has(String(d.id)));

        if (missingDims.length > 0) {
            this.selectedRows = [...this.selectedRows, ...missingDims];
            // Update form with the new complete state
            this.configForm.patchValue({
                cols: this.selectedCols.map(d => d.id),
                rows: this.selectedRows.map(d => d.id)
            }, { emitEvent: false });
        }
    }

    drop(event: CdkDragDrop<Dimension[]>) {
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

        // Update form values
        this.configForm.patchValue({
            cols: this.selectedCols.map(d => d.id),
            rows: this.selectedRows.map(d => d.id)
        });
    }
}
