VARIACIONES DE PRODUCTO · V2 LIGERA

Objetivo
- Dashboard PWA limpio para tomar decisiones rápidas sobre variaciones de producto.
- Funciona en GitHub Pages y mantiene cada archivo por debajo de 20 MB.

Cómo subir a GitHub
1. Descomprime el ZIP.
2. Sube TODO el contenido directamente a la raíz del repositorio.
3. En GitHub: Settings > Pages > Deploy from a branch > main > /(root).
4. Espera el despliegue.

Archivos principales
- index.html: entrada del dashboard.
- style.css: diseño limpio ejecutivo.
- app.js: filtros, cálculos, tabla, exportación.
- charts.js: gráficas.
- config.js: configuración general.
- manifest.webmanifest y sw.js: PWA.
- data/Variacion_Semanal.xlsx: archivo base de información.
- assets/logo.svg e icon.svg: identidad genérica del proyecto.

Lectura de datos
- El dashboard lee directamente data/Variacion_Semanal.xlsx.
- Usa la hoja Variacion_Semanal para datos.
- Usa Base_Mes_Semana para convertir Semana a Mes.
- Si el Excel no carga por caché o ruta, usa el botón Cargar Excel.

Reglas de lectura
- Varianza (#) negativa = sobrante en conteo.
- Varianza (#) positiva = faltante.
- Costo de Varianza ($) = impacto monetario.

Enfoque de mejora continua
- Prioriza productos con mayor impacto absoluto.
- Permite ver tendencia semanal en dinero y unidades.
- Pareto 80/20 ayuda a enfocar pocas causas de alto impacto.
- Heatmap muestra semanas críticas rápidamente.
- Ranking separa faltantes y sobrantes.

Nota
- El campo Tipo tienda queda preparado para integrar catálogo de tiendas. Si el Excel base incluye un catálogo por tienda, puede conectarse en app.js sin cambiar la experiencia.
