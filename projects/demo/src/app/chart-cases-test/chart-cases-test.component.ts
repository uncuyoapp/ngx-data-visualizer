import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  ChartComponent,
  ChartOptions,
  Dataset,
  Dimension,
  Item,
} from 'ngx-data-visualizer';

// Importación directa de los datasets y dimensiones de prueba
import testDataset1d from '../../assets/data/test-dataset-1d.json';
import testDataset2d from '../../assets/data/test-dataset-2d.json';
import testDataset3d from '../../assets/data/test-dataset-3d.json';
import testDataset4d from '../../assets/data/test-dataset-4d.json';
import testDataset5d from '../../assets/data/test-dataset-5d.json';
import testDimensions from '../../assets/data/test-dimensions.json';

@Component({
  selector: 'app-chart-cases-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    ChartComponent,
  ],
  templateUrl: './chart-cases-test.component.html',
  styleUrls: ['./chart-cases-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCasesTestComponent {
  // Flag para controlar la visualización del editor nativo integrado
  showEditor = false;

  // Flag para saber si la vista porcentual está activa
  isPercentActive = false;

  // Datasets tipados e instanciados
  dataset1 = new Dataset({
    id: 1,
    rowData: testDataset1d,
    dimensions: (testDimensions as Dimension[]).filter((d) => d.id === 0),
    enableRollUp: true,
  });

  dataset2 = new Dataset({
    id: 2,
    rowData: testDataset2d,
    dimensions: (testDimensions as Dimension[]).filter(
      (d) => d.id === 0 || d.id === 54,
    ),
    enableRollUp: true,
  });

  dataset3 = new Dataset({
    id: 3,
    rowData: testDataset3d,
    dimensions: (testDimensions as Dimension[]).filter(
      (d) => d.id === 0 || d.id === 54 || d.id === 12,
    ),
    enableRollUp: true,
  });

  dataset4 = new Dataset({
    id: 4,
    rowData: testDataset4d,
    dimensions: (testDimensions as Dimension[]).filter(
      (d) => d.id === 0 || d.id === 54 || d.id === 12 || d.id === 117,
    ),
    enableRollUp: true,
  });

  dataset5 = new Dataset({
    id: 5,
    rowData: testDataset5d,
    dimensions: testDimensions as Dimension[],
    enableRollUp: true,
  });

  // Selector del dataset activo
  selectedDatasetId = 2; // dataset2 (2D) por defecto
  activeDataset = this.dataset2;

  // Configuración por defecto adaptada a la Matriz de Casos
  chartConfig: ChartOptions = {
    type: 'column',
    title: 'Distribución de Prueba de Combinaciones',
    stacked: null,
    xAxis: {
      rotateLabels: null,
      firstLevel: 0, // Año
      secondLevel: null,
    },
    yAxis: {
      title: 'Cantidad / Valor Nominal',
      max: null,
    },
    tooltip: {
      shared: false,
      decimals: 0,
      suffix: null,
      format: null,
      showTotal: false,
    },
    legends: {
      enabled: false,
      show: false,
      position: 'bottom',
    },
    navigator: {
      show: false,
      start: null,
      end: null,
    },
    colors: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#673ab7', '#e91e63'],
    width: null,
    height: 420,
    filterLastYear: false,
    showYearsLegend: false,
    toPercent: false,
    measureUnit: 'unidades',
    isPreview: false,
    disableAutoUpdate: false,
  };

  @ViewChild('casesChart', { read: ChartComponent })
  chartComponent!: ChartComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  /**
   * Cambia el dataset activo y reajusta firstLevel/secondLevel en chartOptions
   * de acuerdo con las dimensiones del dataset elegido para evitar errores de renderizado.
   */
  onDatasetChange(datasetId: number): void {
    this.selectedDatasetId = datasetId;
    this.showEditor = false;

    // Resetear los filtros de TODOS los datasets para arrancar limpios
    [this.dataset1, this.dataset2, this.dataset3, this.dataset4, this.dataset5].forEach(ds => {
      ds.dimensions.forEach((dim: Dimension) => {
        dim.selected = true;
        dim.items.forEach((item: Item) => {
          item.selected = true;
        });
      });
      ds.applyFilters({});
    });

    switch (datasetId) {
      case 1:
        this.activeDataset = this.dataset1;
        this.chartConfig.xAxis.firstLevel = 0;
        this.chartConfig.xAxis.secondLevel = null;
        this.chartConfig.stacked = null;
        break;
      case 2:
        this.activeDataset = this.dataset2;
        this.chartConfig.xAxis.firstLevel = 0;
        this.chartConfig.xAxis.secondLevel = null;
        break;
      case 3:
        this.activeDataset = this.dataset3;
        this.chartConfig.xAxis.firstLevel = 0;
        this.chartConfig.xAxis.secondLevel = null;
        break;
      case 4:
        this.activeDataset = this.dataset4;
        this.chartConfig.xAxis.firstLevel = 0;
        this.chartConfig.xAxis.secondLevel = null;
        break;
      case 5:
        this.activeDataset = this.dataset5;
        this.chartConfig.xAxis.firstLevel = 0;
        this.chartConfig.xAxis.secondLevel = null;
        break;
    }

    this.cdr.markForCheck();
  }

  /**
   * Alterna el estado del panel de configuración integrado
   */
  toggleEditor(): void {
    this.showEditor = !this.showEditor;
    this.cdr.markForCheck();
  }

  /**
   * Alterna entre visualización de valores nominales y porcentajes
   */
  togglePercentView(): void {
    this.isPercentActive = !this.isPercentActive;
    if (this.chartComponent) {
      this.chartComponent.toPercentage();
    }
    this.cdr.markForCheck();
  }

  /**
   * Obtiene la versión en string del objeto chartOptions para mostrarla en la UI
   */
  get chartOptionsJson(): string {
    return JSON.stringify(this.chartConfig, null, 2);
  }

  /**
   * Descarga la configuración activa del gráfico como un archivo JSON estructurado
   */
  downloadJson(): void {
    const filename = 'chart-config-cases-test.json';
    const jsonStr = this.chartOptionsJson;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Limpieza
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // ============================================
  // LÓGICA DE FILTRADO Y AGRUPAMIENTO
  // ============================================

  collapsedDimensions: { [key: string]: boolean } = {};

  filter(): void {
    const filtersConfig = {
      rollUp: this.activeDataset.dimensions
        .filter((dimension) => !dimension.selected)
        .map((dimension) => dimension.id),
      filter: this.activeDataset.dimensions.map((dimension) => ({
        name: dimension.id,
        items: dimension.items
          .filter((item) => item.selected)
          .map((item) => item.name),
      })),
    };
    this.activeDataset.applyFilters(filtersConfig);
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.activeDataset.dimensions.forEach((dimension: Dimension) => {
      dimension.selected = true;
      dimension.items.forEach((item: Item) => {
        item.selected = true;
      });
    });
    this.activeDataset.applyFilters({});
    this.cdr.markForCheck();
  }

  onDimensionChange(dimension: Dimension): void {
    const selectedDimensions = this.activeDataset.dimensions.filter(
      (d) => d.selected,
    );

    if (selectedDimensions.length === 0) {
      dimension.selected = true;
      return;
    }

    this.filter();
  }

  onItemChange(): void {
    this.filter();
  }

  toggleAllItems(dimension: Dimension, selectAll: boolean): void {
    dimension.items.forEach((item: Item) => {
      item.selected = selectAll;
    });
    this.filter();
  }

  areAllItemsSelected(dimension: Dimension): boolean {
    return (
      dimension.items.length > 0 &&
      dimension.items.every((item) => item.selected)
    );
  }

  toggleDimensionItems(dimension: Dimension): void {
    const id = dimension.id.toString();
    const current = this.collapsedDimensions[id] ?? true;
    this.collapsedDimensions[id] = !current;
    this.cdr.markForCheck();
  }

  isDimensionCollapsed(dimensionId: string): boolean {
    return this.collapsedDimensions[dimensionId] ?? true;
  }
}
