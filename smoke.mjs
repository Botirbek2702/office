import {startRun,getRun} from './codex-runner.mjs';
const run=await startRun('Create a tiny local Node.js project with no dependencies: an add(a,b) function exported from math.mjs; index.html with a calculator form; node:test unit tests for positive and negative numbers; README with local instructions. Keep the plan to four tasks: backend math, frontend HTML, QA tests, DevOps README. No external deployment.');
console.log('RUN_ID',run.id);
const timer=setInterval(async()=>{const job=await getRun(run.id);console.log(JSON.stringify({id:job.id,status:job.status,agent:job.agent,last:job.events.at(-1)?.text,error:job.error}));if(!['planning','running'].includes(job.status)){clearInterval(timer);process.exitCode=job.status==='completed'?0:1;}},15000);
