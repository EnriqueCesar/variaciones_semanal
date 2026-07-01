const chartRegistry={};
function money(v){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(v||0)}
function num(v,d=1){return new Intl.NumberFormat('es-MX',{maximumFractionDigits:d}).format(v||0)}
function destroyChart(id){if(chartRegistry[id]){chartRegistry[id].destroy();delete chartRegistry[id];}}
function makeChart(id,type,labels,datasets,options={}){destroyChart(id);const el=document.getElementById(id);if(!el)return;chartRegistry[id]=new Chart(el,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}},tooltip:{callbacks:{label:ctx=>{const raw=ctx.raw||0;return `${ctx.dataset.label}: ${ctx.dataset.money?money(raw):num(raw)}`}}}},scales:{x:{grid:{display:false},ticks:{maxRotation:0,autoSkip:true}},y:{beginAtZero:false,ticks:{callback:v=>options.money?money(v):num(v)}}},...options}});}
function barChart(id,labels,values,label,isMoney=false,color='#006241',horizontal=false){makeChart(id,'bar',labels,[{label,data:values,backgroundColor:color,borderRadius:8,money:isMoney}],{money:isMoney,indexAxis:horizontal?'y':'x'});}
function lineChart(id,labels,datasets,isMoney=false){makeChart(id,'line',labels,datasets.map(d=>({...d,tension:.35,borderWidth:3,pointRadius:3,fill:false,money:isMoney})),{money:isMoney});}
function signedVariationChart(id,labels,missing,surplus,net,isMoney=false){makeChart(id,'bar',labels,[
  {label:isMoney?'Faltante $':'Faltante unidades',data:missing,backgroundColor:'#111827',borderRadius:7,money:isMoney,stack:'v'},
  {label:isMoney?'Sobrante $':'Sobrante unidades',data:surplus,backgroundColor:'#d12b2f',borderRadius:7,money:isMoney,stack:'v'},
  {type:'line',label:isMoney?'Neto $':'Neto unidades',data:net,borderColor:'#006241',backgroundColor:'#006241',tension:.35,borderWidth:3,pointRadius:3,money:isMoney}
],{money:isMoney,scales:{x:{stacked:true,grid:{display:false}},y:{stacked:false,ticks:{callback:v=>isMoney?money(v):num(v)}}}});}
