/* eslint-disable @typescript-eslint/no-explicit-any */
import { ECharts, EChartsOption, XAXisComponentOption, YAXisComponentOption } from "echarts";
import { Chart } from "../chart";
import { ChartConfiguration } from "../chart-configuration";
import { ChartData } from "../chart-data";
import { EC_AXIS_CONFIG, EC_SERIES_CONFIG } from "./echartsConfigurations";


export class EChart extends Chart {
  public chartInstance!: ECharts;

  override name: string = '';
  protected override series: any[] = [];

  private totals: any[] = [];
  private suffixSaved: string | null = '';
  private maxValue = 0;

  private savedYAxisMaxValue: number | null = null;

  constructor(
    public override data: ChartData,
    public override options: EChartsOption,
    public override configuration: ChartConfiguration) {
    super(data, options, configuration);
  }

  set instance(instance: ECharts) {
    this.chartInstance = instance;
    (this.options.tooltip as any).formatter =
      (params: any) => this.tooltipFormatter(params, this.options, this.configuration?.options.tooltip.decimals, this.configuration.options.tooltip.suffix);
  }

  get instance(): ECharts {
    return this.chartInstance;
  }

  setChartData(data: ChartData): void {
    this.data = data;
  }

  setOptions(options: any): void {
    this.chartInstance.setOption(options);
  }

  getSeries(): any[] {
    return this.instance?.getOption()["series"] as any;
  }

  addSeries(series: any): void {
    const currentSeries = this.chartInstance.getOption()["series"] as any[];
    this.chartInstance.setOption({ series: [...currentSeries, series] });
  }

  delSeries(series: any): void {
    const currentSeries = this.chartInstance.getOption()["series"] as any[];
    this.chartInstance.setOption({ series: currentSeries.filter(cs => cs.name != series.name) });
  }

  hoverSeries(series: any): void {
    if (series.hover) {
      this.chartInstance.dispatchAction({ type: 'downplay' });
    } else {
      this.chartInstance.dispatchAction({ type: 'highlight', seriesName: series.name });
    }
    series.hover = !series.hover;
  }

  selectSeries(series: any): void {
    if (series.visible) {
      this.chartInstance.dispatchAction({ type: 'legendUnSelect', name: series.name });
    } else {
      this.chartInstance.dispatchAction({ type: 'legendSelect', name: series.name });
    }
    series.visible = !series.visible;
  }

  getOptions() {
    return this.chartInstance?.getOption();
  }

  expand(): void {
    setTimeout(() => {
      this.chartInstance.getDom().scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }

  condense(): void {
    this.expand();
  }

  hide(): void { }

  toPercentage(): void {
    this.configuration.options.toPercent = !this.configuration.options.toPercent;

    if (this.configuration.options.toPercent) {

      if (!this.data.seriesConfig.stack) {
        this.data.seriesConfig.stack = 'stack';
      }
      this.suffixSaved = this.configuration.options.tooltip.suffix;
      this.configuration.options.tooltip.suffix = '%';
      this.summarizeTotals(this.data.getSeries());

      if (this.configuration.options.yAxis.max) {
        this.savedYAxisMaxValue = this.configuration.options.yAxis.max;
      }
      this.configuration.options.yAxis.max = 100;
    }
    else {
      if (!this.configuration.options.stacked) {
        this.data.seriesConfig.stack = null;
      }
      this.configuration.options.tooltip.suffix = this.suffixSaved;
      this.configuration.options.yAxis.max = this.savedYAxisMaxValue;
      this.savedYAxisMaxValue = null;
    }
    this.render();

  }
  setExtremes(): void {
    throw new Error('Method not implemented.');
  }
  export(type: 'svg' | 'jpg') {
    return type === 'svg' ? this.getSVG() : this.downloadImage();
  }

  private getSVG() {
    const width = this.chartInstance.getWidth();
    const height = this.chartInstance.getHeight();
    this.resizeChart(1000, 550);
    const svgDataUrl = this.chartInstance.getConnectedDataURL({
      type: 'svg',
    });
    this.resizeChart(width, height); //Reset to original size
    return decodeURIComponent(svgDataUrl.split(',')[1]);
  }

  private downloadImage() {
    const width = this.chartInstance.getWidth();
    const height = this.chartInstance.getHeight();
    this.resizeChart(1280, 720);
    // Export chart to PNG
    // this.chartInstance.convertToPixel({ seriesIndex: 0 }, [0, 0]); // This step might be necessary
    const pngDataUrl = this.chartInstance.getConnectedDataURL({
      type: 'jpeg',
      pixelRatio: 2, // Set the pixel ratio (e.g., 2 for higher resolution),
      backgroundColor: '#FFFF'
    });
    this.resizeChart(width, height); //Reset to original size
    const downloadLink = document.createElement('a');
    downloadLink.href = pngDataUrl;
    downloadLink.download = this.configuration.options.title + 'chart.jpg';
    downloadLink.click();
  }

  private resizeChart(width: number, height: number): void {
    this.chartInstance.resize({ width, height });
  }

  render(): void {
    this.generateConfiguration();
    if (this.chartInstance) {
      this.chartInstance.clear();
      this.chartInstance.setOption(this.options);
    }
  }

  private generateConfiguration() {
    this.seriesConfiguration(this.data.getSeries());
    this.axisConfiguration();
  }

  private summarizeTotals(series: Array<any>) {
    this.totals = [];
    series.forEach(s => {
      (s.data as Array<any>).forEach((v, i) => {
        if (!this.totals[i]) {
          this.totals[i] = v[1];
        } else {
          this.totals[i] += v[1];
        }
      });
    });
  }

  private seriesConfiguration(series: Array<any>) {

    series.forEach((s, index) => {
      s.type = this.getChartType(this.options["type"] as string);
      type ObjectKey = keyof typeof EC_SERIES_CONFIG;
      Object.assign(s, EC_SERIES_CONFIG[s.type as ObjectKey]);

      s.data = (s.data as Array<any>).map((v, i) => {
        this.maxValue = v[1] > this.maxValue ? v[1] : this.maxValue;
        if (this.configuration?.options.type !== 'pie') {
          return this.configuration.options.toPercent ? (v[1] * 100 / this.totals[i]) : v[1];
        } else {
          return this.configuration.options.toPercent ? { name: v[0], value: v[1] * 100 / this.totals[i] } : { name: v[0], value: v[1] };
        }
      });

      if (!s.stack && this.data.seriesConfig.stack) {
        s.stack = this.data.seriesConfig.stack;
      }

      s.visible = true;
      
      if (!s.color && s.type !== 'pie' && this.configuration.options.colors) {
        s.color = this.configuration.options.colors[index % this.configuration.options.colors.length];
      }
    });
    this.options.series = series;
  }

  private getChartType(type: string) {
    switch (type) {
      case 'bar':
      case 'column':
        return 'bar';
      case 'area':
      case 'areaspline':
      case 'spline':
        return 'line';
      default:
        return type;
    }
  }


  private configureAxisOptions(axisOptions: any, data: any[], isSecondaryAxis: boolean = false) {
    axisOptions.show = this.configuration.options.type !== 'pie';
    axisOptions.name = isSecondaryAxis ? null : this.configuration.options.xAxis.title;
    axisOptions.nameGap = this.configuration.options.type === 'bar' ? 20 : 35;
    axisOptions.nameLocation = this.configuration.options.type === 'bar' ? 'end' : 'middle';
    axisOptions.nameTextStyle = { fontWeight: 'bold' };
    axisOptions.axisLabel.rotate = this.configuration.options.xAxis.rotateLabels;
    axisOptions.data = data;
    axisOptions.axisTick.show = true;
    axisOptions.splitArea.show = !isSecondaryAxis && !this.data.seriesConfig.x2;

    if (isSecondaryAxis) {
      axisOptions.axisLabel.rotate = null;
      axisOptions.splitArea.show = true;
      axisOptions.position = this.configuration.options.type === 'bar' ? 'left' : 'bottom';
      axisOptions.offset = this.configuration.options.type === 'bar' ? 60 : 30;
    }

    return axisOptions;
  }


  private axisConfiguration() {
    const nameGap = (Math.log(this.maxValue) * Math.LOG10E + 1 | 1) * 10;

    const xAxis = [];
    const yAxis = {
      show: this.configuration.options.type !== 'pie',
      type: 'value',
      name: this.configuration?.options.yAxis.title,
      nameLocation: 'middle',
      nameGap: Math.max(nameGap, 30),
      nameTextStyle: { fontWeight: 'bold' },
      max: this.configuration?.options.yAxis.max,
      axisLabel: {
        formatter: (value: string) => this.valueFormatter(value)
      }
    };

    let dataX1 = [];
    let dataX2 = [];

    if (this.data.seriesConfig.x2) {
      const items1 = this.data.getItems(this.data.seriesConfig.x1);
      const items2 = this.data.getItems(this.data.seriesConfig.x2);

      dataX1 = Array<string>().concat(... new Array(items1.length).fill(items2));
      dataX2 = this.configuration.options.navigator.show ? Array<string>().concat(...items1.map(i => new Array(items2.length).fill(i))) : items1;
      xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1));
      xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX2, true));
      xAxis[0].nameGap = 70;
      if (this.configuration?.options.navigator.show) {
        (this.options.grid as any).bottom = 100;
      }
    } else {
      dataX1 = this.data.getItems(this.data.seriesConfig.x1);
      xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1));
    }
    this.options.xAxis = this.configuration.options.type === 'bar' ? yAxis as XAXisComponentOption : xAxis;
    this.options.yAxis = this.configuration.options.type === 'bar' ? xAxis : yAxis as YAXisComponentOption;
  }


  private tooltipFormatter(params: any, options: EChartsOption, decimals?: number | null, suffix?: string | null) {
    let template = '';
    let title = Array.isArray(params) ? params[0].name : params.name;
    const dataIndex = Array.isArray(params) ? params[0].dataIndex : params.dataIndex;

    if (Array.isArray(options.xAxis) && options.xAxis.length > 1) {
      title = (options.xAxis[1] as any).data[Math.floor(dataIndex / ((options.xAxis[0] as any).data.length / (options.xAxis[1] as any).data.length))] + ' - ' + title;
    } else if (Array.isArray(options.yAxis) && options.yAxis.length > 1) {
      title = (options.yAxis[1] as any).data[Math.floor(dataIndex / ((options.yAxis[0] as any).data.length / (options.yAxis[1] as any).data.length))] + ' - ' + title;
    }

    if (!Array.isArray(params)) {
      template = `
      <div class="ec-tooltip">
        <label class="title">${title}</label><br>
        ${params.marker}
        <label class="serie-name">${params.seriesName}</label>:<label class="value">${params.value !== null ? this.valueFormatter(params.value, decimals, suffix) : '-'}</label>
      </div>
      `;
    } else {

      let list = params.map(params => (
        `${params.marker}
        <label class="serie-name">${params.seriesName}</label>:<label class="value">${params.value !== null ? this.valueFormatter(params.value, decimals, suffix) : '-'}</label>`
      )).join('<br>');

      if ((options.tooltip as any).showTotal) {
        const showTotal = params.map(params => params.value).reduce((a, c) => a + c, 0);
        list += `<hr><label class="summation">Total</label>:<label class="value">${this.valueFormatter(showTotal, decimals, suffix)}</label>`;
      }

      template = `
      <div class="ec-tooltip">
        <label class="title">${title}</label><br>
        ${list}
      </div>
      `;
    }
    return template;
  }

  private valueFormatter(value: string, decimals?: number | null, suffix?: string | null) {
    if (!value) {
      return '-';
    }
    const returnValue = decimals !== null ? parseFloat('' + value).toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true
    }) : parseFloat(value).toLocaleString('es-AR', {
      useGrouping: true
    });
    return suffix ? returnValue + ' ' + suffix : returnValue;
  }
}
