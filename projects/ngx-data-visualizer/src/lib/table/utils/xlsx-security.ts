/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';
import { MAX_LENGTH, DANGEROUS_ATTRS } from '../../types/constants';

/**
 * Wrapper seguro para xlsx que implementa medidas de mitigación para las vulnerabilidades conocidas
 * - Mitiga la vulnerabilidad de contaminación de prototipos (Prototype Pollution)
 * - Mitiga la vulnerabilidad de denegación de servicio por expresiones regulares (ReDoS)
 */
export class SecureXLSX {
  /**
   * Sanitiza los datos de entrada para prevenir ataques de contaminación de prototipos
   * @param data Datos a sanitizar
   * @returns Datos sanitizados
   */
  private static sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Si es un objeto o array, procesamos recursivamente
    if (typeof data === 'object') {
      // Si es un array, mapeamos cada elemento
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeData(item));
      }

      // Si es un objeto, procesamos cada propiedad
      const sanitizedData: any = {};
      for (const key of Object.keys(data)) {
        // Evitamos propiedades peligrosas que podrían causar contaminación de prototipos
        if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
          sanitizedData[key] = this.sanitizeData(data[key]);
        }
      }
      return sanitizedData;
    }

    // Para tipos primitivos, los devolvemos sin cambios
    return data;
  }

  /**
   * Valida una cadena para prevenir ataques ReDoS
   * @param str Cadena a validar
   * @returns Cadena validada o una cadena vacía si no es válida
   */
  private static validateString(str: string): string {
    // Limitamos la longitud de la cadena para prevenir ataques ReDoS
    if (typeof str !== 'string') {
      return '';
    }

    // Limitamos la longitud a un valor razonable
    if (str.length > MAX_LENGTH) {
      return str.substring(0, MAX_LENGTH);
    }

    return str;
  }

  /**
   * Sanitiza un elemento HTML para prevenir ataques
   * @param element Elemento HTML a sanitizar
   * @returns Elemento HTML sanitizado
   */
  private static sanitizeHtmlElement(element: HTMLElement): HTMLElement {
    if (!element) {
      return element;
    }

    // Clonamos el elemento para no modificar el original
    const clone = element.cloneNode(true) as HTMLElement;

    // Sanitizamos los atributos y contenido
    this.sanitizeHtmlAttributes(clone);

    return clone;
  }

  /**
   * Sanitiza los atributos de un elemento HTML
   * @param element Elemento HTML a sanitizar
   */
  private static sanitizeHtmlAttributes(element: HTMLElement): void {
    // Eliminamos atributos peligrosos
    for (const attr of DANGEROUS_ATTRS) {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    }

    // Procesamos recursivamente los hijos
    for (let i = 0; i < element.children.length; i++) {
      this.sanitizeHtmlAttributes(element.children[i] as HTMLElement);
    }
  }

  /**
   * Wrapper seguro para XLSX.read
   * @param data Datos a leer
   * @param opts Opciones de lectura
   * @returns Libro de trabajo
   */
  static read(data: any, opts?: any): XLSX.WorkBook {
    // Sanitizamos las opciones
    const safeOpts = this.sanitizeData(opts || {});

    // Para datos binarios, no aplicamos sanitización para evitar corromper los datos
    if (safeOpts.type === 'binary' || safeOpts.type === 'buffer' || safeOpts.type === 'array') {
      return XLSX.read(data, safeOpts);
    }

    // Para otros tipos de datos, aplicamos sanitización
    const safeData = typeof data === 'string' ? this.validateString(data) : this.sanitizeData(data);
    return XLSX.read(safeData, safeOpts);
  }

  /**
   * Wrapper seguro para XLSX.readFile
   * @param filename Nombre del archivo a leer
   * @param opts Opciones de lectura
   * @returns Libro de trabajo
   */
  static readFile(filename: string, opts?: any): XLSX.WorkBook {
    const safeOpts = this.sanitizeData(opts || {});
    return XLSX.readFile(this.validateString(filename), safeOpts);
  }

  /**
   * Wrapper seguro para XLSX.write
   * @param wb Libro de trabajo
   * @param opts Opciones de escritura
   * @returns Resultado de la escritura
   */
  static write(wb: XLSX.WorkBook, opts?: any): any {
    const safeWb = this.sanitizeData(wb);
    const safeOpts = this.sanitizeData(opts || {});
    return XLSX.write(safeWb, safeOpts);
  }

  /**
   * Wrapper seguro para XLSX.writeFile
   * @param wb Libro de trabajo
   * @param filename Nombre del archivo a escribir
   * @param opts Opciones de escritura
   */
  static writeFile(wb: XLSX.WorkBook, filename: string, opts?: any): void {
    const safeWb = this.sanitizeData(wb);
    const safeOpts = this.sanitizeData(opts || {});
    XLSX.writeFile(safeWb, this.validateString(filename), safeOpts);
  }

  /**
   * Wrapper seguro para XLSX.utils.sheet_to_json
   * @param ws Hoja de cálculo
   * @param opts Opciones
   * @returns Datos en formato JSON
   */
  static sheet_to_json<T>(ws: XLSX.WorkSheet, opts?: any): T[] {
    const safeWs = this.sanitizeData(ws);
    const safeOpts = this.sanitizeData(opts || {});
    const result = XLSX.utils.sheet_to_json<T>(safeWs, safeOpts);
    return this.sanitizeData(result);
  }

  /**
   * Wrapper seguro para XLSX.utils.json_to_sheet
   * @param data Datos en formato JSON
   * @param opts Opciones
   * @returns Hoja de cálculo
   */
  static json_to_sheet(data: any[], opts?: any): XLSX.WorkSheet {
    const safeData = this.sanitizeData(data);
    const safeOpts = this.sanitizeData(opts || {});
    return XLSX.utils.json_to_sheet(safeData, safeOpts);
  }

  /**
   * Wrapper seguro para XLSX.utils.table_to_sheet
   * @param table Tabla HTML
   * @param opts Opciones
   * @returns Hoja de cálculo
   */
  static table_to_sheet(table: HTMLElement, opts?: any): XLSX.WorkSheet {
    const safeTable = this.sanitizeHtmlElement(table);
    const safeOpts = this.sanitizeData(opts || {});
    return XLSX.utils.table_to_sheet(safeTable, safeOpts);
  }
}
