import { ECharts } from 'echarts';

/**
 * @description Interfaz para definir las dimensiones de renderizado del gráfico.
 */
interface ChartDimensions {
  /** @description Ancho del gráfico en píxeles. */
  width: number;
  /** @description Alto del gráfico en píxeles. */
  height: number;
}

/**
 * @description
 * Clase administradora encargada de gestionar y ejecutar la exportación del gráfico
 * renderizado por ECharts hacia formatos de archivo de imagen como PNG y JPG.
 * Proporciona funcionalidades para manejar el redimensionamiento temporal, la recomposición
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
   * @description Crea la instancia del gestor de exportación de ECharts.
   * @param chartInstance - Referencia a la instancia de renderizado nativa de ECharts.
   */
  constructor(private readonly chartInstance: ECharts) { }

  /**
   * @description Exporta el gráfico actual en el formato de imagen especificado.
   * @param type - Tipo de formato de exportación de imagen ('png' o 'jpg', por defecto 'png').
   * @throws {Error} Si no hay una instancia de gráfico disponible.
   * @public
   */
  export(type: 'png' | 'jpg' = 'png'): void {
    if (!this.chartInstance) {
      throw new Error('No hay una instancia de gráfico disponible');
    }
    this.exportToImage(type);
  }

  /**
   * @description Exporta el gráfico a un formato de imagen realizando el redimensionamiento y descarga.
   * @param type - Formato de imagen deseado ('png' o 'jpg').
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
   * @description Obtiene un nombre de archivo seguro basado en el título configurado en el gráfico.
   * @param extension - Extensión del archivo objetivo (ej: 'png', 'jpg').
   * @returns Nombre de archivo formateado y sanitizado.
   * @private
   */
  private getFileName(extension: string): string {
    const options = (this.chartInstance.getOption() || {}) as Record<string, unknown>;
    // ECharts puede tener title como objeto o array de objetos
    const titleOption = Array.isArray(options['title'])
      ? (options['title'] as Record<string, unknown>[])[0]
      : (options['title'] as Record<string, unknown>);
    const titleText = (titleOption?.['text'] as string) || 'grafico';

    // Limpiar el título para usarlo como nombre de archivo
    const safeTitle = titleText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_') // Reemplazar espacios por guiones bajos
      .replace(/[^a-z0-9_]/g, ''); // Eliminar caracteres no alfanuméricos

    return `${safeTitle}.${extension}`;
  }

  /**
   * @description Obtiene las dimensiones actuales del lienzo del gráfico antes de exportar.
   * @returns Objeto de tipo ChartDimensions con el ancho y alto en píxeles.
   * @private
   */
  private getOriginalDimensions(): ChartDimensions {
    return {
      width: this.chartInstance.getWidth(),
      height: this.chartInstance.getHeight(),
    };
  }

  /**
   * @description Redimensiona temporalmente el lienzo del gráfico a las dimensiones especificadas.
   * @param dimensions - Nuevas dimensiones a aplicar al lienzo.
   * @private
   */
  private resizeChart(dimensions: ChartDimensions): void {
    this.chartInstance.resize(dimensions);
  }

  /**
   * @description Descarga la imagen generada como archivo en el navegador del usuario.
   * @param dataUrl - URL de datos codificada en base64 de la imagen.
   * @param fileName - Nombre asignado al archivo descargado.
   * @private
   */
  private downloadImage(dataUrl: string, fileName: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    downloadLink.click();
  }
}
