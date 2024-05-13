import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

/**
 * This is an service that provides functionality to export an HTML table as an Excel file.
 * It uses the FileSaver library to save the file and the XLSX library to convert the table into an Excel worksheet.
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  /**
   * Export the given HTML table as an Excel file.
   * @param table The HTML table element to export.
   * @param excelFileName The desired name of the Excel file.
   */
  public exportAsExcelFile(table: HTMLElement, excelFileName: string): void {
    const clonedTable = table.cloneNode(true) as HTMLElement;
    this.replaceCharactersInTable(clonedTable, 'pvtVal');
    this.replaceCharactersInTable(clonedTable, 'pvtTotal');
    this.replaceCharactersInTable(clonedTable, 'pvtGrandTotal');

    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(clonedTable, { raw: false });
    const workbook: XLSX.WorkBook = { Sheets: { Datos: worksheet }, SheetNames: ['Datos'] };
    const excelBuffer: BlobPart = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

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
      FileSaver.default.saveAs(data, fileName + EXCEL_EXTENSION);
    } catch (error) {
      console.error('An error occurred while saving the Excel file:', error);
    }
  }
}
