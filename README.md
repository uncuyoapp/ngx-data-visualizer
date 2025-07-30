# 📊 APP UNCuyo — Data Visualizer

Este proyecto ha sido desarrollado por el **Área de Políticas Públicas de la Universidad Nacional de Cuyo**. Consiste en una aplicación Angular que incluye:

- **`ngx-data-visualizer`**: una librería open-source diseñada para facilitar la visualización de datos en proyectos Angular, a través de componentes reutilizables, accesibles y adaptables a distintos contextos.
- **`demo`**: una aplicación de ejemplo que muestra cómo integrar y utilizar la librería en un proyecto Angular real.

El objetivo principal del proyecto es promover el uso de herramientas tecnológicas abiertas para la exploración, presentación y análisis de datos públicos, en el marco de iniciativas de gobierno abierto y políticas basadas en evidencia.



## 📁 Estructura del Proyecto

```
app-uncuyo/
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

- Node.js ≥ 14  
- npm ≥ 6  
- Angular CLI ≥ 17  



## 🚀 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
   cd app-uncuyo
   ```

2. Instala las dependencias:
   ```bash
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
