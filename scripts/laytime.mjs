#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { calculate, minute, integer, cents } from './lib/calculate.mjs';
import { readStatement } from './lib/layline-import.mjs';
import { page, table, record, writeOut } from './lib/render.mjs';

export const reads={
 voyages:'select code,name,vessel,counterparty,owner,status,time_bar_at from voyages order by code',
 calls:'select p.code,v.code voyage,p.name,p.currency,p.reviewed,p.revision,p.superseded_by from port_calls p join voyages v on v.id=p.voyage_id order by p.code',
 'claim-round':'select voyage,port,owner,currency,direction,amount_cents,current_calculation from claim_round order by voyage,port',
 'time-bars':'select * from time_bars order by time_bar_at nulls first',
 unreviewed:'select v.code voyage,p.code port_call,p.name,p.contract_ref,p.nor_ref from port_calls p join voyages v on v.id=p.voyage_id where not p.reviewed and p.superseded_by is null and v.status=\'open\' order by p.code',
 'stale-claims':`select v.code,v.vessel,v.owner,greatest(v.updated_at,coalesce(n.at,v.updated_at),coalesce(c.at,v.updated_at)) last_activity from voyages v left join (select voyage_id,max(created_at) at from notes group by voyage_id) n on n.voyage_id=v.id left join (select voyage_id,max(occurred_at) at from claim_records group by voyage_id)c on c.voyage_id=v.id where v.status='open' and greatest(v.updated_at,coalesce(n.at,v.updated_at),coalesce(c.at,v.updated_at))<now()-interval '14 days' order by last_activity`,
 'owner-workload':`select v.owner,count(distinct v.id)::int open_voyages,count(distinct p.id) filter(where not p.reviewed)::int unreviewed_calls,count(distinct v.id) filter(where v.time_bar_at<now())::int past_deadline from voyages v left join port_calls p on p.voyage_id=v.id and p.superseded_by is null where v.status='open' group by v.owner order by v.owner`,
 'counterparty-exposure':`select counterparty,currency,direction,sum(amount_cents)::bigint amount_cents,count(*)::int calls from claim_round where current_calculation and status='open' group by counterparty,currency,direction order by counterparty,currency,direction`,
 'port-delays':`select r.port,r.currency,c.demurrage_minutes,c.excluded_minutes,c.saved_minutes from claim_round r join port_calls p on p.code=r.port_call join latest_calculations c on c.port_id=p.id where r.current_calculation order by c.demurrage_minutes desc,r.port`,
 exceptions:'select p.code port_call,e.starts_at,e.ends_at,e.reason,e.clause_ref,e.on_demurrage from exceptions e join port_calls p on p.id=e.port_id order by p.code,e.starts_at',
 events:'select p.code port_call,e.source_key,e.occurred_at,e.description,e.counts,e.factor from source_events e join port_calls p on p.id=e.port_id order by p.code,e.occurred_at',
 attention:'select * from compliance_checks order by voyage,port_call,rule',
 compliance:'select * from compliance_checks order by voyage,port_call,rule',
 'import-history':'select id,source_hash,filename,actor,created_at from imports order by created_at',
 audit:'select entity,entity_id,operation,actor,created_at from audit_log order by created_at,id',
 notes:'select v.code voyage,n.body,n.actor,n.created_at from notes n join voyages v on v.id=n.voyage_id order by n.created_at',
 claims:'select v.code voyage,c.kind,c.occurred_at,c.reference,c.actor from claim_records c join voyages v on v.id=c.voyage_id order by c.occurred_at'
};
const mutations=['add-voyage','add-call','set-terms','add-exception','void-exception','supersede-call','review-call','calculate','log','record-claim','set-deadline','close','import'];
export const commandNames=[...Object.keys(reads),'voyage','port',...mutations,'weekly-review','draft-statement','draft-claim','export','help'];
function options(argv){const positional=[],flags={};for(const a of argv){if(!a.startsWith('--')){positional.push(a);continue;}const n=a.indexOf('=');const k=a.slice(2,n<0?undefined:n);if(k in flags)throw Error('Duplicate flag '+k);flags[k]=n<0?true:a.slice(n+1);}return {positional,flags};}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();};
const code=(s)=>{if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(s))throw Error('Code needs 1 to 64 letters, digits, underscores or hyphens');return s;};
const timestamp=(s)=>new Date(minute(s)*60000).toISOString();
const currency=(s)=>{if(!/^[A-Z]{3}$/.test(s))throw Error('Currency needs three uppercase letters');return s;};
export async function resolve(db,entity,query){
 if(!['voyages','port_calls'].includes(entity))throw Error('Unsupported entity');if(!query)throw Error('A record reference is required');
 const rows=await db.query(`select id,code,name from ${entity} order by code`),q=query.toLowerCase();
 const exact=rows.filter(x=>x.id.toLowerCase()===q||x.code.toLowerCase()===q||x.name.toLowerCase()===q);
 const found=exact.length?exact:rows.filter(x=>x.id.toLowerCase().startsWith(q)||x.code.toLowerCase().startsWith(q)||x.name.toLowerCase().includes(q));
 if(found.length===1)return found[0].id;
 throw Error(`${found.length?'Ambiguous':'Unknown'} ${entity} reference: ${query}. Candidates: ${(found.length?found:rows).map(x=>`${x.code} (${x.name})`).join(', ')}`);
}
async function openVoyage(db,id){const v=(await db.query('select * from voyages where id=$1 for update',[id]))[0];if(!v||v.status==='closed')throw Error('Voyage is closed or missing');return v;}
async function portData(db,ref,lock=false){const id=await resolve(db,'port_calls',ref);const p=(await db.query('select * from port_calls where id=$1'+(lock?' for update':''),[id]))[0];const exceptions=await db.query('select * from active_exceptions where port_id=$1 order by starts_at',[id]);return {p,exceptions};}
export async function saveCalculation(db,p,exceptions,actor){
 if(!p.reviewed)throw Error('Review the call and its charter evidence before calculating');
 const c=calculate(p,exceptions);
 await db.query(`insert into calculations(port_id,revision,currency,used_minutes,excluded_minutes,demurrage_minutes,saved_minutes,direction,amount_cents,input,intervals,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[p.id,p.revision,c.currency,c.used_minutes,c.excluded_minutes,c.demurrage_minutes,c.saved_minutes,c.direction,c.amount_cents,JSON.stringify({port:p,exceptions}),JSON.stringify(c.intervals),actor]);
 return [{port_call:p.code,...c}];
}
async function mutate(db,cmd,o,pos){
 const actor=required(o,'actor');
 if(cmd==='add-voyage'){
  const deadline=o['time-bar-at']?timestamp(o['time-bar-at']):null;
  return db.query('insert into voyages(code,name,vessel,counterparty,owner,time_bar_at,deadline_ref) values($1,$2,$3,$4,$5,$6,$7) returning code,name,status',[code(required(o,'code')),required(o,'name'),required(o,'vessel'),required(o,'counterparty'),required(o,'owner'),deadline,deadline?required(o,'deadline-ref'):'']);
 }
 if(cmd==='add-call'){
  const v=await resolve(db,'voyages',required(o,'voyage'));await openVoyage(db,v);
  return db.query('insert into port_calls(code,voyage_id,name,currency) values($1,$2,$3,$4) returning code,name,reviewed',[code(required(o,'code')),v,required(o,'name'),currency(required(o,'currency'))]);
 }
 if(['set-terms','add-exception','void-exception','supersede-call','review-call','calculate'].includes(cmd)){
  const {p,exceptions}=await portData(db,required(o,'port'),true);await openVoyage(db,p.voyage_id);
  if(p.superseded_by)throw Error('Port call has been superseded');
  if(cmd==='supersede-call'){
   const replacement=await resolve(db,'port_calls',required(o,'replacement'));
   return db.query('update port_calls set superseded_by=$2,superseded_ref=$3 where id=$1 returning code,superseded_by,superseded_ref',[p.id,replacement,required(o,'reference')]);
  }
  if(cmd==='void-exception'){
   const ref=required(o,'exception').toLowerCase(),matches=exceptions.filter(e=>e.id.toLowerCase().startsWith(ref));
   if(matches.length!==1)throw Error('Exception reference must match one active row. Candidates: '+exceptions.map(e=>e.id+' '+e.reason).join(', '));
   return db.query('insert into exception_voids(exception_id,reason,actor) values($1,$2,$3) returning id,exception_id,reason',[matches[0].id,required(o,'reason'),actor]);
  }
  if(cmd==='set-terms'){
   const start=timestamp(required(o,'commenced')),end=timestamp(required(o,'completed'));
   const terms={...p,commenced_at:start,completed_at:end,allowed_minutes:integer(required(o,'allowed-minutes'),'Allowed minutes'),demurrage_rate_cents:cents(required(o,'demurrage-rate')),despatch_rate_cents:o['despatch-rate']==null?null:cents(o['despatch-rate'])};
   calculate(terms,exceptions);
   return db.query(`update port_calls set commenced_at=$2,completed_at=$3,allowed_minutes=$4,demurrage_rate_cents=$5,despatch_rate_cents=$6,contract_ref=$7,nor_ref=$8,reviewed=false,review_ref='',reviewer='' where id=$1 returning code,reviewed,revision`,[p.id,start,end,terms.allowed_minutes,terms.demurrage_rate_cents,terms.despatch_rate_cents,required(o,'contract-ref'),required(o,'nor-ref')]);
  }
  if(cmd==='add-exception'){
   const start=timestamp(required(o,'from')),end=timestamp(required(o,'to'));
   if(minute(end)<=minute(start))throw Error('Exception end must follow start');
   if(o['on-demurrage']!=null&&!['true','false'].includes(String(o['on-demurrage'])))throw Error('--on-demurrage must be true or false');
   const ex={starts_at:start,ends_at:end,reason:required(o,'reason'),clause_ref:required(o,'clause-ref'),on_demurrage:String(o['on-demurrage'])==='true'};
   if(p.commenced_at&&p.completed_at)calculate(p,[...exceptions,ex]);
   return db.query('insert into exceptions(port_id,starts_at,ends_at,reason,clause_ref,on_demurrage) values($1,$2,$3,$4,$5,$6) returning id,reason,on_demurrage',[p.id,start,end,ex.reason,ex.clause_ref,ex.on_demurrage]);
  }
  if(cmd==='review-call'){
   if(p.import_id){const source=(await db.query('select parsed from imports where id=$1',[p.import_id]))[0].parsed;
    if(!['NON REVERSIBLE','NON_REVERSIBLE'].includes(source.source_laytime_type)||source.events.some(e=>e.factor!=='100'))throw Error('Source uses an unsupported pooled or fractional calculation; preserve it for a reviewed extension');}
   calculate(p,exceptions);if(!p.contract_ref||!p.nor_ref)throw Error('Contract and NOR evidence references are required');
   return db.query('update port_calls set reviewed=true,review_ref=$2,reviewer=$3 where id=$1 returning code,reviewed,revision',[p.id,required(o,'reference'),actor]);
  }
  return saveCalculation(db,p,exceptions,actor);
 }
 if(['log','record-claim','set-deadline','close'].includes(cmd)){
  const id=await resolve(db,'voyages',required(o,'voyage'));await openVoyage(db,id);
  if(cmd==='log')return db.query('insert into notes(voyage_id,body,actor) values($1,$2,$3) returning id,body',[id,required(o,'body'),actor]);
  if(cmd==='record-claim'){
   const at=timestamp(required(o,'at'));if(Date.parse(at)>Date.now())throw Error('Claim evidence cannot be in the future');
   const kind=required(o,'kind');if(!['submitted','agreed','disputed'].includes(kind))throw Error('Kind must be submitted, agreed or disputed');
   return db.query('insert into claim_records(voyage_id,kind,occurred_at,reference,actor) values($1,$2,$3,$4,$5) returning id,kind,reference',[id,kind,at,required(o,'reference'),actor]);
  }
  if(cmd==='set-deadline')return db.query('update voyages set time_bar_at=$2,deadline_ref=$3 where id=$1 returning code,time_bar_at',[id,timestamp(required(o,'at')),required(o,'reference')]);
  const gaps=await db.query(`select p.id from port_calls p left join latest_calculations c on c.port_id=p.id where p.voyage_id=$1 and p.superseded_by is null and (not p.reviewed or c.id is null or c.revision<>p.revision or c.direction='REVIEW')`,[id]);
  const count=await db.query('select id from port_calls where voyage_id=$1 and superseded_by is null',[id]);
  const agreement=await db.query("select id from claim_records where voyage_id=$1 and kind='agreed'",[id]);
  if(gaps.length||!count.length||!agreement.length)throw Error('Closure needs current reviewed calculations and recorded agreement evidence');
  return db.query("update voyages set status='closed',closed_ref=$2 where id=$1 returning code,status",[id,required(o,'reference')]);
 }
 if(cmd==='import'){
  if(pos[0]!=='layline')throw Error('Use import layline --file=<statement.pdf>');
  const input=await readStatement(required(o,'file'));
  const existing=await db.query('select id from imports where source_hash=$1',[input.hash]);
  if(existing.length)return [{duplicate:true,source_hash:input.hash}];
  const v=await resolve(db,'voyages',required(o,'voyage'));await openVoyage(db,v);
  const parsed=input.parsed;
  const imp=(await db.query('insert into imports(source_hash,filename,source_text,parsed,actor,original_base64) values($1,$2,$3,$4,$5,$6) returning id',[input.hash,path.basename(o.file),input.text,JSON.stringify(parsed),actor,input.original_base64]))[0];
  const p=(await db.query(`insert into port_calls(code,voyage_id,name,currency,import_id,allowed_minutes,demurrage_rate_cents,despatch_rate_cents) values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,[code(required(o,'code')),v,parsed.port,currency(required(o,'currency')),imp.id,parsed.allowed_minutes,parsed.demurrage_rate_cents,parsed.despatch_rate_cents]))[0];
  for(const e of parsed.events)await db.query('insert into source_events(port_id,source_key,occurred_at,description,counts,factor) values($1,$2,$3,$4,$5,$6)',[p.id,e.source_key,e.occurred_at,e.description,e.counts,e.factor]);
  return [{port_call:o.code,events:parsed.events.length,reviewed:false,source_hash:input.hash,source_type:parsed.source_laytime_type}];
 }
 throw Error('Unknown mutation');
}
const exportTables=['voyages','port_calls','exceptions','exception_voids','source_events','calculations','imports','notes','claim_records','audit_log'];
export async function run(db,argv){
 const {positional,flags:o}=options(argv),cmd=positional.shift()||'help';
 const known=new Set(['json','dry-run','actor','code','name','vessel','counterparty','owner','time-bar-at','deadline-ref','voyage','currency','port','commenced','completed','allowed-minutes','demurrage-rate','despatch-rate','contract-ref','nor-ref','from','to','reason','clause-ref','on-demurrage','exception','replacement','reference','body','kind','at','file','out']);
 for(const k of Object.keys(o))if(!known.has(k))throw Error('Unknown flag --'+k);
 for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error('--'+k+' is a switch, not a value');
 if(cmd in reads)return db.query(reads[cmd]);
 if(cmd==='help')return [{commands:commandNames.join(', '),hint:'Recipes in .claude/commands. Add --json. Mutations require --actor.'}];
 if(cmd==='voyage'){
  const id=await resolve(db,'voyages',positional[0]);return [{...(await db.query('select * from voyages where id=$1',[id]))[0],calls:await db.query('select code,name,reviewed from port_calls where voyage_id=$1 order by code',[id]),notes:await db.query('select body,actor,created_at from notes where voyage_id=$1 order by created_at',[id]),claims:await db.query('select kind,reference,occurred_at from claim_records where voyage_id=$1 order by occurred_at',[id])}];
 }
 if(cmd==='port'){const {p,exceptions}=await portData(db,positional[0]);return [{...p,exceptions,events:await db.query('select source_key,occurred_at,description,counts,factor from source_events where port_id=$1 order by occurred_at',[p.id]),calculations:await db.query('select revision,currency,direction,amount_cents,used_minutes,saved_minutes,intervals from calculations where port_id=$1 order by created_at',[p.id])}];}
 if(mutations.includes(cmd)){
  const actor=required(o,'actor');await db.exec('BEGIN');
  try{await db.query("select set_config('app.actor',$1,true)",[actor]);const result=await mutate(db,cmd,o,positional);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result.map(x=>({...x,...(o['dry-run']?{dry_run:true}:{})}));}catch(e){await db.exec('ROLLBACK');throw e;}
 }
 if(['weekly-review','draft-statement','draft-claim'].includes(cmd)){
  let title,sections;
  await db.exec('BEGIN READ ONLY');
  try{
   if(cmd==='weekly-review'){
    title='DRAFT: Weekly laytime review';sections=[];for(const key of ['claim-round','attention','time-bars'])sections.push({title:key.replaceAll('-',' '),html:table(await run(db,[key]))});
   }else{
    const {p,exceptions}=await portData(db,positional[0]);const c=(await db.query('select * from latest_calculations where port_id=$1',[p.id]))[0];
    if(p.superseded_by||!p.reviewed||!c||c.revision!==p.revision||c.direction==='REVIEW')throw Error('Draft needs a current reviewed calculation with an agreed rate');
    title=`DRAFT: ${cmd==='draft-claim'?'Demurrage or despatch claim working paper':'Laytime statement'} ${p.code}`;
    sections=[{title:'Reviewed terms',html:record(p,['code','name','currency','allowed_minutes','commenced_at','completed_at','contract_ref','nor_ref','reviewer','review_ref'])},{title:'Calculation',html:record(c,['direction','amount_cents','used_minutes','excluded_minutes','demurrage_minutes','saved_minutes'])},{title:'Interval ledger',html:table(c.intervals)},{title:'Exceptions',html:table(exceptions,['starts_at','ends_at','reason','clause_ref','on_demurrage'])}];
   }
  }finally{await db.exec('ROLLBACK');}
  const file=writeOut('drafts',`${cmd}-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,page({title,subtitle:'Working paper for operator review. Nothing has been sent or lodged.',sections}));return [{file}];
 }
 if(cmd==='export'){
  const name=code(required(o,'out'));const base=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'exports');fs.mkdirSync(base,{recursive:true,mode:0o700});const dir=path.join(base,name);if(fs.existsSync(dir))throw Error('Export destination already exists');
  const data={format:'laytime-archive-v1',created_at:new Date().toISOString(),tables:{}};
  await db.exec('BEGIN READ ONLY');try{for(const t of exportTables)data.tables[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  fs.mkdirSync(dir,{mode:0o700});const file=path.join(dir,'archive.json');fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});return [{file,records:Object.values(data.tables).reduce((n,r)=>n+r.length,0)}];
 }
 throw Error('Unknown command: '+cmd+'. Use help.');
}
export function format(rows){
 if(!rows.length)return 'No records.';
 const cols=Object.keys(rows[0]).filter(x=>!['intervals','input'].includes(x));
 const value=(r,k)=>{const v=r[k];if(v===null||v===undefined)return 'pending';if(v instanceof Date)return v.toISOString();if(k.endsWith('_cents'))return `${r.currency||''} ${(Number(v)/100).toFixed(2)}`.trim();if(typeof v==='object')return JSON.stringify(v);return String(v).replaceAll('|','/').replaceAll('\n',' ');};
 return ['| '+cols.join(' | ')+' |','| '+cols.map(()=>'---').join(' | ')+' |',...rows.map(r=>'| '+cols.map(k=>value(r,k)).join(' | ')+' |')].join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
