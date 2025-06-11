/**
 * Sistema de constantes para la biblioteca ngx-data-visualizer.
 * Proporciona valores predefinidos y configuraciones comunes para toda la biblioteca.
 */

/**
 * Constantes relacionadas con dimensiones y nombres de campos
 */
export const Dimensions = {
  /** Nombre de la dimensión de año */
  YEAR: 'Año',
  /** Nombre de la dimensión de valor */
  VALUE: 'valor',
  /** Nombre de la dimensión de mes */
  MONTH: 'Mes',
  /** Nombre de la dimensión de categoría */
  CATEGORY: 'Categoría',
  /** Nombre de la dimensión de región */
  REGION: 'Región'
} as const;

/**
 * Constantes relacionadas con la exportación a Excel
 */
export const Excel = {
  /** Tipo MIME para archivos Excel */
  TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  /** Extensión de archivo Excel */
  EXTENSION: '.xlsx',
  /** Nombres de columnas por defecto */
  DEFAULT_COLUMNS: {
    YEAR: 'Año',
    VALUE: 'Valor',
    CATEGORY: 'Categoría'
  }
} as const;

/**
 * Constantes relacionadas con la seguridad
 */
export const Security = {
  /** Longitud máxima permitida para strings */
  MAX_LENGTH: 10000,
  /** Atributos HTML considerados peligrosos */
  DANGEROUS_ATTRS: [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onkeydown',
    'onkeyup',
    'onkeypress'
  ],
  /** Patrones de expresiones regulares para validación */
  PATTERNS: {
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    NUMERIC: /^[0-9]+$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  }
} as const;

/**
 * Constantes relacionadas con la configuración de gráficos ECharts
 */
export const ECharts = {
  /** Configuración base para vista previa de gráficos */
  CHART_CONFIG_PREVIEW: {
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
    textStyle: {
      fontFamily: 'sans-serif'
    },
  },

  /** Configuración base para ejes */
  AXIS_CONFIG: {
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
  },

  /** Configuración específica para cada tipo de serie */
  SERIES_CONFIG: {
    'area': {
      emphasis: {
        focus: 'series',
      },
      areaStyle: {},
    },
    'areaspline': {
      emphasis: {
        focus: 'series',
      },
      areaStyle: {},
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
    'pie': {}
  },

  /** Colores predefinidos para series */
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    DANGER: '#f44336',
    INFO: '#2196f3',
    LIGHT: '#f5f5f5',
    DARK: '#212121'
  },

  /** Tamaños predefinidos para gráficos */
  SIZES: {
    SMALL: { width: 400, height: 300 },
    MEDIUM: { width: 600, height: 400 },
    LARGE: { width: 800, height: 500 }
  }
} as const;

/**
 * Constantes relacionadas con la configuración de tablas
 */
export const Table = {
  /** Configuración base para tablas pivot */
  PIVOT_CONFIG: {
    digitsAfterDecimal: 2,
    totalRow: true,
    totalCol: true,
    suffix: ''
  },

  /** Posiciones predefinidas para elementos de tabla */
  POSITIONS: {
    TOP: 'top',
    RIGHT: 'right',
    BOTTOM: 'bottom',
    LEFT: 'left',
    CENTER: 'center'
  },

  /** Estilos predefinidos para celdas */
  CELL_STYLES: {
    HEADER: 'font-weight: bold; background-color: #f5f5f5;',
    TOTAL: 'font-weight: bold; background-color: #e3f2fd;',
    ALTERNATE: 'background-color: #fafafa;'
  }
} as const;

/**
 * Constantes relacionadas con la localización
 */
export const Locale = {
  /** Códigos de idioma soportados */
  LANGUAGES: {
    ES: 'es',
    EN: 'en',
    PT: 'pt'
  },

  /** Formatos de fecha comunes */
  DATE_FORMATS: {
    SHORT: 'dd/MM/yy',
    MEDIUM: 'dd/MM/yyyy',
    LONG: 'dd de MMMM de yyyy'
  },

  /** Formatos de número comunes */
  NUMBER_FORMATS: {
    DECIMAL: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    CURRENCY: {
      style: 'currency',
      currency: 'ARS'
    },
    PERCENT: {
      style: 'percent',
      minimumFractionDigits: 2
    }
  }
} as const;

/**
 * Constantes relacionadas con los temas de tablas
 */
export const TableThemes = {
  /** Tema por defecto */
  DEFAULT: {
    tableHover: '#0450ff',
    tableHoverContrast: '#ffff',
    tableDataBg: '#ffff',
    tableLabelBg: '#f2f2f2',
    axisLabelBg: '#ffff',
    textColor: '#333333',
    dataTextColor: '#333333',
    labelTextColor: '#333333',
    fontSize: '12pt',
    headerFontSize: '14pt',
    lineHeight: '30pt',
    padding: {
      cell: '5px 10px',
      label: '5px'
    },
    border: {
      color: 'white',
      width: '4px',
      style: 'solid'
    },
    boxShadow: 'inset 0px 2px 0px #f2f2f2'
  },

  /** Tema Material Design */
  MATERIAL: {
    tableHover: '#1976d2',
    tableHoverContrast: '#ffffff',
    tableDataBg: '#ffffff',
    tableLabelBg: '#f5f5f5',
    axisLabelBg: '#212121',
    textColor: '#1976d2',
    dataTextColor: 'rgba(0, 0, 0, 0.87)',
    labelTextColor: '#1976d2',
    fontSize: '14px',
    headerFontSize: '16px',
    lineHeight: '48px',
    padding: {
      cell: '16px',
      label: '16px'
    },
    border: {
      color: '#e0e0e0',
      width: '1px',
      style: 'solid'
    },
    boxShadow: 'inset 0px 2px 0px #f5f5f5'
  },

  /** Tema Bootstrap 5 */
  BOOTSTRAP: {
    tableHover: '#0d6efd',
    tableHoverContrast: '#ffffff',
    tableDataBg: '#ffffff',
    tableLabelBg: '#f8f9fa',
    axisLabelBg: '#212529',
    textColor: '#0d6efd',
    dataTextColor: '#212529',
    labelTextColor: '#0d6efd',
    fontSize: '1rem',
    headerFontSize: '1.1rem',
    lineHeight: '1.5',
    padding: {
      cell: '0.5rem',
      label: '0.5rem'
    },
    border: {
      color: '#dee2e6',
      width: '1px',
      style: 'solid'
    },
    boxShadow: 'inset 0px 2px 0px #f8f9fa'
  }
} as const;

// Re-exportar constantes antiguas para mantener compatibilidad
export const DIMENSION_YEAR = Dimensions.YEAR;
export const DIMENSION_VALUE = Dimensions.VALUE;
export const EXCEL_TYPE = Excel.TYPE;
export const EXCEL_EXTENSION = Excel.EXTENSION;
export const MAX_LENGTH = Security.MAX_LENGTH;
export const DANGEROUS_ATTRS = Security.DANGEROUS_ATTRS;
export const EC_CHART_CONFIG_PREVIEW = ECharts.CHART_CONFIG_PREVIEW;
export const EC_AXIS_CONFIG = ECharts.AXIS_CONFIG;
export const EC_SERIES_CONFIG = ECharts.SERIES_CONFIG; 