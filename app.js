const $=id=>document.getElementById(id);
const state={raw:[],rows:[],weekMap:new Map(),selectedItem:null,trendRows:[],topRows:[],storeRows:[],detailRows:[]};
const controls=['dmFilter','storeFilter','typeFilter','catFilter','itemSearch','yearFilter','monthFilter','weekFilter','sideFilter','metricFilter','topFilter'];
const norm=s=>String(s??'').trim();
const money=s=>{if(s==null||s==='')return 0;let x=String(s).replace(/[$,\s]/g,''); if(x==='-'||x==='')return 0; return Number(x)||0};
const num=s=>{if(s==null||s==='')return 0;return Number(String(s).replace(/[,\s]/g,''))||0};
const cleanKey=s=>norm(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const monthOrder=CONFIG.monthOrder;

window.addEventListener('load',init);
async function init(){
  bind();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  try{await loadExcelUrl(CONFIG.excelPath)}catch(e){$('dataStatus').textContent='No se pudo cargar automático. Usa Cambiar Excel.';console.warn(e)}
}
function bind(){
  controls.forEach(id=>$(id)?.addEventListener(id==='itemSearch'?'input':'change',apply));
  $('fileInput').addEventListener('change',e=>{const f=e.target.files[0]; if(f) loadExcelFile(f)});
  $('resetBtn').addEventListener('click',resetFilters);
  document.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>exportCSV(b.dataset.export)));
}
async function loadExcelUrl(path){const r=await fetch(path); if(!r.ok)throw new Error('fetch'); const b=await r.arrayBuffer(); parseWorkbook(XLSX.read(b,{type:'array'}));}
function loadExcelFile(file){const fr=new FileReader();fr.onload=e=>parseWorkbook(XLSX.read(e.target.result,{type:'array'}));fr.readAsArrayBuffer(file)}
function sheetJsonSmart(ws,required=['Año','Semana']){
  const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',blankrows:false});
  let headerIndex=0;
  for(let i=0;i<Math.min(matrix.length,15);i++){
    const row=matrix[i].map(v=>norm(v));
    const hits=required.filter(k=>row.includes(k)).length;
    if(hits>=required.length){headerIndex=i;break}
  }
  return XLSX.utils.sheet_to_json(ws,{defval:'',range:headerIndex});
}
function parseWorkbook(wb){
  state.weekMap=new Map();
  const ws=wb.Sheets[CONFIG.preferredSheet]||wb.Sheets[wb.SheetNames.find(n=>/variacion/i.test(n))]||wb.Sheets[wb.SheetNames[0]];
  const weekWs=wb.Sheets[CONFIG.weekSheet]||wb.Sheets[wb.SheetNames.find(n=>/base|mes|semana/i.test(n))];
  if(weekWs){sheetJsonSmart(weekWs,['Año','Semana']).forEach(r=>{const y=norm(r['Año']||r['Anio']); const w=Number(r['Semana']); const m=norm(r['Mes']); if(y&&w&&m) state.weekMap.set(`${y}-${w}`,m);});}
  const raw=sheetJsonSmart(ws,['Año','Semana','Tiendas']);
  state.raw=raw.map(toRow).filter(r=>r.year&&r.week&&r.store&&r.item);
  state.selectedItem=null; hydrateFilters(); apply();
  $('dataStatus').textContent=`${state.raw.length.toLocaleString('es-MX')} registros cargados · ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}`;
}
function toRow(r){
  const year=Number(r['Año']||r['Anio']||r['Year']); const week=Number(r['Semana']||r['Week']);
  const month=norm(r['Mes'])||state.weekMap.get(`${year}-${week}`)||'';
  const qty=num(r['Varianza (#)']||r['Varianza']||r['Cantidad']);
  const cost=money(r['Costo de Varianza ($)']||r['Costo de Varianza']||r['Impacto']);
  const unit=money(r['Costo Unitario Promedio ($)']||r['Costo Unitario Promedio']);
  const cat=norm(r['Categoría Inventario']||r['Categoria Inventario']||r['Familia']||'Sin categoría');
  return {division:norm(r['División']||r['Division']),dm:norm(r['DM']||'Sin DM'),year,month,week,store:norm(r['Tiendas']||r['Tienda']),cat,item:norm(r['Ingrediente']||r['Producto']),unit,qty,cost,absCost:Math.abs(cost),absQty:Math.abs(qty),side:qty<0?'sobrante':qty>0?'faltante':'cero',type:norm(r['Tipo tienda']||r['Formato de Tienda\n (Tipo tienda 1)']||r['Formato de Tienda']||'Sin tipo')};
}
function hydrateFilters(){
  fill('dmFilter',uniq(state.raw.map(r=>r.dm)),'Todos los DM'); fill('storeFilter',uniq(state.raw.map(r=>r.store)),'Todas las tiendas');
  fill('typeFilter',uniq(state.raw.map(r=>r.type)),'Todos los tipos'); fill('catFilter',uniq(state.raw.map(r=>r.cat)),'Todas las categorías');
  fill('yearFilter',uniq(state.raw.map(r=>r.year)).sort(),'Todos'); fill('monthFilter',monthOrder.filter(m=>state.raw.some(r=>r.month===m)),'Todos');
  fill('weekFilter',uniq(state.raw.map(r=>r.week)).sort((a,b)=>a-b).map(w=>'S'+w),'Todas');
}
function fill(id,arr,all){$(id).innerHTML=`<option value="">${all}</option>`+arr.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}
function uniq(a){return [...new Set(a.filter(v=>v!==''&&v!=null))]}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function resetFilters(){controls.forEach(id=>{if(id==='itemSearch')$(id).value=''; else if(id==='topFilter')$(id).value='20'; else if(id==='metricFilter')$(id).value='money'; else if(id==='sideFilter')$(id).value='all'; else $(id).value='';});apply()}
function apply(){
  const f={dm:$('dmFilter').value,store:$('storeFilter').value,type:$('typeFilter').value,cat:$('catFilter').value,year:$('yearFilter').value,month:$('monthFilter').value,week:$('weekFilter').value.replace('S',''),side:$('sideFilter').value,search:cleanKey($('itemSearch').value),metric:$('metricFilter').value,top:Number($('topFilter').value)||20};
  let rows=state.raw.filter(r=>(!f.dm||r.dm===f.dm)&&(!f.store||r.store===f.store)&&(!f.type||r.type===f.type)&&(!f.cat||r.cat===f.cat)&&(!f.year||String(r.year)===String(f.year))&&(!f.month||r.month===f.month)&&(!f.week||String(r.week)===String(f.week))&&(!f.search||cleanKey(r.item).includes(f.search))&&(f.side==='all'||r.side===f.side));
  state.rows=rows; if(!rows.length){blank();return}
  state.selectedItem=state.selectedItem&&rows.some(r=>r.item===state.selectedItem)?state.selectedItem:topBy(rows,'item','absCost')[0]?.key;
  renderKpis(rows); renderAlerts(rows); renderTrend(rows,f); renderMix(rows); renderTop(rows,f); renderPareto(rows,f); renderSelected(rows,f); renderStore(rows,f); renderHeat(rows,f); renderTable(rows,f);
}
function blank(){$('kpiImpact').textContent='$0';$('alertsList').innerHTML='<div class="alert">Sin datos con estos filtros.</div>';['topBars','storeRanking','heatmap'].forEach(id=>$(id).innerHTML='');$('detailTable').innerHTML=''}
function sum(a,k){return a.reduce((t,r)=>t+(r[k]||0),0)}
function topBy(rows,key,metric){const m=new Map();rows.forEach(r=>{const o=m.get(r[key])||{key:r[key],cost:0,qty:0,absCost:0,absQty:0,rows:0};o.cost+=r.cost;o.qty+=r.qty;o.absCost+=r.absCost;o.absQty+=r.absQty;o.rows++;m.set(r[key],o)});return [...m.values()].sort((a,b)=>b[metric]-a[metric])}
function renderKpis(rows){
 const sCost=sum(rows,'cost'), abs=sum(rows,'absCost'), sob=rows.filter(r=>r.side==='sobrante'), fal=rows.filter(r=>r.side==='faltante');
 $('kpiImpact').textContent=ChartHub.fmt(sCost); $('kpiRecords').textContent=`${rows.length.toLocaleString('es-MX')} registros · impacto absoluto ${ChartHub.fmt(abs)}`;
 $('kpiSobrantes').textContent=ChartHub.fmt(sum(sob,'cost')); $('kpiSobrantesQty').textContent=`${ChartHub.fmt(sum(sob,'qty'),'qty')} unidades sobrantes`;
 $('kpiFaltantes').textContent=ChartHub.fmt(sum(fal,'cost')); $('kpiFaltantesQty').textContent=`${ChartHub.fmt(sum(fal,'qty'),'qty')} unidades faltantes`;
 const score=Math.max(0,Math.round(100-Math.min(100,abs/Math.max(1,rows.length)/80))); $('kpiScore').textContent=score; $('kpiTrend').textContent=score>=80?'Controlado':score>=60?'Atención':'Acción inmediata';
}
function renderAlerts(rows){
 const topItem=topBy(rows,'item','absCost')[0], topStore=topBy(rows,'store','absCost')[0];
 const fal=sum(rows.filter(r=>r.side==='faltante'),'absCost'), sob=sum(rows.filter(r=>r.side==='sobrante'),'absCost');
 const dom=fal>sob?'faltantes':'sobrantes';
 $('alertsList').innerHTML=[
  {c:dom==='faltantes'?'black':'red',t:`Mayor foco: ${dom}`,d:`${ChartHub.fmt(Math.max(fal,sob))} de impacto absoluto`},
  {c:'red',t:`Producto crítico`,d:`${topItem?.key||'-'} · ${ChartHub.fmt(topItem?.absCost||0)}`},
  {c:'black',t:`Tienda con oportunidad`,d:`${topStore?.key||'-'} · ${ChartHub.fmt(topStore?.absCost||0)}`}
 ].map(a=>`<div class="alert ${a.c}"><b>${a.t}</b><span>${a.d}</span></div>`).join('')
}
function groupTrend(rows,period='week',metric='money'){const m=new Map();rows.forEach(r=>{const key=period==='month'?`${r.year}-${r.month}`:`${r.year}-S${r.week}`;const sort=period==='month'?r.year*100+monthOrder.indexOf(r.month):r.year*100+r.week;const o=m.get(key)||{key,sort,cost:0,qty:0,sobrante:0,faltante:0};o.cost+=r.cost;o.qty+=r.qty;if(r.side==='sobrante')o.sobrante+=Math.abs(metric==='money'?r.cost:r.qty);if(r.side==='faltante')o.faltante+=Math.abs(metric==='money'?r.cost:r.qty);m.set(key,o)});return [...m.values()].sort((a,b)=>a.sort-b.sort)}
function renderTrend(rows,f){const t=groupTrend(rows,f.month?'week':'month',f.metric);state.trendRows=t;const val=k=>f.metric==='money'?k.cost:k.qty;ChartHub.make('trendChart','line',{labels:t.map(x=>x.key),datasets:[{label:f.metric==='money'?'Impacto $':'Varianza #',data:t.map(val),borderColor:'#00563f',backgroundColor:'rgba(0,86,63,.12)',fill:true,tension:.25,pointRadius:4}]},{legend:false,metric:f.metric,scales:{y:{ticks:{callback:v=>ChartHub.fmt(v,f.metric)}}}})}
function renderMix(rows){const sob=rows.filter(r=>r.side==='sobrante'),fal=rows.filter(r=>r.side==='faltante');ChartHub.make('mixChart','doughnut',{labels:['Sobrantes','Faltantes'],datasets:[{data:[sum(sob,'absCost'),sum(fal,'absCost')],backgroundColor:['#d92d2d','#111']} ]},{metric:'money'})}
function renderTop(rows,f){const metric=f.metric==='money'?'absCost':'absQty';const top=topBy(rows,'item',metric).slice(0,f.top);state.topRows=top;$('topTitle').textContent=`Top ${f.top} ${f.side==='all'?'impacto':f.side} por ingrediente`;const max=Math.max(...top.map(x=>x[metric]),1);$('topBars').innerHTML=top.map(x=>{const side=x.qty<0?'red':'black';const w=Math.max(3,Math.round(x[metric]/max*100));return `<div class="barRow" data-item="${esc(x.key)}"><div class="barLabel" title="${esc(x.key)}">${esc(x.key)}</div><div class="barTrack"><div class="barFill ${side}" style="width:${w}%"></div></div><div class="money">${ChartHub.fmt(x.cost)}</div><div class="qty">${ChartHub.fmt(x.qty,'qty')} u</div></div>`}).join('');document.querySelectorAll('.barRow').forEach(e=>e.onclick=()=>{state.selectedItem=e.dataset.item;renderSelected(state.rows,{metric:$('metricFilter').value})})}
function renderPareto(rows,f){const metric=f.metric==='money'?'absCost':'absQty';const top=topBy(rows,'item',metric).slice(0,12);let total=sum(top,metric)||1, acc=0;ChartHub.make('paretoChart','bar',{labels:top.map(x=>x.key.slice(0,16)),datasets:[{type:'bar',label:f.metric==='money'?'Impacto':'Cantidad',data:top.map(x=>x[metric]),backgroundColor:'#0b6b4e'},{type:'line',label:'Acum %',data:top.map(x=>{acc+=x[metric];return Math.round(acc/total*100)}),borderColor:'#b87800',yAxisID:'p'}]},{metric:f.metric,scales:{y:{ticks:{callback:v=>ChartHub.fmt(v,f.metric)}},p:{position:'right',min:0,max:100,ticks:{callback:v=>v+'%'}}}})}
function renderSelected(rows,f){const item=state.selectedItem;if(!item)return;const rs=rows.filter(r=>r.item===item);$('selectedName').textContent=`${item} · costo unitario y variación`;const t=groupTrend(rs,'week',f.metric);ChartHub.make('unitCostChart','line',{labels:t.map(x=>x.key),datasets:[{label:'Costo unitario promedio',data:t.map(x=>{const rr=rs.filter(r=>`${r.year}-S${r.week}`===x.key&&r.unit);return rr.length?sum(rr,'unit')/rr.length:0}),borderColor:'#00563f',backgroundColor:'rgba(0,86,63,.08)',fill:true,tension:.2}]},{metric:'money',scales:{y:{ticks:{callback:v=>ChartHub.fmt(v)}}}});ChartHub.make('itemTrendChart','bar',{labels:t.map(x=>x.key),datasets:[{label:'Sobrante',data:t.map(x=>-x.sobrante),backgroundColor:'#d92d2d'},{label:'Faltante',data:t.map(x=>x.faltante),backgroundColor:'#111'}]},{metric:f.metric,scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:v=>ChartHub.fmt(v,f.metric)}}}})}
function renderStore(rows,f){const metric=f.metric==='money'?'absCost':'absQty';const top=topBy(rows,$('storeFilter').value?'cat':'store',metric).slice(0,10);state.storeRows=top;$('storeRanking').innerHTML=top.map((x,i)=>`<div class="rankItem"><div><b>${i+1}. ${esc(x.key)}</b><br><small>${ChartHub.fmt(x.qty,'qty')} u · ${x.rows} mov.</small></div><b>${ChartHub.fmt(x.cost)}</b></div>`).join('')}
function renderHeat(rows,f){const metric=f.metric==='money'?'absCost':'absQty';const t=groupTrend(rows,'week',f.metric);const max=Math.max(...t.map(x=>Math.abs(x.cost)),1);$('heatmap').innerHTML=t.map(x=>{const cls=x.cost<0?'red':x.cost>0?'black':'';const op=.18+.55*(Math.abs(x.cost)/max);return `<div class="heatCell ${cls}" style="opacity:${op}"><strong>${x.key}</strong><small>${ChartHub.fmt(x.cost)}<br>${ChartHub.fmt(x.qty,'qty')} u</small></div>`}).join('')}
function renderTable(rows){const top=rows.slice().sort((a,b)=>b.absCost-a.absCost).slice(0,CONFIG.maxTableRows);state.detailRows=top;$('detailTable').innerHTML='<thead><tr><th>DM</th><th>Tienda</th><th>Mes</th><th>Semana</th><th>Categoría</th><th>Ingrediente</th><th>Tipo</th><th>Varianza</th><th>Costo</th><th>Costo unit.</th></tr></thead><tbody>'+top.map(r=>`<tr><td>${esc(r.dm)}</td><td>${esc(r.store)}</td><td>${esc(r.month)}</td><td>S${r.week}</td><td>${esc(r.cat)}</td><td>${esc(r.item)}</td><td><span class="tag ${r.side==='sobrante'?'red':'black'}">${r.side}</span></td><td>${ChartHub.fmt(r.qty,'qty')}</td><td>${ChartHub.fmt(r.cost)}</td><td>${ChartHub.fmt(r.unit)}</td></tr>`).join('')+'</tbody>'}
function exportCSV(kind){const maps={trend:state.trendRows,top:state.topRows,store:state.storeRows,detail:state.detailRows};let rows=maps[kind]||[]; if(!rows.length)return; const headers=Object.keys(rows[0]).filter(k=>k!=='rows'); const csv=[headers.join(',')].concat(rows.map(r=>headers.map(h=>'"'+String(r[h]??'').replace(/"/g,'""')+'"').join(','))).join('\n'); const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`variaciones_${kind}.csv`;a.click();URL.revokeObjectURL(a.href)}
