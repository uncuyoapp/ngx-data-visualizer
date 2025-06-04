# NgxDataVisualizer

NgxDataVisualizer es una librería Angular que proporciona componentes y directivas para la visualización de datos en forma de gráficos y tablas. Está diseñada para ser flexible, reutilizable y fácil de integrar en aplicaciones Angular.

## Características Principales

- Visualización de datos mediante gráficos y tablas
- Soporte para múltiples tipos de gráficos
- Directivas personalizables para la integración de datos
- Sistema de leyendas integrado
- Estilos personalizables mediante SCSS

## Componentes Principales

### Gráficos
- `ChartDirective`: Directiva base para la renderización de gráficos
- `MultipleChartDirective`: Directiva para la visualización de múltiples gráficos
- Componentes de gráficos específicos en el directorio `chart/`

### Tablas
- `TableDirective`: Directiva para la renderización de tablas de datos
- Componentes de tabla en el directorio `table/`

### Utilidades
- `DataProvider`: Servicio para la gestión y transformación de datos
- `Legend`: Componente para la visualización de leyendas
- `Dataset`: Utilidades para el manejo de conjuntos de datos

## Instalación

```bash
npm install ngx-data-visualizer
```

## Uso Básico

1. Importar el módulo en tu aplicación:

```typescript
import { NgxDataVisualizerModule } from 'ngx-data-visualizer';

@NgModule({
  imports: [
    NgxDataVisualizerModule
  ]
})
export class AppModule { }
```

2. Usar los componentes en tus templates:

```html
<!-- Gráfico simple -->
<div ngxChart [data]="chartData"></div>

<!-- Tabla de datos -->
<div ngxTable [data]="tableData"></div>

<!-- Múltiples gráficos -->
<div ngxMultipleChart [data]="multipleChartData"></div>
```

## Desarrollo

### Generar un nuevo componente

```bash
ng generate component component-name --project ngx-data-visualizer
```

### Construir la librería

```bash
ng build ngx-data-visualizer
```

### Ejecutar pruebas

```bash
ng test ngx-data-visualizer
```

## Publicación

1. Construir la librería:
```bash
ng build ngx-data-visualizer
```

2. Navegar al directorio de distribución:
```bash
cd dist/ngx-data-visualizer
```

3. Publicar en npm:
```bash
npm publish
```

## Documentación Adicional

Para más información sobre el uso de la librería, consulta la documentación en el directorio `docs/` o visita nuestro sitio web.

## Contribución

Las contribuciones son bienvenidas. Por favor, lee nuestras guías de contribución antes de enviar un pull request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
