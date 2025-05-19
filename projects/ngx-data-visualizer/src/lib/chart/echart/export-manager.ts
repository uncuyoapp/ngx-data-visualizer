import { ECharts } from 'echarts';

/**
 * Interfaz para las dimensiones del gráfico
 */
interface ChartDimensions {
  width: number;
  height: number;
}


/**
 * Clase encargada de manejar la exportación de gráficos ECharts
 */
export class ExportManager {
  private readonly defaultDimensions: ChartDimensions = {
    width: 1000,
    height: 550
  };

  private readonly jpgDimensions: ChartDimensions = {
    width: 1280,
    height: 720
  };

  constructor(private chartInstance: ECharts) {}

  /**
   * Exporta el gráfico en el formato especificado
   */
  export(type: 'svg' | 'jpg'): string | void {
    if (!this.chartInstance) {
      throw new Error('No hay una instancia de gráfico disponible');
    }
    return type === 'svg' ? this.exportToSVG() : this.exportToJPG();
  }

  /**
   * Exporta el gráfico a formato SVG
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
   */
  private getOriginalDimensions(): ChartDimensions {
    return {
      width: this.chartInstance.getWidth(),
      height: this.chartInstance.getHeight(),
    };
  }

  /**
   * Redimensiona el gráfico
   */
  private resizeChart(dimensions: ChartDimensions): void {
    this.chartInstance.resize(dimensions);
  }

  /**
   * Descarga la imagen generada
   */
  private downloadImage(dataUrl: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'chart.jpg';
    downloadLink.click();
  }
}
