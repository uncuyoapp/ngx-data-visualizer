/**
 * Interfaz que define la estructura del tema para las tablas
 */
export interface TableTheme {
  /** Color de fondo al pasar el mouse sobre una celda */
  tableHover: string;
  /** Color de contraste para el hover */
  tableHoverContrast: string;
  /** Color de fondo para los datos */
  tableDataBg: string;
  /** Color de fondo para las etiquetas */
  tableLabelBg: string;
  /** Color de fondo para las etiquetas de eje */
  axisLabelBg: string;

  /** Color de texto base para toda la tabla */
  textColor: string;
  /** Color de texto para los datos */
  dataTextColor: string;
  /** Color de texto para las etiquetas */
  labelTextColor: string;

  /** Tamaño de fuente base */
  fontSize: string;
  /** Tamaño de fuente para los encabezados */
  headerFontSize: string;
  /** Altura de línea */
  lineHeight: string;

  /** Configuración de padding para diferentes elementos */
  padding: {
    cell: string;
    label: string;
  };

  /** Configuración de bordes */
  border: {
    color: string;
    width: string;
    style: string;
  };

  /** Configuración de sombras */
  boxShadow: string;
} 