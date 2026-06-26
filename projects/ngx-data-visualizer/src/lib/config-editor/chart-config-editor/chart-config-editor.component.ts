import {
    DragDropModule
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    computed,
    effect,
    inject,
    input,
    output,
    signal
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { saveAs } from 'file-saver';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Dataset } from '../../services/dataset';
import { ChartOptions, ChartType } from '../../types/data.types';
import { ConfigFactory } from '../services/config-factory.service';

@Component({
    selector: 'lib-chart-config-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DragDropModule],
    templateUrl: './chart-config-editor.component.html',
    styleUrl: './chart-config-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartConfigEditorComponent implements OnInit {
    private fb = inject(FormBuilder);
    private configFactory = inject(ConfigFactory);

    /** Dataset para el gráfico */
    dataset = input.required<Dataset>();

    /** Opciones actuales del gráfico */
    options = input<ChartOptions | null>(null);

    /** Emite cuando la configuración ha cambiado */
    optionsChange = output<ChartOptions>();

    /** Emite cuando se solicita cerrar el editor */
    close = output<void>();

    /** Función inyectada por la directiva para obtener los extremos del gráfico */
    getExtremesFn = input<(() => { start: number; end: number } | null) | null>(null);

    /** Formulario de configuración */
    configForm!: FormGroup;

    /** Tab activa actualmente */
    public readonly activeTab = signal<string>('general');

    /** Señal interna para trackear el valor de firstLevel */
    private readonly firstLevelValue = signal<string | number | null>(null);

    /** Señal interna para trackear el valor de secondLevel */
    private readonly secondLevelValue = signal<string | number | null>(null);

    /** Tipos de gráficos disponibles */
    protected readonly chartTypes: { value: ChartType; label: string }[] = [
        { value: 'column', label: 'Columnas' },
        { value: 'line', label: 'Líneas' },
        { value: 'spline', label: 'Líneas Curvas (Spline)' },
        { value: 'pie', label: 'Circular' },
        { value: 'bar', label: 'Barras' },
        { value: 'area', label: 'Área' },
        { value: 'areaspline', label: 'Área Curva (Spline)' }
    ];

    /**
     * Inicializa el componente y sus efectos reactivos.
     */
    constructor() {
        this.initializeEffects();
    }

    /** Dimensiones disponibles para el segundo nivel del eje X (excluye la seleccionada en el primero) */
    protected readonly availableSecondLevelDimensions = computed(() => {
        const firstLevelId = this.firstLevelValue();
        if (firstLevelId === null || firstLevelId === undefined) {
            return this.dimensions;
        }
        const firstLevelStr = String(firstLevelId);
        return this.dimensions.filter(d => String(d.id) !== firstLevelStr);
    });

    /** Dimensiones disponibles para el apilado (excluye las seleccionadas en el eje X) */
    protected readonly availableStackedDimensions = computed(() => {
        const firstLevelId = this.firstLevelValue();
        const secondLevelId = this.secondLevelValue();

        return this.dimensions.filter(dim => {
            const isUsedInX = (firstLevelId !== null && Number(dim.id) === Number(firstLevelId)) ||
                (secondLevelId !== null && Number(dim.id) === Number(secondLevelId));
            return !isUsedInX;
        });
    });

    /**
     * Ciclo de vida de inicialización de Angular.
     */
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
            // Accedemos a dataset() para reaccionar a cambios
            this.dataset();

            if (this.configForm && currentOptions) {
                this.configForm.patchValue(currentOptions, { emitEvent: false });
                // Sincronizar señales laterales para filtros de dimensiones
                if (currentOptions.xAxis) {
                    this.firstLevelValue.set(currentOptions.xAxis.firstLevel);
                    this.secondLevelValue.set(currentOptions.xAxis.secondLevel);
                }
            }
        }, { allowSignalWrites: true });
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
                disableAutoTitle: [initialValues.xAxis.disableAutoTitle ?? false],
                firstLevel: [initialValues.xAxis.firstLevel, Validators.required],
                secondLevel: [initialValues.xAxis.secondLevel],
                rotateLabels: [initialValues.xAxis.rotateLabels ?? 0]
            }),
            yAxis: this.fb.group({
                title: [initialValues.yAxis.title],
                max: [initialValues.yAxis.max]
            }),
            tooltip: this.fb.group({
                shared: [initialValues.tooltip.shared],
                decimals: [initialValues.tooltip.decimals],
                suffix: [initialValues.tooltip.suffix],
                showTotal: [initialValues.tooltip.showTotal],
                showPercentage: [initialValues.tooltip.showPercentage ?? false]
            }),
            navigator: this.fb.group({
                show: [initialValues.navigator?.show ?? false],
                start: [initialValues.navigator?.start ?? null],
                end: [initialValues.navigator?.end ?? null]
            })
        });

        this.setupAutoUpdate();
        this.setupXAxisSync();
        this.setupTooltipSync();
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
            firstLevelControl.valueChanges.subscribe(val => {
                this.firstLevelValue.set(val);
                if (secondLevelControl && secondLevelControl.value !== null && Number(secondLevelControl.value) === Number(val)) {
                    secondLevelControl.setValue(null);
                }
                // Si el stack coincide con el nuevo primer nivel, lo reseteamos
                if (stackedControl && stackedControl.value !== null && Number(stackedControl.value) === Number(val)) {
                    stackedControl.setValue(null);
                }
            });
        }

        if (secondLevelControl) {
            this.secondLevelValue.set(secondLevelControl.value);
            secondLevelControl.valueChanges.subscribe(val => {
                this.secondLevelValue.set(val);
                // Si el stack coincide con el nuevo segundo nivel, lo reseteamos
                if (stackedControl && stackedControl.value !== null && Number(stackedControl.value) === Number(val)) {
                    stackedControl.setValue(null);
                }
            });
        }
    }

    /**
     * Configura la sincronización del tooltip (ej. habilitar/deshabilitar totales según sea compartido).
     * @private
     */
    private setupTooltipSync() {
        const sharedControl = this.configForm.get('tooltip.shared');
        const showTotalControl = this.configForm.get('tooltip.showTotal');
        const showPercentageControl = this.configForm.get('tooltip.showPercentage');

        if (sharedControl && showTotalControl && showPercentageControl) {
            // Initial state
            if (!sharedControl.value) {
                showTotalControl.disable({ emitEvent: false });
                showTotalControl.setValue(false, { emitEvent: false });
                showPercentageControl.disable({ emitEvent: false });
                showPercentageControl.setValue(false, { emitEvent: false });
            }

            sharedControl.valueChanges.subscribe(shared => {
                if (shared) {
                    showTotalControl.enable();
                    showPercentageControl.enable();
                } else {
                    showTotalControl.disable();
                    showTotalControl.setValue(false);
                    showPercentageControl.disable();
                    showPercentageControl.setValue(false);
                }
            });
        }
    }

    /**
     * Realiza una combinación profunda (deep merge) de dos objetos.
     * @private
     */
    private deepMerge(target: any, source: any): any {
        if (!target) return source;
        if (!source) return target;
        const output = { ...target };
        if (typeof target === 'object' && typeof source === 'object') {
            Object.keys(source).forEach(key => {
                if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    output[key] = source[key];
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
        this.configForm.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
            )
            .subscribe(value => {
                // Realizamos un merge profundo con las opciones actuales para no perder propiedades no editadas (como legends.show)
                const newOptions = this.deepMerge(
                    this.options() || this.configFactory.getDefaultChartOptions(),
                    value
                );
                this.optionsChange.emit(newOptions);
            });
    }

    /**
     * Exporta la configuración actual como un archivo JSON descargable.
     */
    public exportConfig() {
        const config = this.configForm.value;
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        saveAs(blob, `config-chart-${Date.now()}.json`);
    }

    /**
     * Cambia la pestaña activa del editor.
     * @param tab Nombre de la pestaña.
     */
    public onTabChange(tab: string) {
        this.activeTab.set(tab);
    }

    /**
     * Emite un evento para guardar los extremos actuales del navegador.
     */
    public saveExtremes() {
        const fn = this.getExtremesFn();
        if (fn) {
            const extremes = fn();
            if (extremes) {
                this.configForm.patchValue({
                    navigator: {
                        start: extremes.start,
                        end: extremes.end
                    }
                }, { emitEvent: false });
            }
        }
    }

    /**
     * Obtiene las dimensiones disponibles del dataset actual.
     */
    public get dimensions() {
        return this.dataset().dimensions || [];
    }
}
