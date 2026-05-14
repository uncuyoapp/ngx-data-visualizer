import { ECharts } from 'echarts';

/**
 * Interfaz para las dimensiones del gráfico
 */
interface ChartDimensions {
  /** Ancho del gráfico en píxeles */
  width: number;
  /** Alto del gráfico en píxeles */
  height: number;
}

/**
 * Clase administradora encargada de gestionar y ejecutar la exportación del gráfico
 * renderizado por ECharts hacia formatos de archivo como SVG y JPG.
 * Proporciona funcionalidades para manejar el redimensionamiento, la recomposición
 * del layout y la descarga interactiva de los archivos generados en el navegador.
 */
export class ExportManager {
  /** Dimensiones por defecto para exportación SVG */
  private readonly defaultDimensions: ChartDimensions = {
    width: 1000,
    height: 550,
  };

  /** Dimensiones específicas para exportación JPG */
  private readonly jpgDimensions: ChartDimensions = {
    width: 1280,
    height: 720,
  };

  /**
   * Constructor de la clase
   * @param chartInstance - Instancia de ECharts que maneja el gráfico
   */
  constructor(private readonly chartInstance: ECharts) { }

  /**
   * Exporta el gráfico en el formato especificado
   * @param type - Tipo de formato de exportación ('png' o 'jpg')
   * @throws Error si no hay una instancia de gráfico disponible
   */
  export(type: 'png' | 'jpg' = 'png'): void {
    if (!this.chartInstance) {
      throw new Error('No hay una instancia de gráfico disponible');
    }
    this.exportToImage(type);
  }

  /**
   * Exporta el gráfico a un formato de imagen (PNG o JPG)
   * @param type - Formato de imagen ('png' | 'jpg')
   * @private
   */
  private exportToImage(type: 'png' | 'jpg'): void {
    const originalDimensions = this.getOriginalDimensions();
    this.resizeChart(this.jpgDimensions);

    const dataUrl = this.chartInstance.getConnectedDataURL({
      type: type === 'jpg' ? 'jpeg' : 'png',
      pixelRatio: 2,
      backgroundColor: '#FFFFFF',
    });

    this.resizeChart(originalDimensions);
    const fileName = this.getFileName(type);
    this.downloadImage(dataUrl, fileName);
  }

  /**
   * Obtiene el nombre del archivo basado en el título del gráfico
   * @param extension - Extensión del archivo
   * @returns Nombre de archivo formateado
   * @private
   */
  private getFileName(extension: string): string {
    const options = this.chartInstance.getOption() as any;
    // ECharts puede tener title como objeto o array de objetos
    const titleOption = Array.isArray(options.title) ? options.title[0] : options.title;
    const titleText = titleOption?.text || 'grafico';

    // Limpiar el título para usarlo como nombre de archivo
    const safeTitle = titleText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_') // Reemplazar espacios por guiones bajos
      .replace(/[^a-z0-9_]/g, ''); // Eliminar caracteres no alfanuméricos

    return `${safeTitle}.${extension}`;
  }

  /**
   * Obtiene las dimensiones originales del gráfico
   * @returns Objeto con las dimensiones actuales del gráfico
   * @private
   */
  private getOriginalDimensions(): ChartDimensions {
    return {
      width: this.chartInstance.getWidth(),
      height: this.chartInstance.getHeight(),
    };
  }

  /**
   * Redimensiona el gráfico a las dimensiones especificadas
   * @param dimensions - Nuevas dimensiones para el gráfico
   * @private
   */
  private resizeChart(dimensions: ChartDimensions): void {
    this.chartInstance.resize(dimensions);
  }

  /**
   * Descarga la imagen generada como archivo
   * @param dataUrl - URL de datos de la imagen a descargar
   * @param fileName - Nombre del archivo para la descarga
   * @private
   */
  private downloadImage(dataUrl: string, fileName: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    downloadLink.click();
  }
}
