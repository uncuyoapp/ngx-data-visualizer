import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableTheme } from '../types/table-theme';
import { TableThemes } from '../../types/constants';

/**
 * Tipos de temas disponibles
 */
export type ThemeType = 'default' | 'material' | 'bootstrap';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSubject = new BehaviorSubject<TableTheme>(TableThemes.DEFAULT);
  private currentThemeType: ThemeType = 'default';

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  /**
   * Obtiene el tema actual como un Observable
   */
  getTheme(): Observable<TableTheme> {
    return this.themeSubject.asObservable();
  }

  /**
   * Obtiene el valor actual del tema
   */
  getCurrentTheme(): TableTheme {
    return this.themeSubject.value;
  }

  /**
   * Obtiene el tipo de tema actual
   */
  getCurrentThemeType(): ThemeType {
    return this.currentThemeType;
  }

  /**
   * Cambia al tema especificado
   * @param themeType - Tipo de tema a aplicar
   */
  setTheme(themeType: ThemeType): void {
    let newTheme: TableTheme;
    
    switch (themeType) {
      case 'material':
        newTheme = TableThemes.MATERIAL;
        break;
      case 'bootstrap':
        newTheme = TableThemes.BOOTSTRAP;
        break;
      default:
        newTheme = TableThemes.DEFAULT;
    }

    this.currentThemeType = themeType;
    this.themeSubject.next(newTheme);
    this.applyTheme(newTheme);
  }

  /**
   * Actualiza el tema actual con nuevos valores
   */
  updateTheme(newTheme: Partial<TableTheme>): void {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = { ...currentTheme, ...newTheme };
    this.themeSubject.next(updatedTheme);
    this.applyTheme(updatedTheme);
  }

  /**
   * Aplica el tema actual a las variables CSS
   */
  private applyTheme(theme: TableTheme): void {
    const root = document.documentElement;
    
    // Aplicar colores
    root.style.setProperty('--table-hover', theme.tableHover);
    root.style.setProperty('--table-hover-contrast', theme.tableHoverContrast);
    root.style.setProperty('--table-data-bg', theme.tableDataBg);
    root.style.setProperty('--table-label-bg', theme.tableLabelBg);
    root.style.setProperty('--table-axis-label-bg', theme.axisLabelBg);

    // Aplicar colores de texto
    root.style.setProperty('--table-text-color', theme.textColor);
    root.style.setProperty('--table-data-text-color', theme.dataTextColor);
    root.style.setProperty('--table-label-text-color', theme.labelTextColor);

    // Aplicar tamaños
    root.style.setProperty('--table-font-size', theme.fontSize);
    root.style.setProperty('--table-header-font-size', theme.headerFontSize);
    root.style.setProperty('--table-line-height', theme.lineHeight);

    // Aplicar padding
    root.style.setProperty('--table-cell-padding', theme.padding.cell);
    root.style.setProperty('--table-label-padding', theme.padding.label);

    // Aplicar bordes
    root.style.setProperty('--table-border-color', theme.border.color);
    root.style.setProperty('--table-border-width', theme.border.width);
    root.style.setProperty('--table-border-style', theme.border.style);

    // Aplicar sombras
    root.style.setProperty('--table-cell-box-shadow', theme.boxShadow);
  }
} 