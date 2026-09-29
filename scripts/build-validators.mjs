// Generate static validators: Workers prohibit runtime eval/new Function.
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import fs from 'node:fs';
const schemas=JSON.parse(fs.readFileSync('deploy/cloudflare/src/contracts.json','utf8'));
const ajv=new Ajv({strict:false,useDefaults:true,validateFormats:false,code:{source:true,esm:true}});
const exports={};
for(const [name,schema] of Object.entries(schemas)){ajv.addSchema(schema,name);exports[name]=name;}
fs.writeFileSync('deploy/cloudflare/src/validators.js',standalone(ajv,exports));
