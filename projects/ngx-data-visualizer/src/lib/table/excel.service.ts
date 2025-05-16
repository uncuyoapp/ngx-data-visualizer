import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { SecureXLSX } from '../utils/xlsx-security';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

/**
 * Servicio que proporciona funcionalidad para exportar una tabla HTML a un archivo de Excel.
 * Utiliza la biblioteca FileSaver para guardar el archivo y el wrapper SecureXLSX para convertir
 * de manera segura la tabla en una hoja de cálculo de Excel, mitigando vulnerabilidades conocidas
 * en la biblioteca XLSX.
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  /**
   * Exporta la tabla HTML proporcionada como un archivo de Excel.
   * @param table Elemento HTML de la tabla a exportar.
   * @param excelFileName Nombre deseado para el archivo de Excel.
   */
  public exportAsExcelFile(table: HTMLElement, excelFileName: string): void {
    const clonedTable = table.cloneNode(true) as HTMLElement;
    this.replaceCharactersInTable(clonedTable, 'pvtVal');
    this.replaceCharactersInTable(clonedTable, 'pvtTotal');
    this.replaceCharactersInTable(clonedTable, 'pvtGrandTotal');

    // Usar el wrapper seguro SecureXLSX en lugar de XLSX directamente
    const worksheet: XLSX.WorkSheet = SecureXLSX.table_to_sheet(clonedTable, { raw: false });
    const workbook: XLSX.WorkBook = { Sheets: { Datos: worksheet }, SheetNames: ['Datos'] };
    const excelBuffer: BlobPart = SecureXLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private replaceCharactersInTable(table: HTMLElement, className: string): void {
    const elements = table.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      elements[i].innerHTML = this.processCellContent(elements[i].innerHTML);
    }
  }

  private processCellContent(cellContent: string): string {
    return cellContent.replace(/,/g, '-').split('.').join('').replace(/-/g, '.');
  }

  private saveAsExcelFile(buffer: BlobPart, fileName: string): void {
    try {
      const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
      saveAs(data, fileName + EXCEL_EXTENSION);
    } catch (error) {
      console.error('Ocurrió un error al guardar el archivo Excel:', error);
    }
  }
}
