/* eslint-disable @typescript-eslint/no-explicit-any */
import { ECharts, EChartsOption, XAXisComponentOption, YAXisComponentOption } from "echarts";
import { Chart } from "../chart";
import { ChartConfiguration } from "../chart-configuration";
import { EC_AXIS_CONFIG, EC_SERIES_CONFIG } from "./echartsConfigurations";


export class EChart extends Chart {
  public chartInstance!: ECharts;

  override name: string = '';
  override libraryOptions!: EChartsOption;
  override series: any[] = [];

  private totals: any[] = [];
  private suffixSaved: string | null = '';
  private maxValue = 0;

  private savedYAxisMaxValue: number | null = null;

  constructor(public override configuration: ChartConfiguration) {
    super(configuration);
  }

  set instance(instance: ECharts) {
    this.chartInstance = instance;
    (this.libraryOptions.tooltip as any).formatter =
      (params: any) => this.tooltipFormatter(params, this.libraryOptions, this.chartOptions.tooltip.decimals, this.chartOptions.tooltip.suffix);
  }

  get instance(): ECharts {
    return this.chartInstance;
  }

  getOptions() {
    return this.chartInstance?.getOption();
  }

  getSeries(): any[] {
    if (!this.instance || !this.instance.getOption()) {
      return [];
    }
    return this.instance.getOption()["series"] as any[] || [];
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

  expand(): void {
    setTimeout(() => {
      this.chartInstance.getDom().scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  }

  condense(): void {
    this.expand();
  }

  hide(): void { }

  togglePercentMode() {
    this.chartOptions.toPercent = !this.chartOptions.toPercent;
    if (this.chartOptions.toPercent) {
      this.enablePercentMode();
    } else {
      this.disablePercentMode();
    }
    this.render();
  }

  private enablePercentMode() {
    this.ensureStackedSeries();
    this.suffixSaved = this.chartOptions.tooltip.suffix;
    this.chartOptions.tooltip.suffix = '%';
    this.summarizeTotals(this.chartData.getSeries());
    this.saveAndSetYAxisMax(100);
  }

  private disablePercentMode() {
    this.unstackSeriesIfNotStacked();
    this.chartOptions.tooltip.suffix = this.suffixSaved;
    this.restoreYAxisMax();
  }

  private ensureStackedSeries() {
    if (!this.chartData.seriesConfig.stack) {
      this.chartData.seriesConfig.stack = 'stack';
    }
  }

  private unstackSeriesIfNotStacked() {
    if (!this.chartOptions.stacked) {
      this.chartData.seriesConfig.stack = null;
    }
  }

  private saveAndSetYAxisMax(maxValue: number) {
    if (this.chartOptions.yAxis.max) {
      this.savedYAxisMaxValue = this.chartOptions.yAxis.max;
    }
    this.chartOptions.yAxis.max = maxValue;
  }

  private restoreYAxisMax() {
    this.chartOptions.yAxis.max = this.savedYAxisMaxValue;
    this.savedYAxisMaxValue = null;
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
    downloadLink.download = this.chartOptions.title + 'chart.jpg';
    downloadLink.click();
  }

  private resizeChart(width: number, height: number): void {
    this.chartInstance.resize({ width, height });
  }

  render(): void {
    this.generateConfiguration();
    if (this.chartInstance) {
      this.chartInstance.clear();
      this.chartInstance.setOption(this.libraryOptions);
    }
  }

  private generateConfiguration() {
    this.configureSeries(this.chartData.getSeries());
    this.configureAxis();
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

  private configureSeries(series: Array<any>) {
    series.forEach((s, index) => {
      s.type = this.getChartType(this.libraryOptions["type"] as string);
      this.assignSeriesConfig(s);
      s.data = this.processSeriesData(s.data);
      this.ensureSeriesStack(s);
      this.setSeriesVisibility(s);
      this.setSeriesColor(s, index);
    });
    this.libraryOptions.series = series;
  }

  private assignSeriesConfig(s: any) {
    type ObjectKey = keyof typeof EC_SERIES_CONFIG;
    Object.assign(s, EC_SERIES_CONFIG[s.type as ObjectKey]);
  }

  private processSeriesData(data: Array<any>) {
    return data.map((v, i) => {
      this.maxValue = Math.max(this.maxValue, v[1]);

      if (this.chartOptions.type !== 'pie') {
        return this.chartOptions.toPercent ? (v[1] * 100 / this.totals[i]) : v[1];
      } else {
        return this.chartOptions.toPercent
          ? { name: v[0], value: v[1] * 100 / this.totals[i] }
          : { name: v[0], value: v[1] };
      }
    });
  }

  private ensureSeriesStack(s: any) {
    if (!s.stack && this.chartData.seriesConfig.stack) {
      s.stack = this.chartData.seriesConfig.stack;
    }
  }

  private setSeriesVisibility(s: any) {
    s.visible = true;
  }

  private setSeriesColor(s: any, index: number) {
    if (!s.color && s.type !== 'pie' && this.chartOptions.colors) {
      s.color = this.chartOptions.colors[index % this.chartOptions.colors.length];
    }
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
    axisOptions.show = this.chartOptions.type !== 'pie';
    axisOptions.name = isSecondaryAxis ? null : this.chartOptions.xAxis.title;
    axisOptions.nameGap = this.chartOptions.type === 'bar' ? 20 : 35;
    axisOptions.nameLocation = this.chartOptions.type === 'bar' ? 'end' : 'middle';
    axisOptions.nameTextStyle = { fontWeight: 'bold' };
    axisOptions.axisLabel.rotate = this.chartOptions.xAxis.rotateLabels;
    axisOptions.data = data;
    axisOptions.axisTick.show = true;
    axisOptions.splitArea.show = !isSecondaryAxis && !this.chartData.seriesConfig.x2;

    if (isSecondaryAxis) {
      axisOptions.axisLabel.rotate = null;
      axisOptions.splitArea.show = true;
      axisOptions.position = this.chartOptions.type === 'bar' ? 'left' : 'bottom';
      axisOptions.offset = this.chartOptions.type === 'bar' ? 60 : 30;
    }

    return axisOptions;
  }

  private configureAxis() {
    const nameGap = this.calculateNameGap();
    const xAxis: any[] = [];
    const yAxis = this.createYAxis(nameGap);

    if (this.chartData.seriesConfig.x2) {
      this.configureDualXAxis(xAxis, this.chartData.seriesConfig.x1, this.chartData.seriesConfig.x2);
    } else {
      this.configureSingleXAxis(xAxis);
    }

    this.libraryOptions.xAxis = this.chartOptions.type === 'bar' ? yAxis as XAXisComponentOption : xAxis;
    this.libraryOptions.yAxis = this.chartOptions.type === 'bar' ? xAxis : yAxis as YAXisComponentOption;
  }

  private calculateNameGap(): number {
    return Math.max((Math.log(this.maxValue) * Math.LOG10E + 1 | 1) * 10, 30);
  }

  private createYAxis(nameGap: number): any {
    return {
      show: this.chartOptions.type !== 'pie',
      type: 'value',
      name: this.chartOptions.yAxis.title,
      nameLocation: 'middle',
      nameGap: nameGap,
      nameTextStyle: { fontWeight: 'bold' },
      max: this.chartOptions.yAxis.max,
      axisLabel: {
        formatter: (value: string) => this.valueFormatter(value)
      }
    };
  }

  private configureDualXAxis(xAxis: any[], x1: string, x2: string) {
    const items1 = this.chartData.getItems(x1);
    const items2 = this.chartData.getItems(x2);

    const dataX1 = this.createDataX1(items1, items2);
    const dataX2 = this.createDataX2(items1, items2);

    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1));
    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX2, true));

    xAxis[0].nameGap = 70;
    if (this.chartOptions.navigator.show) {
      (this.libraryOptions.grid as any).bottom = 100;
    }
  }

  private createDataX1(items1: any[], items2: any[]): string[] {
    return Array<string>().concat(...new Array(items1.length).fill(items2));
  }

  private createDataX2(items1: any[], items2: any[]): string[] {
    return this.chartOptions.navigator.show
      ? Array<string>().concat(...items1.map(i => new Array(items2.length).fill(i)))
      : items1;
  }

  private configureSingleXAxis(xAxis: any[]) {
    const dataX1 = this.chartData.getItems(this.chartData.seriesConfig.x1);
    xAxis.push(this.configureAxisOptions({ ...EC_AXIS_CONFIG }, dataX1));
  }

  private tooltipFormatter(params: any, options: EChartsOption, decimals?: number | null, suffix?: string | null) {
    const title = this.formatTooltipTitle(params, options);
    const template = Array.isArray(params)
      ? this.formatMultipleParamsTooltip(params, title, options, decimals, suffix)
      : this.formatSingleParamTooltip(params, title, decimals, suffix);

    return template;
  }

  private formatTooltipTitle(params: any, options: EChartsOption): string {
    let title = Array.isArray(params) ? params[0].name : params.name;
    const dataIndex = Array.isArray(params) ? params[0].dataIndex : params.dataIndex;

    if (Array.isArray(options.xAxis) && options.xAxis.length > 1) {
      title = `${(options.xAxis[1] as any).data[Math.floor(dataIndex / ((options.xAxis[0] as any).data.length / (options.xAxis[1] as any).data.length))]} - ${title}`;
    } else if (Array.isArray(options.yAxis) && options.yAxis.length > 1) {
      title = `${(options.yAxis[1] as any).data[Math.floor(dataIndex / ((options.yAxis[0] as any).data.length / (options.yAxis[1] as any).data.length))]} - ${title}`;
    }

    return title;
  }

  private formatSingleParamTooltip(param: any, title: string, decimals?: number | null, suffix?: string | null): string {
    const value = param.value !== null ? this.valueFormatter(param.value, decimals, suffix) : '-';

    return `
        <div class="ec-tooltip">
            <label class="title">${title}</label><br>
            ${param.marker}
            <label class="series-name">${param.seriesName}</label>:<label class="value">${value}</label>
        </div>
    `;
  }

  private formatMultipleParamsTooltip(params: any[], title: string, options: EChartsOption, decimals?: number | null, suffix?: string | null): string {
    let list = params.map(param => (
      `${param.marker}
        <label class="series-name">${param.seriesName}</label>:<label class="value">${param.value !== null ? this.valueFormatter(param.value, decimals, suffix) : '-'}</label>`
    )).join('<br>');

    if ((options.tooltip as any).showTotal) {
      const showTotal = params.reduce((total, param) => total + param.value, 0);
      list += `<hr><label class="summation">Total</label>:<label class="value">${this.valueFormatter(showTotal, decimals, suffix)}</label>`;
    }

    return `
        <div class="ec-tooltip">
            <label class="title">${title}</label><br>
            ${list}
        </div>
    `;
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
