// Fixed allowance, separately settled port calls with explicitly reviewed windows.
// All timestamps resolve to whole UTC minutes; money rounds once with integer math.
export function minute(value) {
 const s=value instanceof Date?value.toISOString():String(value);
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::00(?:\.000)?)?(?:Z|[+-]\d\d:\d\d)$/.test(s)) throw Error('Timestamp needs whole minutes and an explicit timezone');
 if(Number(s.slice(11,13))>23||Number(s.slice(14,16))>59)throw Error('Invalid clock time');
 const n=Date.parse(s); if(!Number.isFinite(n)||n%60000) throw Error('Invalid minute timestamp');
 const date=s.slice(0,10),[y,m,d]=date.split('-').map(Number);
 if(new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)!==date)throw Error('Invalid calendar date');
 return n/60000;
}
export function integer(v,label,max=1000000000){if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)>max)throw Error(`${label} must be a nonnegative whole number <= ${max}`);return Number(v);}
export function cents(v){if(!/^\d+(?:\.\d{1,2})?$/.test(String(v)))throw Error('Rate needs a nonnegative amount with at most two decimals'); const [whole,frac='']=String(v).split('.');return integer(BigInt(whole)*100n+BigInt(frac.padEnd(2,'0')),'Rate cents',100000000000);}
const round=(minutes,rate)=>Number((BigInt(minutes)*BigInt(rate)+720n)/1440n);
export function calculate(port,exceptions=[]) {
 const start=minute(port.commenced_at),end=minute(port.completed_at);
 if(end<=start||end-start>5256000)throw Error('Port interval must be positive and at most ten years');
 const allowance=integer(port.allowed_minutes,'Allowed minutes');
 const rate=integer(port.demurrage_rate_cents,'Demurrage cents',100000000000);
 const despatch=port.despatch_rate_cents==null?null:integer(port.despatch_rate_cents,'Despatch cents',100000000000);
 const windows=exceptions.map(x=>({...x,a:minute(x.starts_at),b:minute(x.ends_at)})).sort((a,b)=>a.a-b.a);
 for(let i=0;i<windows.length;i++){const x=windows[i];if(x.a<start||x.b>end||x.b<=x.a)throw Error('Exception must fall inside the reviewed port interval');if(i&&x.a<windows[i-1].b)throw Error('Exception overlaps another interval');}
 const edges=[...new Set([start,end,...windows.flatMap(x=>[x.a,x.b])])].sort((a,b)=>a-b);
 let remaining=allowance,demurrage=0,excluded=0;const intervals=[];
 const put=(a,b,kind,reason)=>{if(b>a)intervals.push({from:new Date(a*60000).toISOString(),to:new Date(b*60000).toISOString(),minutes:b-a,kind,reason});};
 for(let i=1;i<edges.length;i++){
  const a=edges[i-1],b=edges[i],n=b-a,w=windows.find(x=>a>=x.a&&b<=x.b);
  if(w&&remaining>0){excluded+=n;put(a,b,'excluded',w.reason);continue;}
  const normal=Math.min(remaining,n);remaining-=normal;put(a,a+normal,'laytime','Reviewed fixed allowance');
  const extra=n-normal;
  if(extra&&w?.on_demurrage){excluded+=extra;put(a+normal,b,'excluded',w.reason);}
  else if(extra){demurrage+=extra;put(a+normal,b,'demurrage',w?'Exception does not apply on demurrage':'Allowance exhausted');}
 }
 const direction=demurrage?'DEMURRAGE':remaining?(despatch==null?'REVIEW':'DESPATCH'):'BALANCED';
 const amount=direction==='DEMURRAGE'?round(demurrage,rate):direction==='DESPATCH'?round(remaining,despatch):direction==='REVIEW'?null:0;
 return {currency:port.currency,used_minutes:allowance-remaining+demurrage,excluded_minutes:excluded,demurrage_minutes:demurrage,saved_minutes:remaining,direction,amount_cents:amount,intervals};
}
