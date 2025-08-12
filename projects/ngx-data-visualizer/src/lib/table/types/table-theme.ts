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

  /** Configuración de bordes generales */
  border: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes para etiquetas */
  labelBorder: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes para datos */
  dataBorder: {
    color: string;
    width: string;
    style: string;
  };

  /** Configuración de bordes hover para etiquetas */
  labelHoverBorder: {
    color: string;
    width: string;
    style: string;
  };
  /** Configuración de bordes hover para datos */
  dataHoverBorder: {
    color: string;
    width: string;
    style: string;
  };

  /** Color de fondo hover para etiquetas */
  labelHover: string;
  /** Color de contraste hover para etiquetas */
  labelHoverContrast: string;
  /** Color de fondo hover para datos */
  dataHover: string;
  /** Color de contraste hover para datos */
  dataHoverContrast: string;
  /** Color de fondo hover para encabezados */
  headerHover: string;
  /** Color de contraste hover para encabezados */
  headerHoverContrast: string;

  /** Configuración de sombras */
  boxShadow: string;
  /** Espaciado entre bordes de celdas */
  borderSpacing: string;
  /** Tipo de colapso de bordes */
  borderCollapse: string;

  /** Border radius para etiquetas */
  labelBorderRadius: string;
  /** Border radius para datos */
  dataBorderRadius: string;

  /** Alineación del texto para los datos del tbody */
  dataTextAlign: "left" | "right" | "center" | "justify" | "inherit";
}
