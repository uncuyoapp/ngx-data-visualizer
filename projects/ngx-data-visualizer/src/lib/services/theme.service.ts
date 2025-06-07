import { Injectable } from '@angular/core';

export interface TableTheme {
  // Colores principales
  tableHover: string;
  tableHoverContrast: string;
  tableBody: string;
  legendShow: string;

  // Tamaños y espaciado
  fontSize: string;
  headerFontSize: string;
  lineHeight: string;
  padding: {
    cell: string;
    label: string;
    rowLabel: string;
    colLabel: string;
  };

  // Colores de fondo y bordes
  backgroundColor: {
    header: string;
    label: string;
    corner: string;
    axisLabel: string;
  };

  // Bordes y sombras
  border: {
    color: string;
    width: string;
    style: string;
  };

  shadow: {
    color: string;
    offset: string;
    blur: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly rootElement: HTMLElement;

  constructor() {
    this.rootElement = document.documentElement;
  }

  /**
   * Configura el tema de la tabla con los colores y estilos proporcionados
   * @param theme - Objeto con la configuración de estilos
   */
  setTableTheme(theme: Partial<TableTheme>): void {
    // Colores principales
    if (theme.tableHover) {
      this.rootElement.style.setProperty('--table-hover', theme.tableHover);
    }
    if (theme.tableHoverContrast) {
      this.rootElement.style.setProperty('--table-hover-contrast', theme.tableHoverContrast);
    }
    if (theme.tableBody) {
      this.rootElement.style.setProperty('--table-body', theme.tableBody);
    }
    if (theme.legendShow) {
      this.rootElement.style.setProperty('--legend-show', theme.legendShow);
    }

    // Tamaños y espaciado
    if (theme.fontSize) {
      this.rootElement.style.setProperty('--table-font-size', theme.fontSize);
    }
    if (theme.headerFontSize) {
      this.rootElement.style.setProperty('--table-header-font-size', theme.headerFontSize);
    }
    if (theme.lineHeight) {
      this.rootElement.style.setProperty('--table-line-height', theme.lineHeight);
    }
    if (theme.padding) {
      if (theme.padding.cell) {
        this.rootElement.style.setProperty('--table-cell-padding', theme.padding.cell);
      }
      if (theme.padding.label) {
        this.rootElement.style.setProperty('--table-label-padding', theme.padding.label);
      }
      if (theme.padding.rowLabel) {
        this.rootElement.style.setProperty('--table-row-label-padding', theme.padding.rowLabel);
      }
      if (theme.padding.colLabel) {
        this.rootElement.style.setProperty('--table-col-label-padding', theme.padding.colLabel);
      }
    }

    // Colores de fondo
    if (theme.backgroundColor) {
      if (theme.backgroundColor.header) {
        this.rootElement.style.setProperty('--table-header-bg', theme.backgroundColor.header);
      }
      if (theme.backgroundColor.label) {
        this.rootElement.style.setProperty('--table-label-bg', theme.backgroundColor.label);
      }
      if (theme.backgroundColor.corner) {
        this.rootElement.style.setProperty('--table-corner-bg', theme.backgroundColor.corner);
      }
      if (theme.backgroundColor.axisLabel) {
        this.rootElement.style.setProperty('--table-axis-label-bg', theme.backgroundColor.axisLabel);
      }
    }

    // Bordes
    if (theme.border) {
      if (theme.border.color) {
        this.rootElement.style.setProperty('--table-border-color', theme.border.color);
      }
      if (theme.border.width) {
        this.rootElement.style.setProperty('--table-border-width', theme.border.width);
      }
      if (theme.border.style) {
        this.rootElement.style.setProperty('--table-border-style', theme.border.style);
      }
    }

    // Sombras
    if (theme.shadow) {
      if (theme.shadow.color) {
        this.rootElement.style.setProperty('--table-shadow-color', theme.shadow.color);
      }
      if (theme.shadow.offset) {
        this.rootElement.style.setProperty('--table-shadow-offset', theme.shadow.offset);
      }
      if (theme.shadow.blur) {
        this.rootElement.style.setProperty('--table-shadow-blur', theme.shadow.blur);
      }
    }
  }

  /**
   * Restaura los valores por defecto del tema
   */
  resetTableTheme(): void {
    // Colores principales
    this.rootElement.style.removeProperty('--table-hover');
    this.rootElement.style.removeProperty('--table-hover-contrast');
    this.rootElement.style.removeProperty('--table-body');
    this.rootElement.style.removeProperty('--legend-show');

    // Tamaños y espaciado
    this.rootElement.style.removeProperty('--table-font-size');
    this.rootElement.style.removeProperty('--table-header-font-size');
    this.rootElement.style.removeProperty('--table-line-height');
    this.rootElement.style.removeProperty('--table-cell-padding');
    this.rootElement.style.removeProperty('--table-label-padding');
    this.rootElement.style.removeProperty('--table-row-label-padding');
    this.rootElement.style.removeProperty('--table-col-label-padding');

    // Colores de fondo
    this.rootElement.style.removeProperty('--table-header-bg');
    this.rootElement.style.removeProperty('--table-label-bg');
    this.rootElement.style.removeProperty('--table-corner-bg');
    this.rootElement.style.removeProperty('--table-axis-label-bg');

    // Bordes
    this.rootElement.style.removeProperty('--table-border-color');
    this.rootElement.style.removeProperty('--table-border-width');
    this.rootElement.style.removeProperty('--table-border-style');

    // Sombras
    this.rootElement.style.removeProperty('--table-shadow-color');
    this.rootElement.style.removeProperty('--table-shadow-offset');
    this.rootElement.style.removeProperty('--table-shadow-blur');
  }
} 