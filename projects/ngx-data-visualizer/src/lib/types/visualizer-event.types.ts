export enum VisualizerEventType {
  CHART_INIT = '[Chart] Init',
  CHART_CONFIG_CHANGE = '[Chart] Config Change',
  CHART_RENDER_START = '[Chart] Render Start',
  CHART_RENDER_COMPLETE = '[Chart] Render Complete',
  CHART_RESIZE = '[Chart] Resize',

  CHART_VIEW_INIT = '[Chart] View Init',
  CHART_VIEW_READY = '[Chart] View Ready',
  CHART_INSTANCE_SET = '[Chart] Instance Set',
  CHART_EMIT_SERIES = '[Chart] Emit Series',
  CHART_LAYOUT_CONFIGURE = '[Chart] Layout Configure',
  CHART_SERIES_CONFIGURE = '[Chart] Series Configure',
  CHART_AXIS_CONFIGURE = '[Chart] Axis Configure',

  TABLE_INIT = '[Table] Init',
  TABLE_CONFIGURE = '[Table] Configure',
  TABLE_RENDER = '[Table] Render',
  TABLE_EXPORT = '[Table] Export'
}

export type VisualizerEvent =
  | {
    type: VisualizerEventType.CHART_INIT;
    instanceId: string;
    payload: { datasetId?: string | number; chartOptions: any };
  }
  | {
    type: VisualizerEventType.CHART_CONFIG_CHANGE;
    instanceId: string;
    payload: { optionsType: string; seriesCount?: number };
  }
  | {
    type: VisualizerEventType.CHART_RENDER_START;
    instanceId: string;
    payload?: undefined;
  }
  | {
    type: VisualizerEventType.CHART_RENDER_COMPLETE;
    instanceId: string;
    payload?: undefined;
  }
  | {
    type: VisualizerEventType.CHART_RESIZE;
    instanceId: string;
    payload?: undefined;
  }
  | {
    type: VisualizerEventType.CHART_VIEW_INIT;
    instanceId: string;
    payload: { initOptions: any };
  }
  | {
    type: VisualizerEventType.CHART_VIEW_READY;
    instanceId: string;
    payload: { isReady: boolean; width?: number; height?: number };
  }
  | {
    type: VisualizerEventType.CHART_INSTANCE_SET;
    instanceId: string;
    payload: { hasInstance: boolean };
  }
  | {
    type: VisualizerEventType.CHART_EMIT_SERIES;
    instanceId: string;
    payload: { seriesCount: number; seriesNames: string[] };
  }
  | {
    type: VisualizerEventType.CHART_LAYOUT_CONFIGURE;
    instanceId: string;
    payload: { chartType?: string; hasTitle: boolean; hasLegend: boolean; grid?: any; pie?: any };
  }
  | {
    type: VisualizerEventType.CHART_SERIES_CONFIGURE;
    instanceId: string;
    payload: { seriesCount: number; seriesNames: string[] };
  }
  | {
    type: VisualizerEventType.CHART_AXIS_CONFIGURE;
    instanceId: string;
    payload: { hasLayout: boolean; x1: string; x2?: string };
  }
  | {
    type: VisualizerEventType.TABLE_INIT;
    instanceId: string;
    payload: { datasetId?: string | number; tableOptions: any };
  }
  | {
    type: VisualizerEventType.TABLE_CONFIGURE;
    instanceId: string;
    payload: { columns: (string | number)[]; rows: (string | number)[] };
  }
  | {
    type: VisualizerEventType.TABLE_RENDER;
    instanceId: string;
    payload?: undefined;
  }
  | {
    type: VisualizerEventType.TABLE_EXPORT;
    instanceId: string;
    payload: { type: 'html' | 'xlsx'; name: string };
  };

export type AppEvent = VisualizerEvent & {
  id: number;
  timestamp: Date;
};
