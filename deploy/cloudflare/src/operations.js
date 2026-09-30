import {initial,command,view,handoff} from '../../../engine/operations/kernel.mjs';
import {filesFor,landing} from '../../../engine/operations/factory.mjs';
import {zipSync,strToU8} from 'fflate';
export class OperationsStore {
 constructor(ctx){this.storage=ctx.storage;}
 async fetch(request){
  try{const input=await request.json();
   return await this.storage.transaction(async tx=>{
    const stored=await tx.get('state');const state=stored?JSON.parse(stored):initial();
    if(input.command){const next=command(state,input.command,input.context);await tx.put('state',JSON.stringify(next));return Response.json({revision:next.revision});}
    if(input.handoff){const pack=handoff(state,input.handoff,input.context.now);const files=filesFor(pack);return new Response(zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,strToU8(v)]))),{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${pack.launch.id}-handoff.zip"`}});}
    if(input.preview){const pack=handoff(state,input.preview,input.context.now);return new Response(landing(pack.launch,true),{headers:{'Content-Type':'text/html; charset=utf-8'}});}
    return Response.json(view(state,input.context.now));
   });
  }catch(e){return Response.json({detail:e.detail||'Operations failed'},{status:e.status||500});}
 }
}
