# APP UNCuyo - Data Visualizer

Este proyecto consiste en una aplicación Angular que incluye una librería de visualización de datos (`ngx-data-visualizer`) y un proyecto demo que muestra su implementación.

## Estructura del Proyecto

```
app-uncuyo/
├── projects/
│   ├── ngx-data-visualizer/    # Librería principal
│   └── demo/                   # Proyecto de demostración
└── package.json               # Configuración del proyecto
```

## Componentes Principales

### NgxDataVisualizer
Una librería Angular que proporciona componentes y directivas para la visualización de datos en forma de gráficos y tablas. Para más detalles, consulta el [README de la librería](projects/ngx-data-visualizer/README.md).

### Proyecto Demo
Un proyecto de demostración que muestra el uso de la librería NgxDataVisualizer. Incluye ejemplos prácticos y casos de uso. Para más información, consulta el [README del demo](projects/demo/README.md).

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (versión 6 o superior)
- Angular CLI (versión 17 o superior)

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd app-uncuyo
```

2. Instalar dependencias:
```bash
npm install
```

## Desarrollo

### Ejecutar la aplicación principal
```bash
ng serve
```

### Ejecutar el proyecto demo
```bash
ng serve demo
```

### Construir la librería
```bash
ng build ngx-data-visualizer
```

## Estructura de Carpetas

### NgxDataVisualizer
- `projects/ngx-data-visualizer/src/lib`: Código fuente de la librería
  - `chart/`: Componentes de gráficos
  - `table/`: Componentes de tablas
  - `multiple-chart/`: Componentes para múltiples gráficos
  - `legend/`: Componentes de leyendas
  - `icons/`: Iconos personalizados

### Demo
- `projects/demo/src/app`: Código fuente de la aplicación demo
  - `dashboard/`: Componentes del dashboard
  - `chart-examples/`: Ejemplos de gráficos
  - `table-examples/`: Ejemplos de tablas
  - `shared/`: Componentes compartidos

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Para más información o soporte, por favor contacta al equipo de desarrollo de la Universidad Nacional de Cuyo.
