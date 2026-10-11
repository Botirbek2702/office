import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {planSchema,validatePlan} from './planner.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const dataRoot=path.join(root,'.office-data',process.env.NODE_ENV==='test'?'test-runs':'');
const executable=()=>process.env.CODEX_BIN||'codex';
export const reportSchema={type:'object',additionalProperties:false,properties:{summary:{type:'string'},status:{type:'string',enum:['passed','failed']},files:{type:'array',items:{type:'string'}},checks:{type:'array',items:{type:'string'}},limitations:{type:'array',items:{type:'string'}}},required:['summary','status','files','checks','limitations']};
export function codexAvailable(){return new Promise(resolve=>{const p=spawn(executable(),['login','status'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let text='';const timer=setTimeout(()=>{p.kill();resolve(false);},10000);p.stdout.on('data',d=>text+=d);p.stderr.on('data',d=>text+=d);p.on('error',()=>{clearTimeout(timer);resolve(false);});p.on('close',code=>{clearTimeout(timer);resolve(code===0&&/logged in/i.test(text));});});}
const jobs=new Map();
let starting=false;
function idPath(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Noto‘g‘ri ish ID.');return path.join(dataRoot,id);}
const writeQueues=new Map();
async function persist(job){const file=path.join(idPath(job.id),'run.json');const content=JSON.stringify(job,null,2);const previous=writeQueues.get(job.id)||Promise.resolve();const current=previous.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',content);await rename(file+'.tmp',file);});writeQueues.set(job.id,current);try{await current;}finally{if(writeQueues.get(job.id)===current)writeQueues.delete(job.id);}}
export async function getRun(id){const job=jobs.get(id);if(job)return structuredClone(serializable(job));const saved=JSON.parse(await readFile(path.join(idPath(id),'run.json'),'utf8'));if(['planning','running'].includes(saved.status)){saved.status='interrupted';saved.error='Server uzilgan. Natijalar saqlangan; yangi ish boshlashingiz mumkin.';}return saved;}
export async function listRuns(){await mkdir(dataRoot,{recursive:true});const result=[];for(const entry of await readdir(dataRoot)){if(!/^[a-f0-9-]{36}$/.test(entry))continue;try{result.push(await getRun(entry));}catch{}}return result.sort((a,b)=>b.created-a.created).slice(0,30);}
async function listFiles(directory,prefix=''){const result=[];for(const entry of await readdir(directory,{withFileTypes:true})){if(['.git','node_modules','.env'].includes(entry.name)||entry.isSymbolicLink())continue;const name=prefix+entry.name;if(entry.isDirectory())result.push(...await listFiles(path.join(directory,entry.name),name+'/'));else result.push(name);}return result.slice(0,200);}
export async function runFiles(id){return listFiles(path.join(idPath(id),'project'));}
export async function readArtifact(id,name){if(typeof name!=='string'||!name||name.includes('\\')||name.split('/').some(p=>p==='..'||p.startsWith('.')||p==='node_modules'))throw new Error('Faylga ruxsat yo‘q.');const allowed=await runFiles(id);if(!allowed.includes(name))throw new Error('Fayl topilmadi.');const file=await readFile(path.join(idPath(id),'project',name));if(file.length>500000)throw new Error('Fayl juda katta.');return file.toString('utf8');}
function log(job,text){job.events.push({time:Date.now(),agent:job.agent,text});job.events=job.events.slice(-150);}
export function cancelRun(id){const job=jobs.get(id);if(!job||!['planning','running'].includes(job.status))return false;job.cancelled=true;job.controller?.abort();return true;}
export async function callCodex({job,prompt,schema,name}){
 if(job.cancelled)throw new Error('Ish to‘xtatildi.');
 const directory=idPath(job.id);const schemaFile=path.join(directory,name+'-schema.json'),outputFile=path.join(directory,name+'-result.json');await writeFile(schemaFile,JSON.stringify(schema));
 if(job.cancelled)throw new Error('Ish to‘xtatildi.');
 return new Promise((resolve,reject)=>{
 const args=['exec','--json','--ephemeral','--approve-for-me','--skip-git-repo-check','-C',path.join(directory,'project'),'--output-schema',schemaFile,'--output-last-message',outputFile,'-'];
 const child=spawn(executable(),args,{windowsHide:true,stdio:['pipe','pipe','pipe']});let buffer='',failed=false;job.controller=new AbortController();const abort=()=>{failed=true;if(process.platform==='win32'&&child.pid){const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill());}else child.kill();};job.controller.signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,10*60*1000);
 child.stdout.on('data',chunk=>{buffer+=chunk.toString();const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines){try{const event=JSON.parse(line);if(event.type==='turn.completed'&&event.usage){job.tokens+=(event.usage.input_tokens||0)+(event.usage.output_tokens||0);}if(event.type==='item.completed'){const item=event.item||{};if(item.type==='file_change')log(job,'Fayllar yangilandi');if(item.type==='command_execution')log(job,`Buyruq tekshirildi: exit ${item.exit_code ?? '?'}`);if(item.type==='agent_message')log(job,(item.text||'').slice(0,1000));}if(event.type==='turn.failed'||event.type==='error')failed=true;}catch{}}});
 child.stderr.on('data',()=>{});child.on('error',()=>{clearTimeout(timer);reject(new Error('Codex ishga tushmadi. CODEX_BIN va login holatini tekshiring.'));});
 child.on('close',async code=>{clearTimeout(timer);job.controller=null;if(job.cancelled)return reject(new Error('Ish to‘xtatildi.'));if(code!==0||failed)return reject(new Error('Codex bosqichi yakunlanmadi. Login, limit yoki sandbox ruxsatlarini tekshiring.'));try{resolve(JSON.parse(await readFile(outputFile,'utf8')));}catch{reject(new Error('Agent yakuniy hisobot bermadi.'));}});
 child.stdin.on('error',()=>{});child.stdin.end(prompt);
 });
}
function serializable(job){const {controller,...rest}=job;return rest;}
export async function startRun(prompt,{agentCall=callCodex}={}){
 if(starting||[...jobs.values()].some(j=>['planning','running'].includes(j.status)))throw new Error('Bitta ish bajarilmoqda. Tugashini kuting yoki to‘xtating.');
 starting=true;
 const job={id:randomUUID(),prompt,title:prompt.slice(0,90),created:Date.now(),status:'planning',agent:'manager',tasks:[],events:[],tokens:0,cancelled:false};try{await mkdir(path.join(idPath(job.id),'project'),{recursive:true});jobs.set(job.id,job);log(job,'Manager reja tuzishni boshladi');await persist(serializable(job));}catch(error){jobs.delete(job.id);throw error;}finally{starting=false;}
 execute(job,agentCall).catch(()=>{});return structuredClone(serializable(job));
}
async function execute(job,agentCall){
 try{
  const plan=validatePlan(job.plan||await agentCall({job,schema:planSchema,name:'manager',prompt:`You are the project manager. Plan this software project in Uzbek with 1-8 tasks assigned to backend, frontend, qa and devops. Include QA and DevOps preparation. Dependencies must be acyclic. Use minimal local dependencies. Work ONLY in the current project directory. Do not write implementation or publish externally. Produce only the structured plan. User request:\n${job.prompt}`}));
  job.plan=plan;job.title=plan.title;if(!job.tasks.length)job.tasks=plan.tasks.map(t=>({...t,status:'pending'}));job.status='running';await writeFile(path.join(idPath(job.id),'project','REQUIREMENTS.md'),JSON.stringify(plan,null,2));
  while(job.tasks.some(t=>t.status==='pending')){
   if(job.cancelled)throw new Error('Ish to‘xtatildi.');const task=job.tasks.find(t=>t.status==='pending'&&t.depends_on.every(id=>job.tasks.find(x=>x.id===id).status==='completed'));if(!task)throw new Error('Vazifalar bog‘lanishi ishni to‘xtatdi.');
   job.agent=task.owner;task.status='running';log(job,task.title);await persist(serializable(job));
   const report=await agentCall({job,schema:reportSchema,name:'task-'+job.tasks.indexOf(task),prompt:`You are the ${task.owner} specialist. Write your final report in Uzbek. Implement your assigned task in the current project folder. Read REQUIREMENTS.md and existing files. Do not access other projects, credentials, or files outside this folder. Do not publish, push, deploy externally, or alter system settings. Do not start background services. Use sandbox permissions as provided; never bypass them. For backend/frontend write working implementation. For QA run meaningful checks and report actual commands/results. If Windows sandbox blocks Node test runner subprocesses, use node --test --test-isolation=none; this runs the same test assertions and is an acceptable equivalent to node --test. Record the isolation limitation but do not fail solely on that when actual assertions pass; fail if acceptance is unmet. For DevOps prepare local run instructions and deployment configuration, without deploying. Return passed only if this task's acceptance criteria are met. State missing credentials or unresolved dependencies as limitations and failed where blocking.\nOriginal request: ${job.prompt}\nTask: ${JSON.stringify(task)}\nPrevious reports: ${JSON.stringify(job.tasks.filter(t=>t.report).map(t=>({id:t.id,report:t.report})))}`});
   if(!report||!['passed','failed'].includes(report.status)||typeof report.summary!=='string'||!Array.isArray(report.checks))throw new Error('Agent hisoboti noto‘g‘ri.');task.report=report;task.status=report.status==='passed'?'completed':'failed';log(job,report.summary);await persist(serializable(job));if(task.status==='failed')throw new Error('Agent vazifasi tekshiruvdan o‘tmadi: '+task.title);
  }
  // A final independent QA pass always runs, even if the plan omitted QA.
  job.agent='qa';log(job,'Yakuniy QA tekshiruvi');await persist(serializable(job));
  job.review=await agentCall({job,schema:reportSchema,name:'final-qa',prompt:`You are the final QA reviewer. Write your final report in Uzbek. Read REQUIREMENTS.md, inspect the implementation and run meaningful tests in this folder. Do not modify code or publish. Compare to the original request: ${job.prompt}. If Node test subprocess isolation is blocked in Windows sandbox, use node --test --test-isolation=none and record that limitation; this is an acceptable equivalent verification. Return passed only when executable checks actually ran and the requested features work. List commands and evidence in checks. If no tests ran, return failed. Report all limitations honestly.`});
  job.status=job.review?.status==='passed'&&job.review.checks?.length?'completed':'failed';if(job.status==='failed')job.error='Yakuniy QA tekshiruvi o‘tmadi.';job.agent=null;log(job,job.review.summary||job.error);
 }catch(error){job.status=job.cancelled?'cancelled':'failed';job.error=error.message;job.agent=null;log(job,error.message);}finally{job.finished=Date.now();await persist(serializable(job));if(jobs.get(job.id)===job)jobs.delete(job.id);}
}
export async function retryRun(id,{agentCall=callCodex}={}){
 if(starting||[...jobs.values()].some(j=>['planning','running'].includes(j.status)))throw new Error('Avval faol ishni yakunlang.');starting=true;
 let job;try{job=await getRun(id);if(!['failed','cancelled','interrupted'].includes(job.status))throw new Error('Bu ishni qayta boshlash kerak emas.');job.cancelled=false;job.error=null;job.finished=null;job.status=job.plan?'running':'planning';job.agent=job.plan?'qa':'manager';for(const task of job.tasks)if(task.status!=='completed')task.status='pending';jobs.set(id,job);log(job,'Saqlangan bosqichdan qayta boshlandi');await persist(serializable(job));}finally{starting=false;}
 execute(job,agentCall).catch(()=>{});return structuredClone(serializable(job));
}


