VARIACIONES DE PRODUCTO · MEJORA CONTINUA V3.1 AUDITADA

Carga en GitHub Pages:
1) Descomprime este ZIP.
2) Sube TODO el contenido directo a la raíz del repositorio, no dentro de otra carpeta.
3) En GitHub: Settings > Pages > Deploy from branch > main > /root.
4) Espera el despliegue.

Archivos clave:
- index.html
- style.css
- app.js
- charts.js
- config.js
- manifest.webmanifest
- sw.js
- assets/logo.svg
- assets/icon.svg
- data/Variacion_Semanal.xlsx

Lectura de datos:
- Lee directo data/Variacion_Semanal.xlsx con SheetJS desde el navegador.
- Si GitHub tarda o se usa localmente, usa el botón Cambiar Excel.
- Detecta automáticamente la fila real de encabezados. Usa hoja Variacion_Semanal y, si existe, Base_Mes_Semana para Año > Mes > Semana.

Regla operativa:
- Varianza negativa = SOBRANTE, color rojo.
- Varianza positiva = FALTANTE, color negro.
- Costo de Varianza = impacto monetario.

Mejoras V3.1:
- Filtros dinámicos DM, tienda, tipo, categoría, ingrediente, año, mes, semana, enfoque y top.
- Top configurable 10, 15, 20, 25, 30.
- Vista por dinero o por cantidad.
- Alertas inmediatas.
- Tendencia por semana/mes.
- Faltantes vs sobrantes.
- Pareto 80/20.
- Heatmap semanal.
- Ranking de oportunidad por tienda o categoría.
- Detalle exportable en CSV.

Nota:
Este proyecto usa CDN para Chart.js y SheetJS, evitando archivos pesados. Cada archivo queda debajo de 20 MB.
