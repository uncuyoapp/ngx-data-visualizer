import {
    DragDropModule
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    computed,
    effect,
    inject,
    input,
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
import { Dataset } from '../../services/dataset';
import { ChartOptions, ChartType } from '../../types/data.types';
import { ChartRulesRegistryService } from '../services/chart-rules-registry.service';
import { ConfigFactory } from '../services/config-factory.service';
import { isDimensionUsedInAxis } from '../strategies/base-chart-rules.strategy';
import { ControlRuleContext, ControlState } from '../strategies/chart-type-rules.interface';
import { WizardStep } from '../types/wizard.types';

@Component({
    selector: 'lib-chart-config-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DragDropModule,
        BackComponent,
        ForwardComponent,
        CloseComponent,
        CheckComponent,
        ExportComponent
    ],
    templateUrl: './chart-config-editor.component.html',
    styleUrl: './chart-config-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartConfigEditorComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly configFactory = inject(ConfigFactory);
    private readonly destroyRef = inject(DestroyRef);
    private readonly chartRulesRegistry = inject(ChartRulesRegistryService);

    /** Dataset para el gráfico */
    dataset = input.required<Dataset>();

    /** Opciones actuales del gráfico */
    options = input<ChartOptions | null>(null);

    /** Emite cuando la configuración ha cambiado */
    optionsChange = output<ChartOptions>();

    /** Emite cuando se solicita cerrar el editor */
    closeEditor = output<void>();

    /** Formulario de configuración */
    configForm!: FormGroup;

    /** Paso actual del asistente (1 a N) */
    public readonly currentStep = signal<number>(1);

    /** Tipo de gráfico seleccionado actualmente */
    protected readonly selectedType = signal<ChartType>('column');

    /** Mapa de estados de los controles (enabled/disabled + hints) */
    public readonly controlStatesMap = signal<Map<string, ControlState>>(new Map());

    /** Señal interna para trackear el valor de firstLevel */
    private readonly firstLevelValue = signal<string | number | null>(null);

    /** Señal interna para trackear el valor de secondLevel */
    private readonly secondLevelValue = signal<string | number | null>(null);

    /** Opciones de tipo de gráfico computadas con estado de habilitación según el dataset */
    protected readonly chartTypeOptions = computed(() => {
        const currentDataset = this.dataset();
        return this.chartRulesRegistry.getAllStrategies().map(strategy => ({
            value: strategy.type,
            label: strategy.label,
            disabled: !strategy.isSupported(currentDataset),
            disabledReason: strategy.getDisabledReason(currentDataset)
        }));
    });

    /** Pasos del wizard adaptados dinámicamente según el gráfico y dataset */
    public readonly activeSteps = computed<WizardStep[]>(() => {
        const type = this.selectedType();
        const currentDataset = this.dataset();
        const strategy = this.chartRulesRegistry.getStrategy(type);
        return strategy.getSteps(currentDataset, this.configForm?.value);
    });

    /** Etiqueta del paso activo actual */
    protected readonly currentStepLabel = computed(() => {
        const steps = this.activeSteps();
        const index = this.currentStep() - 1;
        return steps[index]?.label || '';
    });

    constructor() {
        this.initializeEffects();
    }

    /** Dimensiones disponibles para el segundo nivel del eje X (excluye la seleccionada en el primero) */
    protected readonly availableSecondLevelDimensions = computed(() => {
        const firstLevelId = this.firstLevelValue();
        if (firstLevelId === null || firstLevelId === undefined || String(firstLevelId) === '') {
            return this.dimensions;
        }
        const firstLevelStr = String(firstLevelId);
        return this.dimensions.filter(d => String(d.id) !== firstLevelStr);
    });

    /** Dimensiones disponibles para el apilado (excluye las seleccionadas en el eje X) */
    protected readonly availableStackedDimensions = computed(() => {
        const firstLevelId = this.firstLevelValue();
        const secondLevelId = this.secondLevelValue();

        return this.dimensions.filter(dim => !isDimensionUsedInAxis(dim.id, firstLevelId, secondLevelId));
    });

    /** Indica si la estrategia del tipo de gráfico activo permite apilado por dimensiones individuales */
    protected readonly allowDimensionStacking = computed(() => {
        const type = this.selectedType();
        const strategy = this.chartRulesRegistry.getStrategy(type);
        return strategy.allowDimensionStacking ?? true;
    });

    ngOnInit() {
        this.initForm();
    }

    /**
     * Inicializa los efectos reactivos para reiniciar las opciones cuando cambia la referencia del dataset.
     */
    private initializeEffects() {
        let previousDataset: Dataset | null = null;
        effect(() => {
            const currentDataset = this.dataset();

            if (this.configForm && currentDataset) {
                if (previousDataset && previousDataset !== currentDataset) {
                    this.resetToDefaults();
                }
                previousDataset = currentDataset;
            }
        }, { allowSignalWrites: true });
    }

    /**
     * Reinicializa las opciones de configuración a las por defecto cuando el dataset cambia,
     * re-evalúa las reglas del formulario y emite la nueva configuración limpia.
     * @private
     */
    private resetToDefaults() {
        if (!this.configForm) return;

        const defaults = this.configFactory.getDefaultChartOptions();
        const currentDataset = this.dataset();
        const dims = currentDataset?.dimensions || [];

        if (dims.length > 0) {
            defaults.xAxis = defaults.xAxis || {};
            defaults.xAxis.firstLevel = dims[0].id;
        }

        this.configForm.patchValue(defaults, { emitEvent: false });
        this.selectedType.set(defaults.type || 'column');
        if (dims.length > 0) {
            this.firstLevelValue.set(dims[0].id);
        }
        this.secondLevelValue.set(null);

        this.evaluateRules();
        this.emitCurrentOptions();
    }

    /**
     * Emite la configuración actual del formulario hacia el exterior.
     * @private
     */
    private emitCurrentOptions() {
        if (!this.configForm) return;
        const value = this.configForm.getRawValue();
        const newOptions = this.deepMerge(
            this.options() || this.configFactory.getDefaultChartOptions(),
            value
        );
        this.optionsChange.emit(newOptions);
    }

    /**
     * Inicializa el formulario de configuración con valores por defecto u opciones actuales.
     * @private
     */
    private initForm() {
        const defaults = this.configFactory.getDefaultChartOptions();
        const initialValues = this.options() || defaults;

        this.configForm = this.fb.group({
            type: [initialValues.type, Validators.required],
            title: [initialValues.title],
            stacked: [initialValues.stacked],
            xAxis: this.fb.group({
                disableAutoTitle: [initialValues.xAxis?.disableAutoTitle ?? false],
                firstLevel: [initialValues.xAxis?.firstLevel, Validators.required],
                secondLevel: [initialValues.xAxis?.secondLevel],
                rotateLabels: [initialValues.xAxis?.rotateLabels ?? 0]
            }),
            yAxis: this.fb.group({
                title: [initialValues.yAxis?.title],
                max: [initialValues.yAxis?.max]
            }),
            tooltip: this.fb.group({
                shared: [initialValues.tooltip?.shared],
                decimals: [initialValues.tooltip?.decimals],
                suffix: [initialValues.tooltip?.suffix],
                showTotal: [initialValues.tooltip?.showTotal],
                showPercentage: [initialValues.tooltip?.showPercentage ?? false]
            }),
            navigator: this.fb.group({
                show: [initialValues.navigator?.show ?? false],
                start: [initialValues.navigator?.start ?? null],
                end: [initialValues.navigator?.end ?? null]
            })
        });

        this.selectedType.set(initialValues.type || 'column');
        this.setupAutoUpdate();
        this.setupXAxisSync();
        this.evaluateRules();
    }

    /**
     * Configura la sincronización de los niveles del eje X para evitar selecciones duplicadas.
     * @private
     */
    private setupXAxisSync() {
        const firstLevelControl = this.configForm.get('xAxis.firstLevel');
        const secondLevelControl = this.configForm.get('xAxis.secondLevel');
        const stackedControl = this.configForm.get('stacked');

        if (firstLevelControl) {
            this.firstLevelValue.set(firstLevelControl.value);
            firstLevelControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
                this.firstLevelValue.set(val);
                if (secondLevelControl && secondLevelControl.value !== null && String(secondLevelControl.value) === String(val)) {
                    secondLevelControl.setValue(null);
                }
                if (stackedControl && stackedControl.value !== null && String(stackedControl.value) === String(val)) {
                    stackedControl.setValue(null);
                }
            });
        }

        if (secondLevelControl) {
            this.secondLevelValue.set(secondLevelControl.value);
            secondLevelControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
                this.secondLevelValue.set(val);
                if (stackedControl && stackedControl.value !== null && String(stackedControl.value) === String(val)) {
                    stackedControl.setValue(null);
                }
            });
        }
    }

    /**
     * Evalúa las reglas de control según la estrategia activa y actualiza el formulario y la UI.
     * @private
     */
    private evaluateRules() {
        if (!this.configForm) return;

        const currentDataset = this.dataset();
        const formValue = this.configForm.getRawValue();
        const chartType = (formValue.type as ChartType) || 'column';
        if (this.selectedType() !== chartType) {
            this.selectedType.set(chartType);
        }

        const strategy = this.chartRulesRegistry.getStrategy(chartType);
        const rules = strategy.getControlRules();
        const context: ControlRuleContext = {
            chartType,
            dataset: currentDataset,
            formValue
        };

        const newStatesMap = new Map<string, ControlState>();

        Object.keys(rules).forEach(path => {
            const evaluator = rules[path];
            const state = evaluator(context);
            newStatesMap.set(path, state);

            const control = this.configForm.get(path);
            if (control) {
                if (!state.enabled) {
                    if (control.enabled) {
                        control.disable({ emitEvent: false });
                    }
                    if (state.valueOnDisable !== undefined && control.value !== state.valueOnDisable) {
                        control.setValue(state.valueOnDisable, { emitEvent: false });
                    }
                } else if (control.disabled) {
                    control.enable({ emitEvent: false });
                }
            }
        });

        this.controlStatesMap.set(newStatesMap);

        // Reajustar paso actual si queda fuera del rango activo
        const stepsCount = this.activeSteps().length;
        if (this.currentStep() > stepsCount) {
            this.currentStep.set(Math.max(1, stepsCount));
        }
    }

    /**
     * Realiza una combinación profunda (deep merge) de dos objetos.
     * @private
     */
    private deepMerge<T extends object>(target: T, source: Record<string, unknown>): T {
        if (!target) return source as unknown as T;
        if (!source) return target;
        const output = { ...target };
        if (typeof target === 'object' && typeof source === 'object') {
            const targetObj = output as Record<string, unknown>;
            Object.keys(source).forEach(key => {
                // Nota: Los valores primitivos o null/arrays se asignan directamente en la rama 'else',
                // permitiendo que un valor null en source sobreescriba objetos o valores previos en target.
                const val = source[key];
                if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                    targetObj[key] = this.deepMerge((targetObj[key] || {}) as object, val as Record<string, unknown>);
                } else {
                    targetObj[key] = val;
                }
            });
        }
        return output;
    }

    /**
     * Configura la emisión automática de cambios cuando el formulario se modifica.
     * @private
     */
    private setupAutoUpdate() {
        // Escuchar inmediatamente los cambios de tipo o controles para re-evaluar reglas síncronamente
        this.configForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(val => {
                if (val.type && val.type !== this.selectedType()) {
                    this.selectedType.set(val.type);
                }
                this.evaluateRules();
            });

        // Emitir hacia el contenedor padre con debounce
        this.configForm.valueChanges
            .pipe(
                debounceTime(200),
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                this.emitCurrentOptions();
            });
    }

    /**
     * Exporta la configuración actual como un archivo JSON descargable.
     */
    public exportConfig() {
        const config = this.configForm.getRawValue();
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        saveAs(blob, `config-chart-${Date.now()}.json`);
    }

    /**
     * Avanza al siguiente paso del asistente, o finaliza si está en el último.
     */
    public nextStep(): void {
        const step = this.currentStep();
        if (step < this.activeSteps().length) {
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
        if (step >= 1 && step <= this.activeSteps().length) {
            this.currentStep.set(step);
        }
    }

    /**
     * Obtiene las dimensiones disponibles del dataset actual.
     */
    public get dimensions() {
        return this.dataset().dimensions || [];
    }
}
