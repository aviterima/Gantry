import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,command,view,defaultPlan,CHECKS,validatePlan} from '../operations/kernel.mjs';
function fixture(mode='self_serve'){
 let state=initial(),now='2026-01-01T00:00:00.000Z';
 const candidate={slug:'test',name:'Test',decision:{approved:true},delivery_mode:mode,thresholds:{execution_plan:defaultPlan(mode),time_cap_weeks:3,budget_cap_usd:2000}};
 const run=(action,values={})=>state=command(state,{revision:state.revision,action,...values},{actor:'tester@example.com',now,candidates:[candidate]});
 run('tournament.create',{id:'t',name:'T',reviewer:'tester@example.com',capacity:5,review_at:now,mode:'sandbox'});
 run('launch.create',{candidate_id:'test',tournament_id:'t'});
 for(const item of CHECKS)run('checklist.record',{launch_id:'test',item,evidence:'tested'});
 run('launch.activate',{launch_id:'test'});
 return {run,get state(){return state;},set now(v){now=v;},get now(){return now;},event(type,id,extra={}){return {id,event_type:type,timestamp:now,actor:'a',channel:'web',angle:'a',...extra};}};
}
test('week-2 returns require an earlier activation and an unprompted return in the window',()=>{
 const f=fixture();f.run('signals.import',{launch_id:'test',events:[f.event('activation','a')]});
 f.now='2026-01-07T00:00:00.000Z';f.run('signals.import',{launch_id:'test',events:[f.event('return','early',{unprompted:true})]});
 assert.equal(view(f.state,f.now).launches[0].metrics.week2_returns,0);
 f.now='2026-01-08T00:00:00.000Z';f.run('signals.import',{launch_id:'test',events:[f.event('return','prompted')]});
 assert.equal(view(f.state,f.now).launches[0].metrics.week2_returns,0);
 f.run('signals.import',{launch_id:'test',events:[f.event('return','valid',{unprompted:true})]});
 assert.equal(view(f.state,f.now).launches[0].metrics.week2_returns,1);
});
test('deadline queues kill without advancing or killing automatically',()=>{const f=fixture();f.now='2026-01-09T00:00:00.000Z';const l=view(f.state,f.now).launches[0];assert.equal(l.queued,true);assert.equal(l.recommendation,'kill');assert.equal(l.status,'active');});
test('budget cap is computed from spend events',()=>{const f=fixture();f.run('signals.import',{launch_id:'test',events:[f.event('spend','spend',{value_cents:50000})]});assert.equal(view(f.state,f.now).launches[0].cap_reached,true);});
test('capture without earlier visit and unknown attribution cannot inflate reachability',()=>{const f=fixture();f.run('signals.import',{launch_id:'test',events:[f.event('qualified_capture','c'),f.event('visit','v',{actor:'other',angle:''})]});const m=view(f.state,f.now).launches[0].metrics;assert.equal(m.captures,0);assert.equal(m.unattributed_visits,1);});
test('replayed ID with changed evidence is rejected atomically',()=>{const f=fixture();f.run('signals.import',{launch_id:'test',events:[f.event('visit','a')]});const before=JSON.stringify(f.state);assert.throws(()=>f.run('signals.import',{launch_id:'test',events:[f.event('visit','a',{actor:'different'})]}));assert.equal(JSON.stringify(f.state),before);});
test('G3 cannot omit outbound or repeat targets; plans cannot exceed G0 caps',()=>{const p=defaultPlan();delete p.g3.targets.outbound_payers;assert.throws(()=>validatePlan(p,'service_first'));assert.throws(()=>validatePlan(defaultPlan(),'service_first',{time_cap_weeks:1,budget_cap_usd:100}));});
test('invalid dates and mismatched orders fail without retaining events',()=>{const f=fixture();for(const e of [f.event('visit','bad',{timestamp:'2026-02-30T00:00:00Z'}),f.event('delivered','no-order',{order_id:'missing'})])assert.throws(()=>f.run('signals.import',{launch_id:'test',events:[e]}));assert.equal(f.state.signals.length,0);});
test('snapshot and audit do not let a caller rewrite the G0 candidate',()=>{const f=fixture();assert.throws(()=>f.run('launch.configure',{launch_id:'test',brand:{headline:'Change'}}));assert.equal(f.state.launches.test.candidate.name,'Test');assert.equal(f.state.audit.at(-1).actor,'tester@example.com');});

test('concurrent tournaments share the reviewer capacity and reviews can be rescheduled',()=>{const f=fixture();f.run('tournament.create',{id:'second',name:'Second',reviewer:'tester@example.com',capacity:5,review_at:f.now,mode:'sandbox'});assert.equal(view(f.state,f.now).tournaments.length,2);assert.throws(()=>f.run('tournament.create',{id:'bypass',name:'Bypass',reviewer:'tester@example.com',capacity:6,review_at:f.now,mode:'sandbox'}));f.run('tournament.schedule',{tournament_id:'second',review_at:'2026-02-01T00:00:00Z'});assert.equal(view(f.state,f.now).tournaments.find(t=>t.id==='second').review_due,false);});
test('an imported unsubscribe globally suppresses and releases the contact',()=>{const f=fixture();f.run('contact.claim',{launch_id:'test',email:'buyer@example.com'});f.run('signals.import',{launch_id:'test',events:[f.event('unsubscribe','unsub',{actor:'buyer@example.com'})]});assert.deepEqual(f.state.claims,{});assert.deepEqual(f.state.suppression,['buyer@example.com']);assert.throws(()=>f.run('contact.claim',{launch_id:'test',email:'buyer@example.com'}));});
