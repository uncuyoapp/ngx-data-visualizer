# 📊 ngx-data-visualizer

Este proyecto ha sido desarrollado por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Consiste en un workspace de Angular que incluye:

- **`ngx-data-visualizer`**: una librería open-source diseñada para facilitar la visualización de datos en proyectos Angular, a través de componentes reutilizables, accesibles y adaptables a distintos contextos.
- **`demo`**: una aplicación de ejemplo que muestra cómo integrar y utilizar la librería en un proyecto Angular real.

El objetivo principal del proyecto es promover el uso de herramientas tecnológicas abiertas para la exploración, presentación y análisis de datos públicos, en el marco de iniciativas de gobierno abierto y políticas basadas en evidencia.

## ✨ Características principales

- Completamente standalone (sin NgModules)
- Integración con ECharts y PivotTable.js
- Exportación a Excel y descarga de archivos png y jpg
- Visualizaciones personalizables mediante inputs simples

## 🧩 Tecnologías y librerías utilizadas

Este proyecto está desarrollado en Angular 18 e integra múltiples librerías de visualización y manipulación de datos. La librería `ngx-data-visualizer` funciona como un *wrapper* que simplifica el uso combinado de las siguientes dependencias clave:

- [Bootstrap 5](https://getbootstrap.com/) — para layout responsivo y estilos básicos (usado en demo).
- [ECharts](https://echarts.apache.org/) y [ngx-echarts](https://github.com/xieziyu/ngx-echarts) — para visualizaciones interactivas.
- [PivotTable.js](https://pivottable.js.org/) — para análisis dinámico de datos tabulados.
- [XLSX](https://github.com/SheetJS/sheetjs) — para exportación e importación de hojas de cálculo.
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) — para descarga de archivos desde el navegador.
- [lodash.clonedeep](https://lodash.com/docs/4.17.15#cloneDeep) y [lodash.uniqby](https://lodash.com/docs/4.17.15#uniqBy) — para utilidades de manipulación de objetos y arrays.
- [jQuery](https://jquery.com/) — requerido por PivotTable.js.
- [RxJS](https://rxjs.dev/) — programación reactiva.

## 📁 Estructura del Proyecto

```
ngx-data-visualizer-workspace/
├── projects/
│   ├── ngx-data-visualizer/    # Librería principal
│   └── demo/                   # Proyecto de demostración
└── package.json               # Configuración del proyecto
```

## 🧩 Componentes Principales

### 📦 NgxDataVisualizer

Una librería Angular que proporciona componentes y directivas para la visualización de datos mediante gráficos, tablas y otros elementos interactivos.

👉 Ver más detalles en el [README de la librería](projects/ngx-data-visualizer/README.md).

### 🧪 Proyecto Demo

Una aplicación de ejemplo que demuestra el uso de los componentes de `NgxDataVisualizer`, incluyendo casos de uso y ejemplos prácticos.

👉 Ver más información en el [README del demo](projects/demo/README.md).

## ⚙️ Requisitos Previos

- Node.js >= 18.13.0
- npm >= 8.19.0
- Angular CLI >= 18.0.0



## 🚀 Instalación

```bash
# Clonar el proyecto completo
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git

# Instalar dependencias
npm install
```


## 🛠️ Desarrollo

### Ejecutar el proyecto demo
```bash
ng serve demo
```

### Construir la librería
```bash
ng build ngx-data-visualizer
```


## 🗂️ Estructura de Carpetas

### Librería `ngx-data-visualizer`

- `projects/ngx-data-visualizer/src/lib/`  
  - `chart/` — Componentes de gráficos  
  - `table/` — Componentes de tablas  
  - `multiple-chart/` — Visualización de múltiples gráficos  
  - `legend/` — Componentes de leyendas  
  - `icons/` — Iconos personalizados  

### Aplicación `demo`

- `projects/demo/src/app/`  
  - `configuration/` — Uso y configuración de la librería  
  - `dashboard/` — Ejemplo de tablero
  - `full-example/` — Ejemplo completo
  - `table-demo/` — Ejemplos de uso de tablas    


## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!

1. Haz un fork del repositorio  
2. Crea una nueva rama (`git checkout -b feature/NuevaFeature`)  
3. Realiza tus cambios y haz commit (`git commit -m 'Agrega nueva feature'`)  
4. Push a tu rama (`git push origin feature/NuevaFeature`)  
5. Abre un Pull Request describiendo tu propuesta  


## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).


## 📬 Contacto

Para consultas o soporte, podés comunicarte con el equipo de desarrollo del Área de Políticas Públicas de la Universidad Nacional de Cuyo.

- Coordinación de Proyecto: Gonzalo R. Siman [gonzasiman@gmail.com](mailto:gonzasiman@gmail.com)
- Área de Políticas Públicas — UNCUYO: [politicaspublicasuncuyo@gmail.com](mailto:politicaspublicasuncuyo@gmail.com)

---

Desarrollado con ❤️ por el [Área de Políticas Públicas]([htts](https://www.uncuyo.edu.ar/politicaspublicas/)) - Universidad Nacional de Cuyo
