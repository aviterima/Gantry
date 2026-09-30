// RFC 4180-style quoted fields; every import is validated again by the kernel.
export function parseSignalsCSV(input){
 if(typeof input!=='string'||input.length>500000)throw {status:422,detail:'CSV must be text under 500 KB'};
 const rows=[];let row=[],field='',quoted=false;
 input=input.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'){if(input[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=c;}
 else if(c==='"'){if(field)throw {status:422,detail:'Malformed CSV quote'};quoted=true;}
 else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw {status:422,detail:'Unclosed CSV quote'};if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}
 const headers=rows.shift()||[];const allowed=['id','event_type','timestamp','actor','channel','angle','value_cents','order_id','unprompted','pure_outbound','crm_stage','details'];
 if(new Set(headers).size!==headers.length||headers.some(h=>!allowed.includes(h))||['id','event_type','timestamp','actor'].some(k=>!headers.includes(k)))throw {status:422,detail:'Invalid or missing CSV headers'};
 return rows.filter(r=>r.some(Boolean)).map(r=>{if(r.length!==headers.length)throw {status:422,detail:'CSV column count mismatch'};const e=Object.fromEntries(headers.map((k,i)=>[k,r[i]]));
 for(const k of ['unprompted','pure_outbound'])if(k in e){if(!['','true','false'].includes(e[k]))throw {status:422,detail:'CSV boolean must be true or false'};e[k]=e[k]==='true';}
 if('value_cents'in e){if(!/^\d*$/.test(e.value_cents))throw {status:422,detail:'value_cents must be a nonnegative integer'};e.value_cents=Number(e.value_cents);}
 return e;});
}
