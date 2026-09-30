import {initial,command,view,handoff,validatePlan} from './kernel.mjs';
let raw='';for await(const chunk of process.stdin)raw+=chunk;
try{const x=JSON.parse(raw),state=x.state||initial();let result;
if(x.validate_plan)result={result:validatePlan(x.validate_plan.plan,x.validate_plan.mode,x.validate_plan.overall)};
else if(x.command)result={state:command(state,x.command,x.context)};
else if(x.handoff)result={result:handoff(state,x.handoff,x.context.now)};
else result={result:view(state,x.context.now)};
process.stdout.write(JSON.stringify(result));
}catch(e){process.stdout.write(JSON.stringify({error:{status:e.status||500,detail:e.detail||'Operations failed'}}));}
