const ChartHub=(()=>{const charts={};
function kill(id){if(charts[id]){charts[id].destroy();delete charts[id];}}
function fmt(v,metric='money'){return metric==='qty'?Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(v):Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(v)}
function make(id,type,data,opts={}){kill(id);const ctx=document.getElementById(id);if(!ctx)return;charts[id]=new Chart(ctx,{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:opts.legend??true,position:'bottom'},tooltip:{callbacks:{label:(c)=>`${c.dataset.label||''}: ${fmt(c.raw,opts.metric)}`}}},scales:opts.scales||{},...opts.extra}})}
return{make,fmt};})();
