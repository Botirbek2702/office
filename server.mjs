import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createPlan} from './planner.mjs';
import {codexAvailable,startRun,getRun,listRuns,cancelRun,runFiles,readArtifact,retryRun} from './codex-runner.mjs';
try{process.loadEnvFile(fileURLToPath(new URL('.env',import.meta.url)));}catch(error){if(error.code!=='ENOENT')throw error;}
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
let busy=false;
const configured=()=>Boolean(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL);
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
export function createServer(){return http.createServer(async(req,res)=>{
try{
 const host=req.headers.host;
 if(!host||!/^((localhost|127\.0\.0\.1)(:\d+)?|\[::1\](:\d+)?)$/.test(host))return json(res,403,{error:'Mahalliy manzil orqali foydalaning.'});
 if(req.headers.origin&&req.headers.origin!==`http://${host}`)return json(res,403,{error:'Boshqa saytdan so‘rovga ruxsat yo‘q.'});
 const route=new URL(req.url,'http://localhost').pathname;
 if(route==='/api/status'&&req.method==='GET')return json(res,200,{configured:configured(),model:process.env.OPENAI_MODEL||null,codex:await codexAvailable()});
 if(route==='/api/runs'&&req.method==='GET')return json(res,200,await listRuns());
 if(route==='/api/runs'&&req.method==='POST'){
  if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON so‘rov yuboring.'});
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000)return json(res,413,{error:'So‘rov juda katta.'});}
  let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'So‘rov formati noto‘g‘ri.'});}
  if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>1500)return json(res,400,{error:'Topshiriq 1–1500 belgi bo‘lishi kerak.'});
  if(!await codexAvailable())return json(res,503,{error:'Codex login holatini tekshiring.'});
  try{return json(res,202,await startRun(input.prompt.trim()));}catch(error){return json(res,409,{error:error.message});}
 }
 const runRoute=route.match(/^\/api\/runs\/([a-f0-9-]{36})(?:\/(cancel|files|artifact|retry))?$/);
 if(runRoute){const [,id,action]=runRoute;try{if(action==='retry'&&req.method==='POST'){if(!await codexAvailable())return json(res,503,{error:'Codex login holatini tekshiring.'});return json(res,202,await retryRun(id));}if(action==='cancel'&&req.method==='POST')return json(res,200,{cancelled:cancelRun(id)});if(req.method!=='GET')return json(res,405,{error:'Amal qo‘llab-quvvatlanmaydi.'});if(action==='files')return json(res,200,await runFiles(id));if(action==='artifact')return json(res,200,{text:await readArtifact(id,new URL(req.url,'http://localhost').searchParams.get('path'))});return json(res,200,await getRun(id));}catch(error){return json(res,404,{error:error.message});}}
 if(route==='/api/plan'&&req.method==='POST'){
  if(!configured())return json(res,503,{error:'AI ulanishi sozlanmagan. Server .env faylida OPENAI_API_KEY va OPENAI_MODEL ni belgilang.'});
  if(busy)return json(res,429,{error:'Manager hozir boshqa reja ustida ishlayapti. Birozdan so‘ng qayta yuboring.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON so‘rov yuboring.'});
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000)return json(res,413,{error:'So‘rov juda katta.'});}
  let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'So‘rov formati noto‘g‘ri.'});}
  if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>1500)return json(res,400,{error:'Topshiriq 1–1500 belgi bo‘lishi kerak.'});
  busy=true;try{return json(res,200,await createPlan(input.prompt.trim(),{apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}));}catch(error){return json(res,502,{error:error.message});}finally{busy=false;}
 }
 if(req.method!=='GET')return json(res,405,{error:'Bu amal qo‘llab-quvvatlanmaydi.'});
 const assets={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js'};
 if(!assets[route])return json(res,404,{error:'Topilmadi.'});
 const file=assets[route];const data=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(data);
}catch{return json(res,500,{error:'Server so‘rovni bajara olmadi.'});}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||4173;createServer().listen(port,'127.0.0.1',()=>console.log(`Office: http://localhost:${port}`));}
