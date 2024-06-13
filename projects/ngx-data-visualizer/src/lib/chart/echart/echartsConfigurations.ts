import { EChartsOption } from "echarts";

export const EC_CHART_CONFIG_PREVIEW: EChartsOption = {
  title: {
    text: '',
    left: 'center'
  },
  legend: {
    show: false
  },
  yAxis: {
    name: ''
  },
  xAxis: {
    name: ''
  },
  tooltip: {
    show: true,
    backgroundColor: '#FFFFFF',
    trigger: 'item',
    renderMode: 'html',
    confine: true
  },
  dataZoom: {
    show: false,
    showDetail: false,
  },
  grid: {
    left: 30,
    right: 10,
    containLabel: true,
  },
  // backgroundColor: '#fff',
  textStyle: {
    fontFamily: 'sans-serif'
  },
};

export const EC_AXIS_CONFIG: EChartsOption = {
  show: true,
  type: 'category',
  data: [],
  position: 'bottom',
  offset: 0,
  axisLabel: {
    interval: 0,
    rotate: 0,
    hideOverlap: true,
    overflow: 'truncate'
  },
  axisTick: {
    show: false,
    length: 30,
    lineStyle: {
      color: '#3c3c3c3c'
    }
  },
  splitArea: {
    show: true
  },
  axisLine: {
    show: false
  },
  axisPointer: {
    link: [
      {
        xAxisIndex: 'all'
      }
    ]
  },
  tooltip: {
    show: true
  },
  triggerEvent: true,
};

export const EC_SERIES_CONFIG =
{
  'area': {
    emphasis: {
      focus: 'series',
    },
    areaStyle: {

    },
  },
  'areaspline': {
    emphasis: {
      focus: 'series',
    },
    areaStyle: {

    },
    smooth: true
  },
  'bar': {
    emphasis: {
      focus: 'series',
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  },
  'column': {
    emphasis: {
      focus: 'series',
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  },
  'line': {
    symbol: 'circle',
    symbolSize: 6,
    emphasis: {
      focus: 'series',
    }
  },
  'spline': {
    symbol: 'circle',
    symbolSize: 6,
    emphasis: {
      focus: 'series',
    },
    smooth: true
  },
  'pie': {

  }

};
