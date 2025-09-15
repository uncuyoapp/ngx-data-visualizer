import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { TableTheme } from "../types/table-theme";
import { TableThemes } from "../../types/constants";
import { TableDirective } from "../../directives/table.directive";

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
   * @param tableDirective - Directiva de la tabla específica (opcional)
   */
  setTheme(themeType: ThemeType, tableDirective?: TableDirective): void {
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
    this.applyTheme(newTheme, tableDirective);
  }

  /**
   * Actualiza el tema actual con nuevos valores
   * @param newTheme - Nuevos valores del tema
   * @param tableDirective - Directiva de la tabla específica (opcional)
   */
  updateTheme(
    newTheme: Partial<TableTheme>,
    tableDirective?: TableDirective,
  ): void {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = { ...currentTheme, ...newTheme };
    this.themeSubject.next(updatedTheme);
    this.applyTheme(updatedTheme, tableDirective);
  }

  /**
   * Aplica el tema actual a las variables CSS de forma global o a un elemento específico.
   * Determina si la aplicación debe ser global (a todo el documento) o local (a una instancia de tabla).
   * @param theme - El objeto de tema con las variables CSS a aplicar.
   * @param tableDirective - Directiva opcional. Si se proporciona, el tema se aplica solo a esa tabla.
   * @private
   */
  private applyTheme(theme: TableTheme, tableDirective?: TableDirective): void {
    if (tableDirective?.tableComponent) {
      // Aplicación específica para una tabla
      const tableElement = tableDirective.tableComponent.getTableElement();
      if (tableElement) {
        const actualTable = tableElement.querySelector(
          ".pvtTable",
        ) as HTMLElement;
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
   * Aplica las variables de un tema de forma global al `document.documentElement`.
   * Esto permite que cualquier tabla en la aplicación herede el tema si no tiene uno específico.
   * @param theme - El objeto de tema a aplicar.
   * @private
   */
  private applyThemeGlobally(theme: TableTheme): void {
    const root = document.documentElement;

    // Aplicar colores
    root.style.setProperty("--table-hover", theme.tableHover);
    root.style.setProperty("--table-hover-contrast", theme.tableHoverContrast);
    root.style.setProperty("--table-data-bg", theme.tableDataBg);
    root.style.setProperty("--table-label-bg", theme.tableLabelBg);
    root.style.setProperty("--table-axis-label-bg", theme.axisLabelBg);

    // Aplicar colores de texto
    root.style.setProperty("--table-text-color", theme.textColor);
    root.style.setProperty("--table-data-text-color", theme.dataTextColor);
    root.style.setProperty("--table-label-text-color", theme.labelTextColor);

    // Aplicar alineación de texto
    root.style.setProperty("--table-data-text-align", theme.dataTextAlign);

    // Aplicar tamaños
    root.style.setProperty("--table-font-size", theme.fontSize);
    root.style.setProperty("--table-header-font-size", theme.headerFontSize);
    root.style.setProperty("--table-line-height", theme.lineHeight);

    // Aplicar padding
    root.style.setProperty("--table-cell-padding", theme.padding.cell);
    root.style.setProperty("--table-label-padding", theme.padding.label);

    // Aplicar sombras
    root.style.setProperty("--table-cell-box-shadow", theme.boxShadow);
    root.style.setProperty("--table-border-spacing", theme.borderSpacing);
    root.style.setProperty("--table-border-collapse", theme.borderCollapse);

    // Bordes para etiquetas
    // Aplicar bordes generales
    root.style.setProperty("--table-border-color", theme.border.color);
    root.style.setProperty("--table-border-width", theme.border.width);
    root.style.setProperty("--table-border-style", theme.border.style);

    // Aplicar bordes para etiquetas
    root.style.setProperty(
      "--table-label-border-color",
      theme.labelBorder.color,
    );
    root.style.setProperty(
      "--table-label-border-width",
      theme.labelBorder.width,
    );
    root.style.setProperty(
      "--table-label-border-style",
      theme.labelBorder.style,
    );
    // Bordes para datos
    root.style.setProperty("--table-data-border-color", theme.dataBorder.color);
    root.style.setProperty("--table-data-border-width", theme.dataBorder.width);
    root.style.setProperty("--table-data-border-style", theme.dataBorder.style);
    // Colores de hover separados
    root.style.setProperty("--table-label-hover", theme.labelHover);
    root.style.setProperty(
      "--table-label-hover-contrast",
      theme.labelHoverContrast,
    );
    root.style.setProperty("--table-data-hover", theme.dataHover);
    root.style.setProperty(
      "--table-data-hover-contrast",
      theme.dataHoverContrast,
    );
    root.style.setProperty("--table-header-hover", theme.headerHover);
    root.style.setProperty(
      "--table-header-hover-contrast",
      theme.headerHoverContrast,
    );
    // Border radius separados
    root.style.setProperty(
      "--table-label-border-radius",
      theme.labelBorderRadius,
    );
    root.style.setProperty(
      "--table-data-border-radius",
      theme.dataBorderRadius,
    );
    // Bordes hover para etiquetas
    root.style.setProperty(
      "--table-label-hover-border-color",
      theme.labelHoverBorder.color,
    );
    root.style.setProperty(
      "--table-label-hover-border-width",
      theme.labelHoverBorder.width,
    );
    root.style.setProperty(
      "--table-label-hover-border-style",
      theme.labelHoverBorder.style,
    );
    // Bordes hover para datos
    root.style.setProperty(
      "--table-data-hover-border-color",
      theme.dataHoverBorder.color,
    );
    root.style.setProperty(
      "--table-data-hover-border-width",
      theme.dataHoverBorder.width,
    );
    root.style.setProperty(
      "--table-data-hover-border-style",
      theme.dataHoverBorder.style,
    );
  }

  /**
   * Aplica las variables de un tema directamente a un elemento HTML específico.
   * @param element - El elemento HTMLElement al que se le aplicarán los estilos del tema.
   * @param theme - El objeto de tema a aplicar.
   * @private
   */
  private applyThemeToElement(element: HTMLElement, theme: TableTheme): void {
    element.style.setProperty("--table-hover", theme.tableHover);
    element.style.setProperty(
      "--table-hover-contrast",
      theme.tableHoverContrast,
    );
    element.style.setProperty("--table-data-bg", theme.tableDataBg);
    element.style.setProperty("--table-label-bg", theme.tableLabelBg);
    element.style.setProperty("--table-axis-label-bg", theme.axisLabelBg);
    element.style.setProperty("--table-text-color", theme.textColor);
    element.style.setProperty("--table-data-text-color", theme.dataTextColor);
    element.style.setProperty("--table-label-text-color", theme.labelTextColor);
    element.style.setProperty("--table-data-text-align", theme.dataTextAlign);
    element.style.setProperty("--table-font-size", theme.fontSize);
    element.style.setProperty("--table-header-font-size", theme.headerFontSize);
    element.style.setProperty("--table-line-height", theme.lineHeight);
    element.style.setProperty("--table-cell-padding", theme.padding.cell);
    element.style.setProperty("--table-label-padding", theme.padding.label);
    element.style.setProperty("--table-cell-box-shadow", theme.boxShadow);
    element.style.setProperty("--table-border-spacing", theme.borderSpacing);
    element.style.setProperty("--table-border-collapse", theme.borderCollapse);

    // Bordes generales
    element.style.setProperty("--table-border-color", theme.border.color);
    element.style.setProperty("--table-border-width", theme.border.width);
    element.style.setProperty("--table-border-style", theme.border.style);

    // Bordes para etiquetas
    element.style.setProperty(
      "--table-label-border-color",
      theme.labelBorder.color,
    );
    element.style.setProperty(
      "--table-label-border-width",
      theme.labelBorder.width,
    );
    element.style.setProperty(
      "--table-label-border-style",
      theme.labelBorder.style,
    );
    // Bordes para datos
    element.style.setProperty(
      "--table-data-border-color",
      theme.dataBorder.color,
    );
    element.style.setProperty(
      "--table-data-border-width",
      theme.dataBorder.width,
    );
    element.style.setProperty(
      "--table-data-border-style",
      theme.dataBorder.style,
    );
    // Colores de hover separados
    element.style.setProperty("--table-label-hover", theme.labelHover);
    element.style.setProperty(
      "--table-label-hover-contrast",
      theme.labelHoverContrast,
    );
    element.style.setProperty("--table-data-hover", theme.dataHover);
    element.style.setProperty(
      "--table-data-hover-contrast",
      theme.dataHoverContrast,
    );
    element.style.setProperty("--table-header-hover", theme.headerHover);
    element.style.setProperty(
      "--table-header-hover-contrast",
      theme.headerHoverContrast,
    );
    // Border radius separados
    element.style.setProperty(
      "--table-label-border-radius",
      theme.labelBorderRadius,
    );
    element.style.setProperty(
      "--table-data-border-radius",
      theme.dataBorderRadius,
    );
    // Bordes hover para etiquetas
    element.style.setProperty(
      "--table-label-hover-border-color",
      theme.labelHoverBorder.color,
    );
    element.style.setProperty(
      "--table-label-hover-border-width",
      theme.labelHoverBorder.width,
    );
    element.style.setProperty(
      "--table-label-hover-border-style",
      theme.labelHoverBorder.style,
    );
    // Bordes hover para datos
    element.style.setProperty(
      "--table-data-hover-border-color",
      theme.dataHoverBorder.color,
    );
    element.style.setProperty(
      "--table-data-hover-border-width",
      theme.dataHoverBorder.width,
    );
    element.style.setProperty(
      "--table-data-hover-border-style",
      theme.dataHoverBorder.style,
    );
  }
}
