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
import { ChartOptions } from '../../types/data.types';
import { ConfigFactory } from '../services/config-factory.service';
import { saveAs } from 'file-saver';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
    DragDropModule
} from '@angular/cdk/drag-drop';

@Component({
    selector: 'lib-chart-config-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DragDropModule],
    templateUrl: './chart-config-editor.component.html',
    styleUrl: './chart-config-editor.component.scss'
})
export class ChartConfigEditorComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private configFactory = inject(ConfigFactory);

    @Input() dataset!: Dataset;
    @Input() options?: ChartOptions | null;

    @Output() optionsChange = new EventEmitter<ChartOptions>();
    @Output() close = new EventEmitter<void>();

    configForm!: FormGroup;
    activeTab: string = 'general';

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
        }
        if (changes['dataset']) {
            this.initForm();
        }
    }

    private initForm() {
        const defaults = this.configFactory.getDefaultChartOptions();
        const initialValues = this.options || defaults;

        this.configForm = this.fb.group({
            type: [initialValues.type, Validators.required],
            title: [initialValues.title],
            stacked: [initialValues.stacked],
            xAxis: this.fb.group({
                title: [initialValues.xAxis.title],
                rotateLabels: [initialValues.xAxis.rotateLabels],
                firstLevel: [initialValues.xAxis.firstLevel, Validators.required],
                secondLevel: [initialValues.xAxis.secondLevel]
            }),
            yAxis: this.fb.group({
                title: [initialValues.yAxis.title],
                max: [initialValues.yAxis.max]
            }),
            tooltip: this.fb.group({
                shared: [initialValues.tooltip.shared],
                decimals: [initialValues.tooltip.decimals],
                suffix: [initialValues.tooltip.suffix],
                showTotal: [initialValues.tooltip.showTotal]
            }),
            legends: this.fb.group({
                enabled: [initialValues.legends.enabled],
                show: [initialValues.legends.show],
                position: [initialValues.legends.position]
            }),
            measureUnit: [initialValues.measureUnit],
            toPercent: [initialValues.toPercent]
        });

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
        saveAs(blob, `config-chart-${Date.now()}.json`);
    }

    onTabChange(tab: string) {
        this.activeTab = tab;
    }

    get dimensions() {
        return this.dataset?.dimensions || [];
    }
}
