import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  Dataset,
  Dimension,
  Item,
  TableComponent,
  TableOptions,
  ThemeService,
} from 'ngx-data-visualizer';

// Importación directa de los datasets y dimensiones de prueba
import testDataset1d from '../../assets/data/test-dataset-1d.json';
import testDataset2d from '../../assets/data/test-dataset-2d.json';
import testDataset3d from '../../assets/data/test-dataset-3d.json';
import testDataset4d from '../../assets/data/test-dataset-4d.json';
import testDataset5d from '../../assets/data/test-dataset-5d.json';
import testDimensions from '../../assets/data/test-dimensions.json';

@Component({
  selector: 'app-table-cases-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    TableComponent,
  ],
  templateUrl: './table-cases-test.component.html',
  styleUrls: ['./table-cases-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCasesTestComponent {
  // Flag para controlar la visualización del editor nativo integrado
  showEditor = false;

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

  // Configuración por defecto adaptada a la Matriz de Casos para Tablas
  tableConfig: TableOptions = {
    cols: ['Año'],
    rows: ['Sector de gestión'],
    digitsAfterDecimal: 0,
    sorters: [],
    totalRow: true,
    totalCol: true,
    valueDisplay: 'nominal',
  };

  @ViewChild('casesTable', { read: TableComponent })
  tableComponent!: TableComponent;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);

  /**
   * Cambia el dataset activo y reajusta cols/rows en tableConfig
   * de acuerdo con las dimensiones del dataset elegido para evitar errores de renderizado.
   */
  onDatasetChange(datasetId: number): void {
    this.selectedDatasetId = datasetId;
    this.showEditor = false;

    // Resetear los filtros de TODOS los datasets para arrancar limpios
    [this.dataset1, this.dataset2, this.dataset3, this.dataset4, this.dataset5].forEach((ds) => {
      ds.dimensions.forEach((dim: Dimension) => {
        dim.selected = true;
        dim.items.forEach((item: Item) => {
          item.selected = true;
        });
      });
      ds.applyFilters({});
    });

    const datasetMap: Record<number, Dataset> = {
      1: this.dataset1,
      2: this.dataset2,
      3: this.dataset3,
      4: this.dataset4,
      5: this.dataset5,
    };

    this.activeDataset = datasetMap[datasetId] ?? this.dataset2;

    const dimNames = this.activeDataset.dimensions.map((d) => d.name);
    const cols = dimNames.length > 0 ? [dimNames[0]] : [];
    const rows = dimNames.length > 1 ? dimNames.slice(1) : [];

    // Nueva referencia inmutable para que Angular detecte el cambio con OnPush
    this.tableConfig = {
      ...this.tableConfig,
      cols,
      rows,
    };

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
   * Cambia el modo de visualización de los valores de la tabla
   */
  onValueDisplayChange(mode: 'nominal' | 'percentOfTotal' | 'percentOfRow' | 'percentOfColumn'): void {
    this.tableConfig = {
      ...this.tableConfig,
      valueDisplay: mode,
    };
    if (this.tableComponent) {
      this.tableComponent.setValueDisplay(mode);
    }
    this.cdr.markForCheck();
  }



  /**
   * Obtiene la versión en string del objeto tableConfig para mostrarla en la UI
   */
  get tableOptionsJson(): string {
    return JSON.stringify(this.tableConfig, null, 2);
  }

  /**
   * Descarga la configuración activa de la tabla como un archivo JSON estructurado
   */
  downloadJson(): void {
    const filename = 'table-config-cases-test.json';
    const jsonStr = this.tableOptionsJson;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Limpieza
    a.remove();
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

  onDimensionChange(): void {
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
