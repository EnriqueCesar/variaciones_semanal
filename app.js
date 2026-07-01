let RAW=[], CAL=[], FILTERED=[], selectedIngredients=[], currentTab='store', currentSort='impactDesc';
const $=id=>document.getElementById(id);
const norm=s=>(s??'').toString().trim();
const toNumber=v=>{if(v==null||v==='')return 0;if(typeof v==='number')return v;return Number(String(v).replace(/[$,]/g,'').trim())||0};
const uniq=a=>[...new Set(a.filter(v=>v!==''&&v!=null))];
const byAbsImpact=(a,b)=>Math.abs(b.impact)-Math.abs(a.impact);
const monthIdx=m=>CONFIG.monthOrder.indexOf(m);
const weekLabel=w=>'S'+String(w).padStart(2,'0');
const cleanName=s=>norm(s).replace(/\s+/g,' ');

window.addEventListener('DOMContentLoaded',init);
async function init(){
  buildTopSelectors(); bindUI(); showLoading();
  try{await loadExcel(); buildFilters(); applyFilters(); if('serviceWorker'in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});}catch(e){console.error(e); alert('No se pudo cargar el Excel. Revisa que data/Variacion_Semanal.xlsx esté en la raíz correcta del proyecto.');}
}
function showLoading(){['kImpact','kMissing','kSurplus','kScore','kProducts'].forEach(id=>$(id).textContent='...');}
async function loadExcel(){
  const res=await fetch(CONFIG.excelPath,{cache:'no-store'}); const buf=await res.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'});
  const calSheet=wb.Sheets[CONFIG.calendarSheet]; const dataSheet=wb.Sheets[CONFIG.dataSheet];
  CAL=XLSX.utils.sheet_to_json(calSheet,{defval:''}).map(r=>({year:+r['Año'],month:norm(r['Mes']),week:+r['Semana']}));
  const rows=XLSX.utils.sheet_to_json(dataSheet,{header:1,defval:''});
  const headerRow=rows.findIndex(r=>r.some(c=>norm(c)==='División')&&r.some(c=>norm(c)==='Varianza (#)'));
  if(headerRow<0) throw new Error('Encabezados no encontrados');
  const headers=rows[headerRow].map(norm);
  const idx=name=>headers.indexOf(name);
  const calendar=new Map(CAL.map(r=>[`${r.year}-${r.week}`,r.month]));
  RAW=rows.slice(headerRow+1).map(r=>{
    const year=+r[idx('Año')]||0, week=+r[idx('Semana')]||0, qty=toNumber(r[idx('Varianza (#)')]), impact=toNumber(r[idx('Costo de Varianza ($)')]);
    const unit=toNumber(r[idx('Costo Unitario Promedio ($)')]);
    return {division:cleanName(r[idx('División')]),dm:cleanName(r[idx('DM')]),year,week,month:calendar.get(`${year}-${week}`)||'',store:cleanName(r[idx('Tiendas')]),category:cleanName(r[idx('Categoría Inventario')]),ingredient:cleanName(r[idx('Ingrediente')]),unit,qty,impact,type:qty<0?'Sobrante':qty>0?'Faltante':'Sin variación'};
  }).filter(r=>r.year&&r.week&&r.store&&r.ingredient&&(r.qty!==0||r.impact!==0));
}
function buildTopSelectors(){[ $('topN'), $('topMissingN'), $('topSurplusN') ].forEach(sel=>{sel.innerHTML=CONFIG.topOptions.map(n=>`<option ${n===CONFIG.defaultTop?'selected':''}>${n}</option>`).join('')});}
function buildFilters(){
  setOptions('yearFilter',['Todos',...uniq(RAW.map(r=>r.year)).sort()]);
  setOptions('monthFilter',['Todos',...CONFIG.monthOrder.filter(m=>RAW.some(r=>r.month===m))]);
  setOptions('weekFilter',uniq(RAW.map(r=>r.week)).sort((a,b)=>a-b).map(w=>({label:weekLabel(w),value:w})));
  setOptions('dmFilter',['Todos',...uniq(RAW.map(r=>r.dm)).sort()]);
  setOptions('storeFilter',['Todas',...uniq(RAW.map(r=>r.store)).sort()]);
  setOptions('catFilter',['Todas',...uniq(RAW.map(r=>r.category)).sort()]);
  $('ingredientList').innerHTML=uniq(RAW.map(r=>r.ingredient)).sort().map(v=>`<option value="${escapeHtml(v)}"></option>`).join('');
}
function setOptions(id,opts){$(id).innerHTML=opts.map(o=>typeof o==='object'?`<option value="${o.value}">${o.label}</option>`:`<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');}
function bindUI(){
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{currentTab=b.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tabPanel').forEach(p=>p.classList.toggle('active',p.id===currentTab+'Tab'));renderAll();}));
  ['yearFilter','monthFilter','weekFilter','dmFilter','storeFilter','catFilter','metricFilter','topN','topMissingN','topSurplusN'].forEach(id=>$(id).addEventListener('change',applyFilters));
  $('ingredientInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&norm(e.target.value)){addIngredient(e.target.value);e.target.value='';applyFilters();}});
  $('clearBtn').addEventListener('click',()=>{selectedIngredients=[];buildIngredientChips();['yearFilter','monthFilter','dmFilter'].forEach(id=>$(id).value='Todos');$('storeFilter').value='Todas';$('catFilter').value='Todas';[...$('weekFilter').options].forEach(o=>o.selected=false);$('ingredientInput').value='';applyFilters();});
  $('csvBtn').addEventListener('click',exportCSV); $('pdfBtn').addEventListener('click',()=>window.print());
  document.querySelectorAll('.sorts button').forEach(b=>b.addEventListener('click',()=>{currentSort=b.dataset.sort;renderTable();}));
}
function addIngredient(v){v=cleanName(v); if(v&&!selectedIngredients.includes(v)) selectedIngredients.push(v); buildIngredientChips();}
function buildIngredientChips(){ $('ingredientChips').innerHTML=selectedIngredients.map((v,i)=>`<span class="chip">${escapeHtml(v)}<button onclick="removeIngredient(${i})">×</button></span>`).join('');}
window.removeIngredient=i=>{selectedIngredients.splice(i,1);buildIngredientChips();applyFilters();}
function filterBase(){
  const year=$('yearFilter').value, month=$('monthFilter').value, weeks=[...$('weekFilter').selectedOptions].map(o=>+o.value), dm=$('dmFilter').value, store=$('storeFilter').value, cat=$('catFilter').value;
  return RAW.filter(r=>(year==='Todos'||r.year==year)&&(month==='Todos'||r.month===month)&&(!weeks.length||weeks.includes(r.week))&&(dm==='Todos'||r.dm===dm)&&(store==='Todas'||r.store===store)&&(cat==='Todas'||r.category===cat)&&(!selectedIngredients.length||selectedIngredients.includes(r.ingredient)));
}
function applyFilters(){FILTERED=filterBase(); renderAll();}
function renderAll(){renderKPIs();renderTrends();renderRanks();renderUnitCost();renderAlerts();renderDM();renderTable();}
function renderKPIs(){
  const impact=sum(FILTERED,'impact'), missing=sum(FILTERED.filter(r=>r.qty>0),'qty'), surplus=Math.abs(sum(FILTERED.filter(r=>r.qty<0),'qty')); const products=uniq(FILTERED.map(r=>r.ingredient)).length;
  const abs=sum(FILTERED.map(r=>({...r,impact:Math.abs(r.impact)})),'impact'); const score=Math.max(0,Math.min(100,Math.round(100-(abs/Math.max(1,FILTERED.length))/350*100)));
  $('kImpact').textContent=money(impact); $('kMissing').textContent=num(missing); $('kSurplus').textContent=num(surplus); $('kProducts').textContent=num(products,0); $('kRows').textContent=num(FILTERED.length,0)+' registros filtrados'; $('kScore').textContent=score; $('scoreBar').style.width=score+'%';
}
function renderTrends(){
  const weeks=uniq(FILTERED.map(r=>r.week)).sort((a,b)=>a-b); const labels=weeks.map(weekLabel);
  const missMoney=weeks.map(w=>sum(FILTERED.filter(r=>r.week===w&&r.qty>0),'impact'));
  const surpMoney=weeks.map(w=>sum(FILTERED.filter(r=>r.week===w&&r.qty<0),'impact'));
  lineChart('moneyTrend',labels,[{label:'Faltante $',data:missMoney,borderColor:'#111827',backgroundColor:'#111827'},{label:'Sobrante $',data:surpMoney,borderColor:'#d12b2f',backgroundColor:'#d12b2f'}],true);
  const missQty=weeks.map(w=>sum(FILTERED.filter(r=>r.week===w&&r.qty>0),'qty'));
  const surpQty=weeks.map(w=>Math.abs(sum(FILTERED.filter(r=>r.week===w&&r.qty<0),'qty')));
  lineChart('qtyTrend',labels,[{label:'Faltante #',data:missQty,borderColor:'#111827',backgroundColor:'#111827'},{label:'Sobrante #',data:surpQty,borderColor:'#d12b2f',backgroundColor:'#d12b2f'}],false);
}
function aggByIngredient(rows){const m=new Map();rows.forEach(r=>{const k=r.ingredient;const o=m.get(k)||{name:k,qty:0,impact:0,count:0};o.qty+=r.qty;o.impact+=r.impact;o.count++;m.set(k,o)});return [...m.values()];}
function renderRanks(){
 const nM=+$('topMissingN').value||+$('topN').value, nS=+$('topSurplusN').value||+$('topN').value;
 const miss=aggByIngredient(FILTERED.filter(r=>r.qty>0)).sort((a,b)=>b.qty-a.qty).slice(0,nM);
 const surp=aggByIngredient(FILTERED.filter(r=>r.qty<0)).sort((a,b)=>Math.abs(b.qty)-Math.abs(a.qty)).slice(0,nS);
 drawRank('topMissing',miss,'missing'); drawRank('topSurplus',surp.map(x=>({...x,qty:Math.abs(x.qty)})),'surplus');
}
function drawRank(id,arr,type){const max=Math.max(1,...arr.map(x=>Math.abs($('metricFilter').value==='money'?x.impact:x.qty)));$(id).innerHTML=arr.map(x=>{const val=$('metricFilter').value==='money'?Math.abs(x.impact):Math.abs(x.qty);const pct=Math.max(4,Math.round(val/max*100));return `<div class="rankItem"><div class="rankTop"><span>${escapeHtml(x.name)}</span><b>${$('metricFilter').value==='money'?money(x.impact):num(x.qty)}</b></div><div class="rankMeta"><span>${$('metricFilter').value==='money'?num(x.qty)+' unidades':money(x.impact)}</span><span>${x.count} mov.</span></div><div class="miniBar"><i class="${type}" style="width:${pct}%"></i></div></div>`}).join('')||'<p class="note">Sin datos con estos filtros.</p>';}
function selectedProduct(){const all=aggByIngredient(FILTERED).sort(byAbsImpact);return selectedIngredients[0]||all[0]?.name||'';}
function renderUnitCost(){const p=selectedProduct();$('selectedProductLabel').textContent=p||'Sin producto';const rows=FILTERED.filter(r=>r.ingredient===p).sort((a,b)=>a.week-b.week);const weeks=uniq(rows.map(r=>r.week)).sort((a,b)=>a-b);const data=weeks.map(w=>avg(rows.filter(r=>r.week===w).map(r=>r.unit).filter(Boolean)));lineChart('unitCostChart',weeks.map(weekLabel),[{label:'Costo unitario',data,borderColor:'#006241',backgroundColor:'#006241'}],true);}
function renderAlerts(){const ing=aggByIngredient(FILTERED).sort(byAbsImpact);const worst=ing[0];const store=agg(FILTERED,'store').sort(byAbsImpact)[0];const weeks=uniq(FILTERED.map(r=>r.week)).sort((a,b)=>a-b);const last=weeks.at(-1);const prev=weeks.at(-2);const lastImpact=sum(FILTERED.filter(r=>r.week===last),'impact'), prevImpact=sum(FILTERED.filter(r=>r.week===prev),'impact');const trend=Math.abs(lastImpact)>Math.abs(prevImpact)?'empeora':'mejora';$('alerts').innerHTML=[
  alertHtml('Prioridad producto',worst?`${worst.name} · ${money(worst.impact)} · ${num(worst.qty)} und.`:'Sin producto',true),
  alertHtml('Tienda foco',store?`${store.name} · ${money(store.impact)}`:'Sin tienda'),
  alertHtml('Última semana',last?`${weekLabel(last)} · ${money(lastImpact)} vs ${weekLabel(prev||last)} ${money(prevImpact)}`:'Sin semana'),
  alertHtml('Tendencia',trend==='empeora'?'Aumenta el impacto: revisar conteo, merma y transferencia.':'Mejora contra semana anterior: mantener rutina.')
].join('');}
function alertHtml(t,d,danger=false){return `<div class="alert ${danger?'danger':''}"><b>${t}</b><span>${escapeHtml(d)}</span></div>`}
function renderDM(){const stores=agg(FILTERED,'store').sort(byAbsImpact).slice(0,15);barChart('storeImpactChart',stores.map(x=>x.name),stores.map(x=>x.impact),'Impacto $',true,'#006241',true);barChart('storeQtyChart',stores.map(x=>x.name),stores.map(x=>x.qty),'Varianza #',false,'#111827',true);$('storeCards').innerHTML=stores.slice(0,24).map(s=>`<div class="storeCard"><b>${escapeHtml(s.name)}</b><span>${money(s.impact)} · ${num(s.qty)} und.</span></div>`).join('');}
function renderTable(){let rows=[...FILTERED];const sorters={impactDesc:(a,b)=>Math.abs(b.impact)-Math.abs(a.impact),impactAsc:(a,b)=>Math.abs(a.impact)-Math.abs(b.impact),qtyDesc:(a,b)=>Math.abs(b.qty)-Math.abs(a.qty),qtyAsc:(a,b)=>Math.abs(a.qty)-Math.abs(b.qty)};rows.sort(sorters[currentSort]||sorters.impactDesc);$('detailTable').querySelector('tbody').innerHTML=rows.slice(0,800).map(r=>`<tr><td>${escapeHtml(r.dm)}</td><td>${escapeHtml(r.store)}</td><td>${r.month}</td><td>${weekLabel(r.week)}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.ingredient)}</td><td>${money(r.unit)}</td><td>${num(r.qty)}</td><td>${money(r.impact)}</td><td class="${r.qty<0?'typeSurplus':'typeMissing'}">${r.qty<0?'Sobrante':'Faltante'}</td></tr>`).join('');}
function agg(rows,key){const m=new Map();rows.forEach(r=>{const k=r[key]||'Sin dato';const o=m.get(k)||{name:k,qty:0,impact:0,count:0};o.qty+=r.qty;o.impact+=r.impact;o.count++;m.set(k,o)});return [...m.values()];}
function sum(rows,key){return rows.reduce((a,r)=>a+(+r[key]||0),0)}
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function escapeHtml(s){return norm(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function exportCSV(){const rows=[['DM','Tienda','Mes','Semana','Categoria','Ingrediente','Costo Unitario','Varianza #','Impacto $','Tipo'],...FILTERED.map(r=>[r.dm,r.store,r.month,r.week,r.category,r.ingredient,r.unit,r.qty,r.impact,r.type])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='variaciones_filtradas.csv';a.click();URL.revokeObjectURL(a.href);}
