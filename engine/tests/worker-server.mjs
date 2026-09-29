// Test the actual Worker module using a deterministic KV adapter. No live account.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../../.build/worker-test.mjs';
const values=new Map();
const kv={get:async k=>values.get(k)??null,put:async(k,v)=>values.set(k,v),list:async({prefix})=>({keys:[...values.keys()].filter(k=>k.startsWith(prefix)).sort().map(name=>({name})),list_complete:true})};
const env={GANTRY_KV:kv,GANTRY_SECRET:'test-session-secret',GANTRY_ACCESS_KEY_HASHES:JSON.stringify({'tester@example.com':createHash('sha256').update('test-key').digest('hex')})};
const corpusPath=process.env.TEST_RESEARCH_CORPUS;
if(corpusPath){env.GANTRY_RESEARCH_URL='https://research.test/run';globalThis.fetch=async()=>new Response(readFileSync(corpusPath,'utf8'),{status:200});}
await kv.put('seeded','test');await kv.put('allowed',JSON.stringify(['tester@example.com']));await kv.put('clusters','[]');await kv.put('operators','[]');
const server=createServer(async(req,res)=>{
 try{
  if(process.env.TEST_AUTH_CONFIG)env.GANTRY_ACCESS_KEY_HASHES=readFileSync(process.env.TEST_AUTH_CONFIG,'utf8');
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=Buffer.concat(chunks);
  const r=await worker.fetch(new Request(`http://localhost${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}: {})}),env);
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 }catch(e){res.writeHead(500);res.end(String(e));}
});
server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
