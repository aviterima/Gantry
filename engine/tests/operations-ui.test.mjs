import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {chromium} from '@playwright/test';
import {defaultPlan,CHECKS,PROMOTION} from '../operations/kernel.mjs';
import {readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';

test('browser completes tournament, launch, landing capture, gates, concentration and handoff',async()=>{
 const proc=spawn('node',['engine/tests/worker-server.mjs'],{stdio:['ignore','pipe','pipe']});const lines=createInterface({input:proc.stdout});const [port]=await once(lines,'line');lines.close();let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=`http://127.0.0.1:${port}`;
  const post=async(path,body)=>{const r=await page.request.post(base+'/api'+path,{data:body});assert.ok(r.ok(),await r.text());return r.json();};
  await post('/login',{email:'tester@example.com',access_key:'test-key'});
  const candidate={slug:'browser-test',name:'Contractor estimating',one_liner:'Deliver estimates for small trade contractors',lane:'vertical',delivery_mode:'service_first',persona:'Contractor owner',channel:'Trade community',cluster_exception:'Test audience',operator_exception:'Test operator pending',case_against:'Manual costs',kill_criterion:'No repeat paid work'};
  await post('/candidates',candidate);
  const dimensions=JSON.parse(readFileSync('deploy/cloudflare/src/dimensions.json','utf8'));
  await post('/candidates/browser-test/score',{dimensions:Object.fromEntries(Object.keys(dimensions).map(k=>[k,{score:4,evidence:'Test evidence'}]))});
  const plan=defaultPlan();plan.g1.targets={visitors:1,captures:1,capture_rate:.1};plan.g2.targets={paid_delivered:1};plan.g3.targets={payers:1,outbound_payers:1,repeat_payers:1};
  await post('/candidates/browser-test/thresholds',{g1_reachability:'One capture',g2_engagement:'One delivered order',g3_retention:'One repeat payer',execution_plan:plan});
  await post('/candidates/browser-test/decision',{approved:true});
  await page.goto(base+'/operations');
  const submit=async()=>{await page.locator('#submitmodal').click();await page.locator('#modal').waitFor({state:'hidden'});};
  await page.getByRole('button',{name:'+ New tournament'}).click();
  await page.getByLabel('Tournament identifier').fill('browser');await page.getByLabel('Tournament name').fill('Autumn test tournament');await submit();
  const calendarPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Review calendar',exact:true}).click();const calendar=await calendarPromise;assert.ok(readFileSync(await calendar.path(),'utf8').includes('BEGIN:VEVENT'));
  await page.getByRole('button',{name:'Reschedule review'}).click();await page.getByLabel('Next review (UTC ISO)').fill('2026-12-01T10:00:00.000Z');await submit();
  await page.getByRole('button',{name:'+ Prepare launch'}).click();await submit();
  await page.getByRole('button',{name:'Open launch',exact:true}).click();
  await page.getByRole('button',{name:'Edit offer & playbook'}).click();
  for(const field of ['angle_a','angle_b','audience','sending_domain','crm_pipeline'])await page.locator('#'+field).fill('Fictional test '+field);
  await submit();
  for(const item of CHECKS){await page.locator(`button[onclick*="'${item}'"]`).click();await page.getByLabel('Completion evidence').fill('Verified in the isolated sandbox');await submit();}
  await page.getByRole('button',{name:'Activate test launch'}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  let state=await(await page.request.get(base+'/api/operations')).json();assert.equal(state.launches[0].status,'preparing');
  await page.getByRole('button',{name:'Activate test launch'}).click();await submit();
  const popupPromise=page.waitForEvent('popup');await page.getByRole('link',{name:'Open landing test preview ↗'}).click();const popup=await popupPromise;
  await popup.getByLabel('Test contact identifier').fill('buyer-1');await popup.getByLabel('What work do you need delivered?').fill('A fictional estimating request');
  await popup.getByRole('button',{name:'Request a test consultation'}).click();await popup.getByText('Test inquiry recorded. No email sent and no payment taken.').waitFor();await popup.close();await page.reload();
  // Navigation selection is intentionally not persisted; reopen the launch.
  await page.getByRole('button',{name:'Open launch',exact:true}).click();
  const pass=async gate=>{await page.getByRole('button',{name:'Pass '+gate,exact:true}).click();await page.getByLabel('Decision rationale').fill('Reviewed the test evidence');await submit();};
  await pass('G1');
  const csv=events=>['id,event_type,timestamp,actor,channel,angle,value_cents,order_id,unprompted,pure_outbound,crm_stage',...events.map(e=>[e[0],e[1],new Date().toISOString(),'buyer-1','email','angle-a',e[2],e[3],'false',e[4]||'false',''].join(','))].join('\n');
  const importCSV=async content=>{await page.getByRole('button',{name:'Import signals',exact:true}).click();await page.getByLabel('CSV evidence',{exact:true}).fill(content);await submit();};
  await importCSV(csv([['pay-1','payment',10000,'order-1','true'],['delivered-1','delivered',0,'order-1']]));await pass('G2');
  await page.getByRole('button',{name:'Confirm concentration',exact:true}).click();await page.getByLabel('Hands-on operator').fill('Fictional operator');await page.getByLabel('Concentration memo').fill('Assign attention and budget to the survivor');await submit();
  await page.screenshot({path:'.build/operations-desktop.png',fullPage:true});
  await importCSV(csv([['pay-2','payment',10000,'order-2']]));await pass('G3');
  for(const item of PROMOTION){await page.locator(`button[onclick*="'${item}'"]`).click();await page.getByLabel('Completion evidence').fill('Synthetic completion for browser testing');await submit();}
  await page.getByRole('button',{name:'Confirm promotion',exact:true}).click();await page.getByLabel('Decision rationale').fill('Testing the complete handoff workflow');await submit();
  state=await(await page.request.get(base+'/api/operations')).json();assert.equal(state.launches[0].status,'promoted');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download handoff ZIP'}).click();const download=await downloadPromise;const archive=unzipSync(readFileSync(await download.path()));
  assert.equal(JSON.parse(strFromU8(archive['private/launch.json'])).status,'promoted');assert.ok(strFromU8(archive['serve.py']).includes('127.0.0.1'));assert.equal(JSON.parse(strFromU8(archive['private/signals.json'])).find(e=>e.event_type==='qualified_capture').details,'A fictional estimating request');
  await page.getByRole('button',{name:'← Portfolio'}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.build/operations-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();proc.kill();}
});
