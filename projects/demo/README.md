# 🧪 Demo de @uncuyoapp/ngx-data-visualizer

[![NPM Version](https://badge.fury.io/js/%40uncuyoapp%2Fngx-data-visualizer.svg)](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://uncuyoapp.github.io/ngx-data-visualizer/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io)

> **Nota:** Este proyecto es una aplicación de demostración para la librería `@uncuyoapp/ngx-data-visualizer`. Para obtener información detallada sobre la instalación y la API de la librería, consulta el [README principal](https://github.com/uncuyoapp/ngx-data-visualizer/blob/main/README.md).

Este proyecto sirve como **documentación interactiva** y banco de pruebas para la librería. Proporciona ejemplos prácticos y casos de uso reales.

## ✨ Características del Demo

- **📚 Documentación interactiva** - Guías paso a paso con código en vivo.
- **🧪 Ejemplos completos** - Implementaciones reales de todas las directivas.
- **🎛️ Casos de uso avanzados** - Dashboard, filtros, exportación y más.
- **📱 Diseño responsive** - Optimizado para todos los dispositivos.
- **🔧 Código fuente visible** - Todos los ejemplos incluyen el código completo.
- **⚡ Angular 18 Standalone** - Implementación moderna sin NgModules.

## 📁 Estructura del Demo

La aplicación de demostración está organizada por rutas, donde cada una corresponde a una página con ejemplos específicos:

```
/src/app/
├── configuration/     # 📚 Guía de configuración y setup
├── chart-demo/        # 📊 Ejemplos de gráficos individuales
├── table-demo/        # 📋 Ejemplos de tablas dinámicas
├── multichart-demo/   # 📈 Ejemplos de múltiples gráficos
├── dashboard/         # 🎛️ Ejemplo de dashboard completo
├── full-example/      # 🔧 Integración completa de funcionalidades
├── chart-cases-test/  # 🧪 Banco de pruebas de combinaciones y dimensiones
├── size-test/         # 📏 Laboratorio de tamaños (responsividad y CSS)
├── home/              # 🏠 Página principal y navegación
├── app.component.ts   # Componente raíz
├── app.config.ts      # ⭐ Configuración de proveedores de la librería
└── app.routes.ts      # Rutas de la aplicación
```

## 🚀 Ejecución Local

Para ejecutar la aplicación de demostración en tu entorno local, sigue estos pasos:

```bash
# 1. Clonar el repositorio completo
git clone https://github.com/uncuyoapp/ngx-data-visualizer.git
cd ngx-data-visualizer

# 2. Instalar dependencias
npm install

# 3. Construir la librería (requerido para que el demo funcione)
ng build ngx-data-visualizer

# 4. Ejecutar el servidor de desarrollo del demo
ng serve demo
```

La aplicación estará disponible en **http://localhost:4200**.

## 🧩 Secciones Disponibles

Una vez que la aplicación esté en funcionamiento, podrás explorar las siguientes secciones:

- **🏠 Home**: Página principal y navegación.
- **📚 Configuración**: Guía de instalación y configuración.
- **📊 Demo de Gráficos**: Ejemplos de `ChartDirective`.
- **📋 Demo de Tablas**: Ejemplos de `TableDirective`.
- **📈 Demo de Múltiples Gráficos**: Ejemplos de `MultipleChartDirective`.
- **🎛️ Dashboard**: Ejemplo de un dashboard completo.
- **🔧 Ejemplo Completo**: Integración de todas las funcionalidades.
- **🧪 Laboratorio de Pruebas**:
  - **Configuraciones para gráficos**: Permite probar la librería con datasets de N-dimensiones (1D a 5D) y ver la configuración generada en tiempo real.
  - **Medidas y responsive para gráficos**: Laboratorio de tamaños que valida las 4 formas de redimensionar el gráfico (TypeScript, Contenedores Flexibles, CSS Inline y SCSS Externo).

## 🛠️ Comandos Útiles

```bash
# Servidor de desarrollo con apertura automática
ng serve demo --open

# Construir el demo para producción
ng build demo

# Verificar la calidad del código
ng lint demo
```

## 🐛 Problemas Comunes

**"El demo no carga o muestra errores de compilación"**

La causa más común es que la librería `ngx-data-visualizer` no se ha construido antes de ejecutar el demo. Asegúrate de haber ejecutado `ng build ngx-data-visualizer` en la raíz del workspace.

Si el problema persiste, intenta limpiar las dependencias y reinstalar:
```bash
rm -rf node_modules package-lock.json
npm install
ng build ngx-data-visualizer
ng serve demo
```

## 📚 Recursos Adicionales

- **Repositorio Principal**: [https://github.com/uncuyoapp/ngx-data-visualizer](https://github.com/uncuyoapp/ngx-data-visualizer)
- **Paquete NPM**: [https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer](https://www.npmjs.com/package/@uncuyoapp/ngx-data-visualizer)
- **Demo Online**: [https://uncuyoapp.github.io/ngx-data-visualizer/](https://uncuyoapp.github.io/ngx-data-visualizer/)

---

<div align="center">

**🧪 Demo desarrollado con ❤️ por el [Área de Políticas Públicas](https://www.uncuyo.edu.ar/politicaspublicas/) - Universidad Nacional de Cuyo**

</div>
