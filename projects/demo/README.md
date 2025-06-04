# Demo de NgxDataVisualizer

Este proyecto demo sirve como ejemplo y banco de pruebas para la librería NgxDataVisualizer. Proporciona ejemplos prácticos de implementación y uso de los diferentes componentes y funcionalidades de la librería.

## Características del Demo

- Ejemplos de implementación de gráficos
- Ejemplos de tablas de datos
- Casos de uso de múltiples gráficos
- Demostración de personalización de estilos
- Ejemplos de integración con diferentes tipos de datos

## Estructura del Proyecto

```
src/
├── app/
│   ├── dashboard/           # Componentes del dashboard principal
│   ├── chart-examples/      # Ejemplos de diferentes tipos de gráficos
│   ├── table-examples/      # Ejemplos de tablas
│   └── shared/             # Componentes compartidos
├── assets/
│   └── dash-dimensions.json # Configuración de dimensiones del dashboard
└── styles/                 # Estilos globales
```

## Ejecución del Demo

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
ng serve
```

3. Abrir el navegador en `http://localhost:4200`

## Ejemplos Incluidos

### Gráficos
- Gráficos de barras
- Gráficos de líneas
- Gráficos circulares
- Gráficos de dispersión

### Tablas
- Tablas básicas
- Tablas con ordenamiento
- Tablas con filtrado
- Tablas con paginación

### Dashboards
- Dashboard con múltiples gráficos
- Dashboard con layout personalizado
- Dashboard con dimensiones dinámicas

## Desarrollo

### Agregar un nuevo ejemplo

1. Crear un nuevo componente en el directorio apropiado:
```bash
ng generate component chart-examples/nuevo-ejemplo
```

2. Implementar el ejemplo siguiendo los patrones existentes
3. Agregar la ruta en el módulo principal
4. Documentar el ejemplo en este README

### Estructura de un ejemplo

Cada ejemplo debe incluir:
- Componente principal
- Template HTML
- Estilos SCSS
- Datos de ejemplo
- Documentación del ejemplo

## Contribución

Los ejemplos en este proyecto demo son una excelente manera de contribuir a la librería. Si deseas agregar un nuevo ejemplo:

1. Asegúrate de que el ejemplo sea claro y bien documentado
2. Sigue las convenciones de código existentes
3. Incluye datos de ejemplo realistas
4. Agrega comentarios explicativos en el código

## Recursos Adicionales

- [Documentación de NgxDataVisualizer](../ngx-data-visualizer/README.md)
- [Guía de estilos](../ngx-data-visualizer/src/lib/styles.scss)
- [Ejemplos de uso](../ngx-data-visualizer/src/lib) 