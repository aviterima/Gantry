import {parseSignalsCSV} from './csv.mjs';
// One deterministic lifecycle implementation for Node/FastAPI and Workers.
export const EVENTS=['visit','form_start','scroll','qualified_capture','booking','activation','return','payment','delivered','refund','spend','crm_stage','sent','email_delivered','email_open','reply','positive_reply','impression','engagement','click','dm','unsubscribe','complaint','bounce'];
export const STAGES=['Captured','Qualified','Conversation','Pilot/Paid','Retained','Disqualified'];
export const CHECKS=['brand','domain','landing','privacy','email_plan','social_plan','crm_pipeline','instrumentation'];
export const WINDDOWN=['customer_notice','data_export','refunds_reviewed','opt_outs','domain_retention'];
export const PROMOTION=['entity_and_equity','operator_terms','data_handover','cluster_access_terms','handoff_verified','playbook_retained'];
const DAY=86400000;
const fail=(message,status=422)=>{throw {status,detail:message};};
const need=(condition,message,status=422)=>{if(!condition)fail(message,status);};
const text=(v,name)=>{need(typeof v==='string'&&v.trim().length>0&&v.length<=10000,`${name} is required (maximum 10000 characters)`);return v.trim();};
const slug=v=>{need(typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(v),'Invalid identifier');return v;};
const num=(v,name,min=1,max=100000000)=>{need(typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max,`Invalid ${name}`);return v;};
const integer=(v,name,min=1,max=100000000)=>{num(v,name,min,max);need(Number.isInteger(v),`${name} must be an integer`);return v;};
const date=v=>{need(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v)&&Number.isFinite(Date.parse(v)),'Use a UTC ISO timestamp');need(new Date(v).toISOString().slice(0,19)===v.slice(0,19),'Invalid calendar date');return new Date(v).toISOString();};
const choose=(v,values,name)=>{need(values.includes(v),`Invalid ${name}`);return v;};
const email=v=>{v=text(v,'Email').toLowerCase();need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),'Invalid email');return v;};
const copy=v=>structuredClone(v);
export const initial=()=>({revision:0,tournaments:{},launches:{},signals:[],claims:{},suppression:[],audit:[],learnings:[]});
export function defaultPlan(mode='service_first') {
 return {g1:{days:7,budget_cents:50000,targets:{visitors:20,captures:2,capture_rate:0.05}},g2:{days:7,budget_cents:75000,targets:mode==='service_first'?{paid_delivered:3}:{activations:3,week2_returns:1}},g3:{days:7,budget_cents:75000,targets:{payers:3,outbound_payers:1,repeat_payers:1}}};
}
export function validatePlan(plan,mode,overall) {
 need(plan&&typeof plan==='object'&&Object.keys(plan).sort().join(',')==='g1,g2,g3','Save a structured G1–G3 execution plan before G0');
 for(const gate of ['g1','g2','g3']) {
  const p=plan[gate];need(p&&p.targets&&typeof p.targets==='object','Invalid gate plan');integer(p.days,'gate days',1,90);integer(p.budget_cents,'gate budget');
  const required=gate==='g1'?['visitors','captures','capture_rate']:gate==='g2'?(mode==='service_first'?['paid_delivered']:['activations','week2_returns']):['payers','outbound_payers','repeat_payers'];
  need(Object.keys(p.targets).sort().join(',')===[...required].sort().join(','),`Use the required ${gate.toUpperCase()} metrics: ${required.join(', ')}`);
  for(const [k,v] of Object.entries(p.targets)) k==='capture_rate'?num(v,k,0.000001,1):integer(v,k);
 }
 if(overall){need(Object.values(plan).reduce((n,p)=>n+p.days,0)<=overall.time_cap_weeks*7,'Gate days exceed the G0 time cap');need(Object.values(plan).reduce((n,p)=>n+p.budget_cents,0)<=overall.budget_cap_usd*100,'Gate budgets exceed the G0 budget cap');}
 return plan;
}
export function metrics(s,l) {
 const events=s.signals.filter(e=>e.launch_id===l.id);
 const actors=type=>new Set(events.filter(e=>e.event_type===type).map(e=>e.actor));
 const visitors=actors('visit');const captures=new Set(events.filter(e=>e.event_type==='qualified_capture'&&events.some(v=>v.event_type==='visit'&&v.actor===e.actor&&v.timestamp<=e.timestamp)).map(e=>e.actor));
 const orders=new Map();for(const e of events.filter(e=>e.event_type==='payment')){if(!orders.has(e.order_id))orders.set(e.order_id,e);}
 for(const e of events.filter(e=>e.event_type==='refund'))orders.delete(e.order_id);
 const byActor=new Map();for(const p of orders.values()){byActor.set(p.actor,(byActor.get(p.actor)||0)+1);}
 const delivered=new Set(events.filter(e=>e.event_type==='delivered'&&orders.has(e.order_id)&&orders.get(e.order_id).actor===e.actor&&orders.get(e.order_id).timestamp<=e.timestamp).map(e=>e.order_id));
 const returned=new Set(events.filter(e=>e.event_type==='return'&&e.unprompted&&events.some(a=>a.event_type==='activation'&&a.actor===e.actor&&Date.parse(e.timestamp)-Date.parse(a.timestamp)>=7*DAY&&Date.parse(e.timestamp)-Date.parse(a.timestamp)<=14*DAY)).map(e=>e.actor));
 return {visitors:visitors.size,captures:captures.size,capture_rate:visitors.size?captures.size/visitors.size:0,activations:actors('activation').size,week2_returns:returned.size,paid_delivered:delivered.size,payers:byActor.size,outbound_payers:new Set([...orders.values()].filter(e=>e.channel==='email'&&e.pure_outbound).map(e=>e.actor)).size,repeat_payers:[...byActor.values()].filter(n=>n>=2).length,revenue_cents:[...orders.values()].reduce((n,e)=>n+e.value_cents,0),spend_cents:events.filter(e=>e.event_type==='spend').reduce((n,e)=>n+e.value_cents,0),gate_spend_cents:events.filter(e=>e.event_type==='spend'&&e.timestamp>=l.gate_started_at).reduce((n,e)=>n+e.value_cents,0),unattributed_visits:events.filter(e=>e.event_type==='visit'&&e.channel==='direct/unknown').length,channel_summary:[...new Set(events.map(e=>e.channel))].map(channel=>{const es=events.filter(e=>e.channel===channel),spend=es.filter(e=>e.event_type==='spend').reduce((n,e)=>n+e.value_cents,0),paying=new Set([...orders.values()].filter(e=>e.channel===channel).map(e=>e.actor)).size;return {channel,events:es.length,payers:paying,spend_cents:spend,cost_per_payer_cents:paying?spend/paying:null,complaints:es.filter(e=>e.event_type==='complaint').length,bounces:es.filter(e=>e.event_type==='bounce').length};}),signal_ids:events.map(e=>e.id)};
}
export function launchView(s,l,now) {
 const m=metrics(s,l),p=l.plan[l.gate],extension=l.extensions[l.gate];
 const deadline=p&&l.gate_started_at?new Date(Date.parse(extension?.at||l.gate_started_at)+(extension?.days||p?.days||0)*DAY).toISOString():null;
 const budget=(p?.budget_cents||0)+(extension?.budget_cents||0)+(l.gate==='g3'?(l.concentration?.budget_cents||0):0);
 const passed=!!p&&Object.entries(p.targets).every(([k,v])=>m[k]>=v);
 const cap=!!deadline&&(now>=deadline||m.gate_spend_cents>=budget);
 return {...l,metrics:m,deadline,budget_cents:budget,days_remaining:deadline?Math.max(0,(Date.parse(deadline)-Date.parse(now))/DAY):null,gate_passed:passed,cap_reached:cap,queued:l.status==='active'&&(passed||cap),recommendation:passed?'pass':cap?'kill':'observe'};
}
export function view(s,now) {
 const launches=Object.values(s.launches).map(l=>launchView(s,l,now)).sort((a,b)=>(Number(b.concentration?.pending)-Number(a.concentration?.pending))||(b.metrics.repeat_payers-a.metrics.repeat_payers)||(b.metrics.payers-a.metrics.payers));
 const tournaments=Object.values(s.tournaments).map(t=>{const ls=launches.filter(l=>l.tournament_id===t.id);return {...t,launches:ls.length,active:ls.filter(l=>l.status==='active').length,clustered:ls.filter(l=>l.candidate.cluster).length,vertical:ls.filter(l=>l.candidate.lane==='vertical').length,review_due:now>=t.review_at};});
 return {...s,launches,tournaments,connections:[{name:'Neubloc email',status:'Unverified — CSV only'},{name:'Vox social',status:'Unverified — CSV only'},{name:'Forum CRM',status:'Unverified — CSV only'}],limits:{state_bytes:JSON.stringify(s).length,max_state_bytes:1800000},queue:launches.filter(l=>l.queued||l.concentration?.pending||l.status==='promotion_review'||l.status==='winding_down').map(l=>l.id)};
}
function event(raw,l,now) {
 need(raw&&typeof raw==='object'&&!Array.isArray(raw),'Invalid signal');
 const e={id:slug(raw.id),launch_id:l.id,event_type:choose(raw.event_type,EVENTS,'event type'),timestamp:date(raw.timestamp),actor:text(raw.actor,'Actor').trim().toLowerCase(),channel:choose(raw.channel||'direct/unknown',['email','social','web','referral','direct/unknown'],'channel'),angle:typeof raw.angle==='string'?raw.angle.trim():'',value_cents:integer(raw.value_cents??0,'value cents',0),order_id:raw.order_id?slug(raw.order_id):null,unprompted:raw.unprompted===true,pure_outbound:raw.pure_outbound===true,crm_stage:raw.crm_stage||null,details:typeof raw.details==='string'?raw.details.slice(0,4000):''};
 need(e.timestamp<=now,'Future signals are not allowed');need(e.timestamp>=l.started_at,'Signal predates activation');
 if(!e.angle||e.angle==='unknown'||e.channel==='direct/unknown'){e.channel='direct/unknown';e.angle='unknown';}
 if(['payment','refund','delivered'].includes(e.event_type))need(e.order_id,'Order ID required');
 if(['payment','spend'].includes(e.event_type))need(e.value_cents>0,'Positive cents required');
 if(e.event_type==='crm_stage')choose(e.crm_stage,STAGES,'CRM stage');
 return e;
}
export function command(original,c,context) {
 const s=copy(original),{actor,candidates=[]}=context;const now=date(context.now);
 need(c&&typeof c==='object'&&!Array.isArray(c),'Invalid command');
 need(Number.isInteger(c.revision)&&c.revision===s.revision,'State changed; reload and try again',409);
 text(actor,'Authenticated reviewer');date(now);
 let l=c.launch_id?s.launches[c.launch_id]:null;
 if(c.launch_id)need(l,'Launch not found',404);
 const editable=()=>need(l&&!['killed','promoted'].includes(l.status),'Launch is closed',409);
 switch(c.action){
 case 'tournament.create':{
  const id=slug(c.id);need(!s.tournaments[id],'Tournament already exists',409);
  s.tournaments[id]={id,name:text(c.name,'Name'),reviewer:email(c.reviewer),capacity:integer(c.capacity,'capacity',1,20),review_at:date(c.review_at),mode:choose(c.mode,['sandbox','csv'],'mode'),created_at:now};need(Object.values(s.tournaments).filter(t=>t.reviewer===s.tournaments[id].reviewer).every(t=>t.capacity===s.tournaments[id].capacity),'Use the same reviewer capacity across tournaments');break;}
 case 'tournament.schedule':{const t=s.tournaments[c.tournament_id];need(t,'Tournament not found',404);t.review_at=date(c.review_at);break;}
 case 'launch.create':{
  const candidate=candidates.find(x=>x.slug===c.candidate_id);need(candidate?.decision?.approved,'A signed G0 approval is required');
  need(!Object.values(s.launches).some(x=>x.candidate.slug===candidate.slug),'Candidate already launched',409);
  const tournament=s.tournaments[c.tournament_id];need(tournament,'Tournament not found',404);
  const plan=copy(candidate.thresholds.execution_plan);validatePlan(plan,candidate.delivery_mode,candidate.thresholds);
  const id=slug(candidate.slug);s.launches[id]={id,name:candidate.name,candidate:copy(candidate),tournament_id:tournament.id,mode:tournament.mode,plan,gate:'g1',status:'preparing',checklist:{},created_at:now,started_at:null,gate_started_at:null,extensions:{},decisions:[],concentration:null,promotion:{},winddown:{},operator:candidate.operator||null,playbook:{},brand:{headline:candidate.one_liner,offer: candidate.delivery_mode==='service_first'?'Request a scoped engagement':'Join the product test',price_signal:'Discuss scope and price',privacy:'Testing only. Do not enter sensitive or real customer information.'}};break;}
 case 'launch.configure':{
  need(l?.status==='preparing','Launch configuration locks at activation',409);
  if(c.brand){for(const key of ['headline','offer','price_signal','privacy'])l.brand[key]=text(c.brand[key],key);}
  if(c.playbook){for(const key of ['angle_a','angle_b','audience','sending_domain','crm_pipeline'])l.playbook[key]=text(c.playbook[key],key);}
  break;}
 case 'checklist.record':{
  need(l?.status==='preparing','Checklist locks at activation',409);choose(c.item,CHECKS,'checklist item');l.checklist[c.item]={evidence:text(c.evidence,'Evidence'),by:actor,at:now};break;}
 case 'launch.activate':{
  need(l?.status==='preparing','Launch already activated',409);need(CHECKS.every(k=>l.checklist[k]),'Complete every readiness check');
  const t=s.tournaments[l.tournament_id];const active=Object.values(s.launches).filter(x=>x.status==='active'&&s.tournaments[x.tournament_id].reviewer===t.reviewer).length;
  need(active<t.capacity,'Reviewer capacity reached',409);l.status='active';l.started_at=now;l.gate_started_at=now;break;}
 case 'signals.import':{
  need(l?.status==='active','Signals require an active launch',409);if(c.csv!==undefined)c.events=parseSignalsCSV(c.csv);need(Array.isArray(c.events)&&c.events.length>0&&c.events.length<=500,'Import 1–500 signals');
  for(const raw of c.events){const e=event(raw,l,now);const prior=s.signals.find(x=>x.id===e.id);if(prior){need(JSON.stringify(prior)===JSON.stringify(e),'Signal ID conflicts with earlier evidence',409);continue;}
   if(e.event_type==='payment'){const order=s.signals.find(x=>x.launch_id===l.id&&x.event_type==='payment'&&x.order_id===e.order_id);need(!order,'Payment order already recorded',409);}
   if(['refund','delivered'].includes(e.event_type)){const order=s.signals.find(x=>x.launch_id===l.id&&x.event_type==='payment'&&x.order_id===e.order_id);need(order&&order.actor===e.actor&&order.timestamp<=e.timestamp,'Referenced payment is missing or mismatched');}
   if(e.event_type==='unsubscribe'){const address=email(e.actor);if(!s.suppression.includes(address))s.suppression.push(address);delete s.claims[address];}
   s.signals.push(e);
  }break;}
 case 'gate.decide':{
  need(l?.status==='active','No active gate',409);const decision=choose(c.decision,['pass','kill','extend'],'decision');const note=text(c.note,'Decision rationale');const before=launchView(s,l,now);
  if(decision==='pass'){need(before.gate_passed,'Precommitted gate thresholds have not been met');l.decisions.push({gate:l.gate,decision,note,by:actor,at:now,metrics:before.metrics,plan:copy(l.plan[l.gate])});
   if(l.gate==='g1'){l.gate='g2';l.gate_started_at=now;}
   else if(l.gate==='g2'){l.gate='g3';l.gate_started_at=now;l.concentration={pending:true,triggered_at:now};}
   else {l.gate='g4';l.status='promotion_review';}
  }else if(decision==='extend'){
   need(!l.extensions[l.gate],'Only one extension per gate',409);const days=integer(c.days,'extension days',1,90);need(days<l.plan[l.gate].days,'Extension must be shorter than the original gate');
   l.extensions[l.gate]={days,budget_cents:integer(c.budget_cents,'additional budget'),angle:text(c.angle,'Specific re-angle'),note,by:actor,at:now};l.decisions.push({gate:l.gate,decision,...l.extensions[l.gate]});
  }else{l.decisions.push({gate:l.gate,decision,note,by:actor,at:now,metrics:before.metrics});l.status='winding_down';s.learnings.push({launch_id:l.id,cluster:l.candidate.cluster,note,metrics:before.metrics,at:now});for(const [address,claim] of Object.entries(s.claims))if(claim.launch_id===l.id)delete s.claims[address];}
  break;}
 case 'concentration.confirm':{
  need(l?.concentration?.pending&&['active','promotion_review'].includes(l.status),'No pending concentration',409);l.operator=text(c.operator,'Hands-on operator');
  l.concentration={...l.concentration,pending:false,operator:l.operator,budget_cents:integer(c.budget_cents,'additional budget'),note:text(c.note,'Concentration memo'),confirmed_at:now,by:actor,delay_hours:(Date.parse(now)-Date.parse(l.concentration.triggered_at))/3600000};break;}
 case 'winddown.record':{
  need(l?.status==='winding_down','No wind-down in progress',409);choose(c.item,WINDDOWN,'wind-down task');l.winddown[c.item]={evidence:text(c.evidence,'Evidence'),by:actor,at:now};if(WINDDOWN.every(k=>l.winddown[k]))l.status='killed';break;}
 case 'promotion.record':{
  need(l?.status==='promotion_review','Not ready for G4',409);choose(c.item,PROMOTION,'promotion task');l.promotion[c.item]={evidence:text(c.evidence,'Evidence'),by:actor,at:now};break;}
 case 'promotion.confirm':{
  need(l?.status==='promotion_review','Not ready for G4',409);need(l.concentration&&!l.concentration.pending&&l.operator,'Confirm concentration and operator first');need(PROMOTION.every(k=>l.promotion[k]),'Complete the spinout and handoff checklist');
  l.status='promoted';l.decisions.push({gate:'g4',decision:'promote',note:text(c.note,'Promotion memo'),by:actor,at:now});break;}
 case 'contact.claim':{
  editable();need(['preparing','active'].includes(l.status),'Launch cannot reserve contacts',409);const address=email(c.email);need(!s.suppression.includes(address),'Contact is globally suppressed',409);need(!s.claims[address]||s.claims[address].launch_id===l.id,'Contact is reserved by another launch',409);s.claims[address]={launch_id:l.id,at:now,by:actor};break;}
 case 'contact.release':{const address=email(c.email);need(s.claims[address]?.launch_id===l?.id,'No matching reservation',404);delete s.claims[address];break;}
 case 'contact.suppress':{const address=email(c.email);if(!s.suppression.includes(address))s.suppression.push(address);delete s.claims[address];break;}
 default:fail('Unknown operation');
 }
 s.revision++;s.audit.push({revision:s.revision,action:c.action,launch_id:c.launch_id||null,actor,at:now,details:copy(c)});
 need(new TextEncoder().encode(JSON.stringify(s)).length<=1800000,'Testing store limit reached; export and migrate before adding data',413);
 return s;
}
export function handoff(s,id,now){
 const l=s.launches[id];need(l,'Launch not found',404);
 const signals=s.signals.filter(e=>e.launch_id===id);const contacts={};for(const e of signals.filter(e=>e.event_type==='crm_stage').sort((a,b)=>a.timestamp.localeCompare(b.timestamp)))contacts[e.actor]={actor:e.actor,stage:e.crm_stage,channel:e.channel,updated_at:e.timestamp};
 return {format:'gantry-handoff-v1',generated_at:now,launch:launchView(s,l,now),signals,crm_staging:Object.values(contacts),audit:s.audit.filter(a=>a.launch_id===id||a.action==='launch.create'&&a.details.candidate_id===id),learnings:s.learnings.filter(x=>x.launch_id===id),limitations:['CSV-staged contacts; not a verified Forum export','Landing scaffold, not a finished venture product','Provider credentials, domain setup and legal actions are external']};
}
