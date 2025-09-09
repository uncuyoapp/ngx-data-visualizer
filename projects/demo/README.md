# 🧪 Demo de NgxDataVisualizer

[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](#)

Este proyecto demo sirve como **documentación interactiva** y banco de pruebas para la librería `ngx-data-visualizer`. Proporciona ejemplos prácticos, casos de uso reales y documentación completa sobre cómo implementar y configurar las diferentes directivas de la librería.

## ✨ Características principales

- **📚 Documentación interactiva** - Guías paso a paso con código en vivo
- **🧪 Ejemplos completos** - Implementaciones reales de todas las directivas
- **🎛️ Casos de uso avanzados** - Dashboard, filtros, exportación y más
- **📱 Diseño responsive** - Optimizado para todos los dispositivos
- **🔧 Código fuente visible** - Todos los ejemplos incluyen el código completo
- **⚡ Angular 18 Standalone** - Implementación moderna sin NgModules

## 🏗️ Arquitectura del Demo

### Estructura de componentes

```
/src/app/
├── configuration/          # 📚 Guía de configuración y setup
├── chart-demo/            # 📊 Ejemplos de gráficos individuales
├── table-demo/            # 📋 Ejemplos de tablas dinámicas
├── multichart-demo/       # 📈 Ejemplos de múltiples gráficos
├── dashboard/             # 🎛️ Ejemplo de dashboard completo
├── full-example/          # 🔧 Integración completa de funcionalidades
└── home/                  # 🏠 Página principal y navegación
```

### Configuración de proveedores

El demo utiliza la configuración completa de proveedores en `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { 
  provideDataVisualizerCharts,
  provideDataVisualizerTables 
} from 'ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideDataVisualizerCharts(), // ✅ Para funcionalidad de gráficos
    provideDataVisualizerTables(), // ✅ Para funcionalidad de tablas
  ]
};
```

## 📋 Requisitos previos

- **Node.js** >= 18.13.0
- **npm** >= 8.19.0
- **Angular CLI** >= 18.0.0
- **Navegador moderno** compatible con ES2022

## 🚀 Instalación y ejecución

### Opción 1: Desarrollo completo (recomendado)

```bash
# Clonar el repositorio completo
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
cd ngx-data-visualizer

# Instalar dependencias
npm install

# Construir la librería (necesario para el demo)
ng build ngx-data-visualizer

# Ejecutar el demo
ng serve demo
```

### Opción 2: Solo demo

```bash
# Si ya tienes el repositorio clonado
cd ngx-data-visualizer

# Ejecutar directamente (la librería debe estar construida)
ng serve demo --open
```

La aplicación estará disponible en: **http://localhost:4200**

## 🧩 Secciones del Demo

### 📚 [Configuración](./src/app/configuration/)
**Ruta:** `/configuration`

Guía completa de instalación y configuración de la librería:

- ✅ Instalación paso a paso
- ✅ Configuración de proveedores
- ✅ Importación de directivas
- ✅ Configuración del Dataset
- ✅ Sistema de filtros y agrupaciones
- ✅ API de las directivas

**Código destacado:**
```ts
// Ejemplo de configuración básica
const dataset = new Dataset({
  dimensions: [
    {
      id: 1,
      name: 'region',
      nameView: 'Región',
      items: [
        { id: 1, name: 'Norte', selected: true },
        { id: 2, name: 'Sur', selected: true }
      ]
    }
  ],
  rowData: [
    { region: 'Norte', ventas: 1500 },
    { region: 'Sur', ventas: 1200 }
  ]
});
```

### 📊 [Demo de Gráficos](./src/app/chart-demo/)
**Ruta:** `/chart-demo`

Ejemplos completos de la directiva `ChartDirective`:

- **Tipos de gráficos**: Barras, líneas, columnas, áreas, pie
- **Personalización**: Colores, temas, dimensiones
- **Interactividad**: Tooltips, leyendas, zoom
- **Exportación**: SVG, PNG, JPG
- **Metas y objetivos**: Líneas de referencia

**Características demostradas:**
```html
<div libChart 
     [dataset]="dataset" 
     [chartOptions]="chartOptions"     
     (seriesChange)="onSeriesChange($event)"
     (chartCreated)="onChartCreated($event)">
</div>
```

### 📋 [Demo de Tablas](./src/app/table-demo/)
**Ruta:** `/table-demo`

Ejemplos de la directiva `TableDirective` con PivotTable.js:

- **Tabla dinámica**: Reorganización de columnas y filas
- **Modos de vista**: Nominal, porcentajes
- **Exportación**: Excel, HTML
- **Filtros**: Interactivos y dinámicos


### 📈 [Demo de Múltiples Gráficos](./src/app/multichart-demo/)
**Ruta:** `/multichart-demo`

Ejemplos de la directiva `MultipleChartDirective`:

- **Múltiples visualizaciones**: Automáticas por dimensión
- **Layouts responsivos**: Grid dinámico
- **Filtros globales**: Aplicación a todos los gráficos
- **Sincronización**: Escalas y colores consistentes

### 🎛️ [Dashboard](./src/app/dashboard/)
**Ruta:** `/dashboard`

Ejemplo de dashboard real combinando múltiples componentes:

- **Vista integral**: Gráficos + tablas + controles
- **Filtros interactivos**: Panel lateral
- **Responsive design**: Adaptable a móviles
- **Exportación masiva**: Todos los componentes

**Tecnologías integradas:**
- Bootstrap 5 para layout
- Font Awesome para iconos
- Filtros reactivos con RxJS

### 🔧 [Ejemplo Completo](./src/app/full-example/)
**Ruta:** `/full-example`

Implementación completa mostrando todas las funcionalidades:

- **Integración total**: Todas las directivas juntas
- **Flujo de datos**: Desde carga hasta visualización
- **Manejo de estados**: Loading, errores, datos vacíos
- **Optimización**: Lazy loading y performance
- **UX avanzada**: Transiciones y feedback

## 🎨 Tecnologías y Dependencias

### Dependencias de producción
```json
{
  "@angular/animations": "^18.0.0",
  "@angular/common": "^18.0.0",
  "@angular/core": "^18.0.0",
  "@angular/platform-browser": "^18.0.0",
  "@angular/router": "^18.0.0",
  "bootstrap": "^5.3.0",
  "ngx-data-visualizer": "^1.0.0",
  "prismjs": "^1.29.0",
  "rxjs": "~7.8.0"
}
```

### Dependencias heredadas de la librería
- ECharts (gráficos)
- PivotTable.js (tablas)
- jQuery (requerido por PivotTable)
- XLSX (exportación Excel)
- FileSaver.js (descarga de archivos)

## 🛠️ Comandos de desarrollo

```bash
# Desarrollo del demo
ng serve demo                    # Servidor de desarrollo
ng serve demo --open            # Abre automáticamente en el navegador
ng serve demo --port 4300       # Puerto personalizado

# Build y distribución
ng build demo                    # Build de producción
ng build demo --configuration=production  # Build optimizado

# Testing y calidad
ng lint demo                     # Verificar código
ng test demo                     # Ejecutar tests (no disponibles aún)

# Librería (prerequisito)
ng build ngx-data-visualizer     # Construir librería antes del demo
```

## 📁 Estructura detallada

```
projects/demo/
├── src/
│   ├── app/
│   │   ├── configuration/
│   │   │   ├── configuration.component.ts     # Lógica de documentación
│   │   │   ├── configuration.component.html   # Template con ejemplos
│   │   │   └── configuration.component.scss   # Estilos específicos
│   │   ├── chart-demo/
│   │   │   ├── chart-demo.component.ts        # Ejemplos de gráficos
│   │   │   └── chart-demo.component.html      # Templates interactivos
│   │   ├── table-demo/
│   │   │   ├── table-demo.component.ts        # Ejemplos de tablas
│   │   │   └── table-demo.component.html      # PivotTable demos
│   │   ├── multichart-demo/
│   │   │   ├── multichart-demo.component.ts   # Múltiples gráficos
│   │   │   └── multichart-demo.component.html # Layouts responsivos
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts         # Dashboard completo
│   │   │   └── dashboard.component.html       # UI integrada
│   │   ├── full-example/
│   │   │   ├── full-example.component.ts      # Ejemplo integral
│   │   │   └── full-example.component.html    # Todas las features
│   │   ├── home/
│   │   │   ├── home.component.ts              # Página principal
│   │   │   └── home.component.html            # Landing y navegación
│   │   ├── app.component.ts                   # Componente raíz
│   │   ├── app.config.ts                      # ⭐ Configuración de proveedores
│   │   └── app.routes.ts                      # Rutas de la aplicación
│   ├── assets/
│   │   ├── dash-dimensions.json               # Datos de ejemplo
│   │   └── images/                            # Recursos gráficos
│   ├── styles.scss                            # Estilos globales
│   └── index.html                             # HTML principal
└── README.md                                  # Este archivo
```


## 🚀 Performance y optimización

### Lazy Loading implementado
- Carga diferida de componentes de rutas
- Proveedores con importación dinámica de librerías
- Optimización de bundles

### Best practices demostradas
- **OnPush Change Detection** para mejor rendimiento
- **TrackBy functions** en listas dinámicas
- **Subscription management** para evitar memory leaks
- **Debouncing** en filtros interactivos

## 🐛 Troubleshooting

### Problemas comunes

**El demo no carga correctamente**
```bash
# Verificar que la librería esté construida
ng build ngx-data-visualizer

# Limpiar y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

**Errores de proveedores**
```ts
// Verificar app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideDataVisualizerCharts(), // ← Debe estar presente
    provideDataVisualizerTables(), // ← Debe estar presente
  ]
};
```

**Problemas de estilos**
- Verificar que Bootstrap esté importado en `styles.scss`
- Comprobar que Prism.js esté configurado para highlighting

## 🤝 Contribuir al Demo

### Agregar nuevos ejemplos

1. Crear nuevo componente en la carpeta apropiada
2. Agregar ruta en `app.routes.ts`
3. Incluir navegación en `home.component.html`
4. Documentar en este README

### Mejorar ejemplos existentes

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/mejora-ejemplo`
3. Realizar cambios con documentación
4. Crear Pull Request con descripción detallada

## 📚 Recursos adicionales

- **Repositorio principal**: [GitHub](https://github.com/uncuyoapp/ngx-data-visualizer)
- **NPM Package**: [@ngx-data-visualizer](https://www.npmjs.com/package/ngx-data-visualizer)
- **Documentación ECharts**: [echarts.apache.org](https://echarts.apache.org/)
- **Documentación PivotTable**: [pivottable.js.org](https://pivottable.js.org/)
- **Angular Standalone**: [angular.io/guide/standalone-components](https://angular.io/guide/standalone-components)

## 📄 Licencia

Este proyecto demo está licenciado bajo los términos de la MIT License, igual que la librería principal.

---

<div align="center">

**🧪 Demo desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**

[🏠 Home](/) • [📚 Configuración](/configuration) • [📊 Gráficos](/chart-demo) • [📋 Tablas](/table-demo) • [🎛️ Dashboard](/dashboard)

</div>