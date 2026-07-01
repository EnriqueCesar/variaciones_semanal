VARIACIONES DE PRODUCTO · Dashboard PWA

Proyecto listo para GitHub Pages / PWA.

ARCHIVOS PRINCIPALES
- index.html: estructura del dashboard.
- style.css: diseño responsive verde premium.
- app.js: filtros dinámicos, KPIs, tablas, exportación CSV e instalación PWA.
- charts.js: motor gráfico canvas sin dependencias externas.
- config.js: configuración general.
- data/data.json: base optimizada generada desde Variacion_Semanal.xlsx.
- data/Variacion_Semanal.xlsx: archivo fuente incluido como respaldo.
- assets/logo.svg: logotipo genérico del proyecto.
- manifest.webmanifest + sw.js: soporte PWA/offline.

LÓGICA OPERATIVA
- Varianza (#) = cantidad.
- Costo de Varianza ($) = impacto monetario.
- Varianza negativa = SOBRANTE EN CONTEO. Se muestra en rojo.
- Varianza positiva = FALTANTE. Se muestra en negro.
- El mes se calcula con la pestaña Base_Mes_Semana, evitando depender de celdas de mes en blanco.

CÓMO PUBLICAR EN GITHUB
1. Sube el contenido de esta carpeta al repositorio.
2. Activa GitHub Pages desde Settings > Pages.
3. Selecciona la rama main y carpeta root.
4. Abre la URL generada.

CÓMO PROBAR LOCAL
Abre index.html directo en Chrome. Para comportamiento PWA completo, usa un servidor local:
python -m http.server 8000
Luego abre http://localhost:8000
