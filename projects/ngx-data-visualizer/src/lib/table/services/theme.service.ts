import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableTheme } from '../types/table-theme';
import { TableThemes } from '../../types/constants';
import { TableDirective } from '../../directives/table.directive';

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
   * @param tableDirective - Directiva de la tabla específica (opcional)
   */
  setTheme(themeType: ThemeType, tableDirective?: TableDirective): void {
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
    this.applyTheme(newTheme, tableDirective);
  }

  /**
   * Actualiza el tema actual con nuevos valores
   * @param newTheme - Nuevos valores del tema
   * @param tableDirective - Directiva de la tabla específica (opcional)
   */
  updateTheme(newTheme: Partial<TableTheme>, tableDirective?: TableDirective): void {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = { ...currentTheme, ...newTheme };
    this.themeSubject.next(updatedTheme);
    this.applyTheme(updatedTheme, tableDirective);
  }

  /**
   * Aplica el tema actual a las variables CSS
   * @param theme - Tema a aplicar
   * @param tableDirective - Directiva de la tabla específica (opcional)
   */
  private applyTheme(theme: TableTheme, tableDirective?: TableDirective): void {
    if (tableDirective?.tableComponent) {
      // Aplicación específica para una tabla
      const tableElement = tableDirective.tableComponent.getTableElement();
      if (tableElement) {
        const actualTable = tableElement.querySelector('.pvtTable') as HTMLElement;
        if (actualTable) {
          this.applyThemeToElement(actualTable, theme);
          // Notificar al componente que el tema se ha aplicado para re-aplicar sticky
          if (tableDirective.tableComponent.onThemeApplied) {
            tableDirective.tableComponent.onThemeApplied();
          }
        }
      }
    } else {
      // Aplicación global
      this.applyThemeGlobally(theme);
    }
  }

  /**
   * Aplica el tema globalmente a todas las tablas
   * @param theme - Tema a aplicar
   */
  private applyThemeGlobally(theme: TableTheme): void {
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

  /**
   * Aplica el tema directamente a un elemento
   * @param element - Elemento donde aplicar el tema
   * @param theme - Tema a aplicar
   */
  private applyThemeToElement(element: HTMLElement, theme: TableTheme): void {
    element.style.setProperty('--table-hover', theme.tableHover);
    element.style.setProperty('--table-hover-contrast', theme.tableHoverContrast);
    element.style.setProperty('--table-data-bg', theme.tableDataBg);
    element.style.setProperty('--table-label-bg', theme.tableLabelBg);
    element.style.setProperty('--table-axis-label-bg', theme.axisLabelBg);
    element.style.setProperty('--table-text-color', theme.textColor);
    element.style.setProperty('--table-data-text-color', theme.dataTextColor);
    element.style.setProperty('--table-label-text-color', theme.labelTextColor);
    element.style.setProperty('--table-font-size', theme.fontSize);
    element.style.setProperty('--table-header-font-size', theme.headerFontSize);
    element.style.setProperty('--table-line-height', theme.lineHeight);
    element.style.setProperty('--table-cell-padding', theme.padding.cell);
    element.style.setProperty('--table-label-padding', theme.padding.label);
    element.style.setProperty('--table-border-color', theme.border.color);
    element.style.setProperty('--table-border-width', theme.border.width);
    element.style.setProperty('--table-border-style', theme.border.style);
    element.style.setProperty('--table-cell-box-shadow', theme.boxShadow);
  }
} 