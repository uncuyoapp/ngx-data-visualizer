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
 * Clase encargada de manejar la exportación de gráficos ECharts.
 * Proporciona funcionalidades para exportar gráficos en formatos SVG y JPG,
 * manejando el redimensionamiento y la descarga de los archivos generados.
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
  constructor(private readonly chartInstance: ECharts) {}

  /**
   * Exporta el gráfico en el formato especificado
   * @param type - Tipo de formato de exportación ('svg' o 'jpg')
   * @returns URL de datos en formato SVG o void para JPG
   * @throws Error si no hay una instancia de gráfico disponible
   */
  export(type: 'svg' | 'jpg'): string | void {
    if (!this.chartInstance) {
      throw new Error('No hay una instancia de gráfico disponible');
    }
    return type === 'svg' ? this.exportToSVG() : this.exportToJPG();
  }

  /**
   * Exporta el gráfico a formato SVG
   * @returns String con el contenido SVG del gráfico
   * @private
   */
  private exportToSVG(): string {
    const originalDimensions = this.getOriginalDimensions();
    this.resizeChart(this.defaultDimensions);
    const svgDataUrl = this.chartInstance.getConnectedDataURL({
      type: 'svg',
    });
    this.resizeChart(originalDimensions);
    return decodeURIComponent(svgDataUrl.split(',')[1]);
  }

  /**
   * Exporta el gráfico a formato JPG
   * @private
   */
  private exportToJPG(): void {
    const originalDimensions = this.getOriginalDimensions();
    this.resizeChart(this.jpgDimensions);
    const pngDataUrl = this.chartInstance.getConnectedDataURL({
      type: 'jpeg',
      pixelRatio: 2,
      backgroundColor: '#FFFF',
    });
    this.resizeChart(originalDimensions);
    this.downloadImage(pngDataUrl);
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
   * @private
   */
  private downloadImage(dataUrl: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'chart.jpg';
    downloadLink.click();
  }
}
