import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { TableThemes } from "../../types/constants";
import { TableComponent } from "../table.component";
import { TableTheme } from "../types/table-theme";

/**
 * Tipos de temas disponibles
 */
export type ThemeType = "default" | "material" | "bootstrap";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly themeSubject = new BehaviorSubject<TableTheme>(
    TableThemes.DEFAULT,
  );
  private currentThemeType: ThemeType = "default";

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
   * @param tableComponent - Componente de la tabla específica (opcional)
   */
  setTheme(themeType: ThemeType, tableComponent?: TableComponent): void {
    let newTheme: TableTheme;

    switch (themeType) {
      case "material":
        newTheme = TableThemes.MATERIAL;
        break;
      case "bootstrap":
        newTheme = TableThemes.BOOTSTRAP;
        break;
      default:
        newTheme = TableThemes.DEFAULT;
    }

    this.currentThemeType = themeType;
    this.themeSubject.next(newTheme);
    this.applyTheme(newTheme, tableComponent);
  }

  /**
   * Actualiza el tema actual con nuevos valores
   * @param newTheme - Nuevos valores del tema
   * @param tableComponent - Componente de la tabla específica (opcional)
   */
  updateTheme(
    newTheme: Partial<TableTheme>,
    tableComponent?: TableComponent,
  ): void {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = { ...currentTheme, ...newTheme };
    this.themeSubject.next(updatedTheme);
    this.applyTheme(updatedTheme, tableComponent);
  }

  /**
   * Aplica el tema actual a las variables CSS de forma global o a un elemento específico.
   * Determina si la aplicación debe ser global (a todo el documento) o local (a una instancia de tabla).
   * @param theme - El objeto de tema con las variables CSS a aplicar.
   * @param tableComponent - Componente opcional. Si se proporciona, el tema se aplica solo a esa tabla.
   * @private
   */
  private applyTheme(theme: TableTheme, tableComponent?: TableComponent): void {
    if (tableComponent) {
      // Aplicación específica para una tabla
      const tableElement = tableComponent.getTableElement();
      if (tableElement) {
        const actualTable = tableElement.querySelector(
          ".pvtTable",
        ) as HTMLElement;
        if (actualTable) {
          this.applyThemeToElement(actualTable, theme);
          // Notificar al componente que el tema se ha aplicado para re-aplicar sticky
          if (tableComponent.onThemeApplied) {
            tableComponent.onThemeApplied();
          }
        }
      }
    } else {
      // Aplicación global
      this.applyThemeGlobally(theme);
    }
  }

  /**
   * Aplica las variables de un tema de forma global al `document.documentElement`.
   * Esto permite que cualquier tabla en la aplicación herede el tema si no tiene uno específico.
   * @param theme - El objeto de tema a aplicar.
   * @private
   */
  private applyThemeGlobally(theme: TableTheme): void {
    this.applyThemeToTarget(document.documentElement, theme);
  }

  /**
   * Aplica las variables de un tema directamente a un elemento HTML específico.
   * @param element - El elemento HTMLElement al que se le aplicarán los estilos del tema.
   * @param theme - El objeto de tema a aplicar.
   * @private
   */
  private applyThemeToElement(element: HTMLElement, theme: TableTheme): void {
    this.applyThemeToTarget(element, theme);
  }

  /**
   * Método interno para aplicar las propiedades CSS del tema a cualquier elemento objetivo.
   * @param target Elemento objetivo (document.documentElement o un HTMLElement específico)
   * @param theme Objeto con las propiedades del tema
   * @private
   */
  private applyThemeToTarget(target: HTMLElement, theme: TableTheme): void {
    target.style.setProperty("--table-hover", theme.tableHover);
    target.style.setProperty("--table-hover-contrast", theme.tableHoverContrast);
    target.style.setProperty("--table-data-bg", theme.tableDataBg);
    target.style.setProperty("--table-label-bg", theme.tableLabelBg);
    target.style.setProperty("--table-axis-label-bg", theme.axisLabelBg);
    target.style.setProperty("--table-text-color", theme.textColor);
    target.style.setProperty("--table-data-text-color", theme.dataTextColor);
    target.style.setProperty("--table-label-text-color", theme.labelTextColor);
    target.style.setProperty("--table-data-text-align", theme.dataTextAlign);
    target.style.setProperty("--table-font-size", theme.fontSize);
    target.style.setProperty("--table-header-font-size", theme.headerFontSize);
    target.style.setProperty("--table-line-height", theme.lineHeight);
    target.style.setProperty("--table-cell-padding", theme.padding.cell);
    target.style.setProperty("--table-label-padding", theme.padding.label);
    target.style.setProperty("--table-cell-box-shadow", theme.boxShadow);
    target.style.setProperty("--table-border-spacing", theme.borderSpacing);
    target.style.setProperty("--table-border-collapse", theme.borderCollapse);

    target.style.setProperty("--table-border-color", theme.border.color);
    target.style.setProperty("--table-border-width", theme.border.width);
    target.style.setProperty("--table-border-style", theme.border.style);

    target.style.setProperty("--table-label-border-color", theme.labelBorder.color);
    target.style.setProperty("--table-label-border-width", theme.labelBorder.width);
    target.style.setProperty("--table-label-border-style", theme.labelBorder.style);

    target.style.setProperty("--table-data-border-color", theme.dataBorder.color);
    target.style.setProperty("--table-data-border-width", theme.dataBorder.width);
    target.style.setProperty("--table-data-border-style", theme.dataBorder.style);

    target.style.setProperty("--table-label-hover", theme.labelHover);
    target.style.setProperty("--table-label-hover-contrast", theme.labelHoverContrast);
    target.style.setProperty("--table-data-hover", theme.dataHover);
    target.style.setProperty("--table-data-hover-contrast", theme.dataHoverContrast);
    target.style.setProperty("--table-header-hover", theme.headerHover);
    target.style.setProperty("--table-header-hover-contrast", theme.headerHoverContrast);

    target.style.setProperty("--table-label-border-radius", theme.labelBorderRadius);
    target.style.setProperty("--table-data-border-radius", theme.dataBorderRadius);

    target.style.setProperty("--table-label-hover-border-color", theme.labelHoverBorder.color);
    target.style.setProperty("--table-label-hover-border-width", theme.labelHoverBorder.width);
    target.style.setProperty("--table-label-hover-border-style", theme.labelHoverBorder.style);

    target.style.setProperty("--table-data-hover-border-color", theme.dataHoverBorder.color);
    target.style.setProperty("--table-data-hover-border-width", theme.dataHoverBorder.width);
    target.style.setProperty("--table-data-hover-border-style", theme.dataHoverBorder.style);
  }
}
