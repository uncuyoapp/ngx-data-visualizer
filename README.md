# 📊 ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Este proyecto ha sido desarrollado por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Consiste en un workspace de Angular que incluye:

- **`@uncuyoapp/ngx-data-visualizer`**: una librería open-source diseñada para facilitar la visualización de datos en proyectos Angular, a través de componentes reutilizables, accesibles y adaptables a distintos contextos.
- **`demo`**: una aplicación de ejemplo que muestra cómo integrar y utilizar la librería en un proyecto Angular real.

El objetivo principal del proyecto es promover el uso de herramientas tecnológicas abiertas para la exploración, presentación y análisis de datos públicos, en el marco de iniciativas de gobierno abierto y políticas basadas en evidencia.

## ✨ Características principales

- **Completamente standalone** (sin NgModules) - Compatible con Angular moderno
- **Sistema de proveedores configurables** - Usa solo las funcionalidades que necesitas
- **Integración con ECharts y PivotTable.js** - Las mejores librerías de visualización
- **Exportación avanzada** - Soporta Excel, PNG, JPG y SVG
- **Visualizaciones personalizables** - Mediante inputs simples y temas
- **TypeScript completo** - Interfaces tipadas para mejor DX
- **Optimizado para rendimiento** - Lazy loading y tree shaking incluido
- **🎛️ Editor de configuración integrado** - Interfaz visual para personalizar gráficos y tablas en tiempo real

## 🚀 Instalación rápida

```bash
npm install @uncuyoapp/ngx-data-visualizer echarts ngx-echarts pivottable jquery
```

## ⚙️ Configuración básica

En tu `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideDataVisualizerCharts, provideDataVisualizerTables } from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Otros providers...
    provideDataVisualizerCharts(), // Para gráficos
    provideDataVisualizerTables(), // Para tablas
  ]
};
```

En tu componente:

```ts
import { Component } from '@angular/core';
import { ChartDirective, Dataset, ChartOptions } from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-my-chart',
  standalone: true,
  imports: [ChartDirective],
  template: `<div libChart [dataset]="dataset" [chartOptions]="options"></div>`
})
export class MyChartComponent {
  dataset = new Dataset({
    dimensions: [/* ... */],
    rowData: [/* ... */]
  });
  
  options: ChartOptions = {
    type: 'bar',
    // más opciones...
  };
}
```

## 🧩 Tecnologías y librerías utilizadas

Este proyecto está desarrollado en **Angular 18** e integra múltiples librerías de visualización y manipulación de datos. La librería `@uncuyoapp/ngx-data-visualizer` funciona como un *wrapper* que simplifica el uso combinado de las siguientes dependencias clave:

### Dependencias principales
- [Angular 18+](https://angular.io/) — Framework base con APIs standalone
- [ECharts](https://echarts.apache.org/) y [ngx-echarts](https://github.com/xieziyu/ngx-echarts) — Para visualizaciones interactivas
- [PivotTable.js](https://pivottable.js.org/) — Para análisis dinámico de datos tabulados
- [XLSX](https://github.com/SheetJS/sheetjs) — Para exportación e importación de hojas de cálculo
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) — Para descarga de archivos desde el navegador

### Dependencias de utilidad
- [lodash.clonedeep](https://lodash.com/docs/4.17.15#cloneDeep) y [lodash.uniqby](https://lodash.com/docs/4.17.15#uniqBy) — Para manipulación de objetos y arrays
- [jQuery](https://jquery.com/) — Requerido por PivotTable.js
- [RxJS](https://rxjs.dev/) — Programación reactiva

### Dependencias de desarrollo y demo
- [Bootstrap 5](https://getbootstrap.com/) — Para layout responsivo y estilos (solo en demo)
- [Prism.js](https://prismjs.com/) — Para highlighting de código (solo en demo)

## 📁 Estructura del Proyecto

```
ngx-data-visualizer-workspace/
├── projects/
│   ├── ngx-data-visualizer/    # 📦 Librería principal
│   │   ├── src/lib/
│   │   │   ├── chart/          # Componentes de gráficos
│   │   │   ├── table/          # Componentes de tablas
│   │   │   ├── multiple-chart/ # Múltiples gráficos
│   │   │   ├── providers.ts    # ⭐ Proveedores configurables
│   │   │   └── public-api.ts   # API pública
│   │   └── README.md
│   └── demo/                   # 🧪 Aplicación de demostración
│       ├── src/app/
│       │   ├── configuration/  # 📚 Guía de uso
│       │   ├── chart-demo/     # Ejemplos de gráficos
│       │   ├── table-demo/     # Ejemplos de tablas
│       │   ├── dashboard/      # Dashboard completo
│       │   └── full-example/   # Ejemplo integral
│       └── README.md
├── dist/                       # Builds de distribución
├── package.json               # Configuración del workspace
└── README.md                  # Este archivo
```

## 🧩 Componentes Principales

### 📦 @uncuyoapp/ngx-data-visualizer - Librería Principal

La librería proporciona un conjunto de directivas standalone y servicios para visualización de datos:

- **Directivas**:
  - `ChartDirective` - Gráficos individuales
  - `MultipleChartDirective` - Múltiples gráficos
  - `TableDirective` - Tablas dinámicas

- **Clases y tipos**:
  - `Dataset` - Gestión de conjuntos de datos
  - `ChartOptions`, `TableOptions` - Configuraciones tipadas
  - `Dimension`, `RowData`, `Goal` - Interfaces de datos
  - `ChartConfigEditor`, `TableConfigEditor` - Componentes del editor integrado

- **Proveedores**:
  - `provideDataVisualizerCharts(config?)` - Para funcionalidad de gráficos. Permite configurar una paleta de colores global.
  - `provideDataVisualizerTables()` - Para funcionalidad de tablas

👉 **Documentación completa**: [README de la librería](projects/ngx-data-visualizer/README.md)

### 🧪 Proyecto Demo - Documentación Interactiva

Una aplicación Angular completa que sirve como documentación viva y ejemplos de uso:

- **Guía de configuración** - Setup paso a paso
- **Ejemplos interactivos** - Para cada directiva
- **Casos de uso reales** - Dashboard y análisis de datos
- **Código fuente** - Todos los ejemplos incluyen código

👉 **Ver ejemplos**: [README del demo](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/projects/demo/README.md) o visita la [**Demo Online**](https://uncuyoapp.github.io/ngx-data-visualizer/).

## ⚙️ Requisitos del Sistema

- **Node.js** >= 18.13.0
- **npm** >= 8.19.0
- **Angular CLI** >= 18.0.0
- **Angular** >= 18.0.0 (con soporte para standalone APIs)

## 🚀 Desarrollo Local

### Instalación completa del workspace

```bash
# Clonar el repositorio
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
cd ngx-data-visualizer

# Instalar dependencias
npm install
```

### Comandos principales

```bash
# 🧪 Ejecutar aplicación demo
ng serve demo
# Abre http://localhost:4200

# 📦 Construir la librería
ng build ngx-data-visualizer

# 🧪 Construir demo
ng build demo

# 🔍 Linting
ng lint

```

### Flujo de desarrollo

1. **Desarrollar en la librería**: Modifica archivos en `projects/ngx-data-visualizer/`
2. **Construir la librería**: `ng build ngx-data-visualizer`
3. **Probar en demo**: Los cambios se reflejan automáticamente en el demo
4. **Verificar ejemplos**: `ng serve demo` para ver los cambios en acción

## 📖 Guía de Uso

### 1. Instalación en tu proyecto

```bash
npm install @uncuyoapp/ngx-data-visualizer echarts ngx-echarts pivottable jquery
```

### 2. Configurar proveedores (obligatorio)

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { 
  provideDataVisualizerCharts,
  provideDataVisualizerTables 
} from '@uncuyoapp/ngx-data-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    // Solo si usas gráficos
    provideDataVisualizerCharts(),
    
    // Solo si usas tablas
    provideDataVisualizerTables(),
    
    // Otros providers...
  ]
};
```

### 3. Importar Estilos Globales (obligatorio)

Para que los componentes se visualicen correctamente, importa el archivo de estilos principal de la librería en tu archivo `styles.scss` global (o equivalente).

```scss
// en src/styles.scss
@import '@uncuyoapp/ngx-data-visualizer/styles';
```

### 4. Usar en componentes

```ts
import { Component } from '@angular/core';
import { 
  ChartDirective, 
  TableDirective,
  Dataset, 
  ChartOptions 
} from '@uncuyoapp/ngx-data-visualizer';

@Component({
  selector: 'app-data-viz',
  standalone: true,
  imports: [ChartDirective, TableDirective],
  template: `
    <!-- Gráfico -->
    <div libChart 
         [dataset]="dataset" 
         [chartOptions]="chartOptions">
    </div>
    
    <!-- Tabla -->
    <div libTable 
         [dataset]="dataset" 
         [tableOptions]="tableOptions">
    </div>
  `
})
export class DataVizComponent {
  dataset = new Dataset({
    dimensions: [
      {
        id: 1,
        name: 'category',
        nameView: 'Categoría',
        items: [
          { id: 1, name: 'A', selected: true },
          { id: 2, name: 'B', selected: true }
        ]
      }
    ],
    rowData: [
      { category: 'A', value: 100 },
      { category: 'B', value: 200 }
    ]
  });
  
  chartOptions: ChartOptions = {
    type: 'bar',
    title: 'Mi Gráfico'
  };
  
  tableOptions = {
    title: 'Mi Tabla'
  };
}
```

## 🎨 Ejemplos y Documentación

La mejor manera de aprender a usar la librería es explorando los ejemplos interactivos en la **aplicación demo**.

```bash
# Ejecutar la aplicación demo localmente
ng serve demo
```

Visita la [**Demo Online**](https://uncuyoapp.github.io/ngx-data-visualizer/) para ver la librería en acción sin necesidad de instalar nada.

**Secciones disponibles en la demo**:
- **📚 Configuración**: Guía paso a paso de setup
- **📊 Gráficos**: Ejemplos de `ChartDirective`
- **📋 Tablas**: Ejemplos de `TableDirective`
- **📈 Múltiples Gráficos**: Ejemplos de `MultipleChartDirective`
- **🎛️ Dashboard**: Caso de uso completo
- **🔧 Ejemplo Completo**: Integración de todas las funcionalidades

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Sigue estos pasos:

### Para reportar bugs o sugerir features
1. Crea un [Issue](https://github.com/uncuyoapp/ngx-data-visualizer/issues) describiendo el problema o sugerencia
2. Usa las plantillas proporcionadas
3. Incluye ejemplos de código si es relevante

### Para contribuir código
1. Haz un fork del repositorio
2. Crea una nueva rama: `git checkout -b feature/nueva-funcionalidad`
3. Desarrolla y prueba tus cambios:
   ```bash
   # Construir librería
   ng build ngx-data-visualizer
   
   # Probar en demo
   ng serve demo
   
   # Verificar linting
   ng lint
   ```
4. Commit siguiendo [Conventional Commits](https://conventionalcommits.org/):
   ```bash
   git commit -m "feat: agregar nueva funcionalidad X"
   ```
5. Push a tu fork: `git push origin feature/nueva-funcionalidad`
6. Crea un Pull Request con descripción detallada

### Estándares de código
- Seguir las convenciones de Angular
- Incluir documentación JSDoc
- Mantener compatibilidad con versiones soportadas
- Agregar ejemplos en el demo cuando sea relevante

## 📋 Roadmap

### Próximas versiones
- [x] Configurador de gráficos y tablas
- [x] Inyección de paleta de colores global y soporte para paletas nativas
- [ ] Mejoras en la interfaz de usuario

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

## 📬 Contacto y Soporte

### 🎯 Soporte técnico
- **Issues**: [GitHub Issues](https://github.com/uncuyoapp/ngx-data-visualizer/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/uncuyoapp/ngx-data-visualizer/discussions)

### 🏛️ Información institucional
- **Coordinación de Proyecto**: Gonzalo R. Siman [gonzasiman@gmail.com](mailto:gonzasiman@gmail.com)
- **Área de Políticas Públicas - UNCUYO**: [politicaspublicasuncuyo@gmail.com](mailto:politicaspublicasuncuyo@gmail.com)
- **Sitio web**: [https://www.uncuyo.edu.ar/politicaspublicas/](https://www.uncuyo.edu.ar/politicaspublicas/)

---

<div align="center">

**Desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**

[🌐 Website](https://www.uncuyo.edu.ar/politicaspublicas/) • [GitHub](https://github.com/uncuyoapp/ngx-data-visualizer) • [📊 NPM](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer) • [🧪 Demo](https://uncuyoapp.github.io/ngx-data-visualizer/)

</div>