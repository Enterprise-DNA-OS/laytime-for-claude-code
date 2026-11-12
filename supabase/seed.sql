select set_config('app.actor','Fictional demo seed',true);
do $$ declare va uuid; vb uuid; vc uuid; pa uuid; pb uuid; begin
 if exists(select 1 from voyages where code='DEMO-PACIFIC') then return; end if;
 insert into voyages(code,name,vessel,counterparty,owner,time_bar_at,deadline_ref)
 values('DEMO-PACIFIC','Pacific grain discharge','MV Example Pacific','Example Grain','Mara',date_trunc('day',now())+interval '5 days 17 hours','Fictional charter clause 18: agreed deadline') returning id into va;
 insert into voyages(code,name,vessel,counterparty,owner,time_bar_at,deadline_ref,created_at,updated_at)
 values('DEMO-SOUTH','Southern fertiliser discharge','MV Example Southern','Example Bulk','Eli',date_trunc('day',now())-interval '2 days','Fictional charter clause 21',now()-interval '28 days',now()-interval '28 days') returning id into vb;
 insert into voyages(code,name,vessel,counterparty,owner,created_at,updated_at)
 values('DEMO-HARBOUR','Harbour feed loading','MV Example Harbour','Example Grain','Mara',now()-interval '21 days',now()-interval '21 days') returning id into vc;
 insert into port_calls(code,voyage_id,name,currency,allowed_minutes,demurrage_rate_cents,despatch_rate_cents,commenced_at,completed_at,contract_ref,nor_ref)
 values('DEMO-TAURANGA',va,'Tauranga','USD',2880,1200000,600000,date_trunc('day',now())-interval '10 days',date_trunc('day',now())-interval '7 days','Fictional charter 12, separate port settlement, working time saved','Fictional accepted NOR record') returning id into pa;
 insert into exceptions(port_id,starts_at,ends_at,reason,clause_ref)
 values(pa,date_trunc('day',now())-interval '9 days',date_trunc('day',now())-interval '9 days'+interval '6 hours','Rain stopped discharge','Fictional weather clause 12');
 insert into exceptions(port_id,starts_at,ends_at,reason,clause_ref,on_demurrage)
 values(pa,date_trunc('day',now())-interval '8 days'+interval '10 hours',date_trunc('day',now())-interval '8 days'+interval '14 hours','Rain after allowance expired','Fictional weather clause 12 excludes laytime only',false);
 update port_calls set reviewed=true,review_ref='Fictional terms review',reviewer='Mara' where id=pa;
 insert into port_calls(code,voyage_id,name,currency,allowed_minutes,demurrage_rate_cents,despatch_rate_cents,commenced_at,completed_at,contract_ref,nor_ref,reviewed,review_ref,reviewer)
 values('DEMO-NAPIER',va,'Napier','USD',2880,1200000,600000,date_trunc('day',now())-interval '5 days',date_trunc('day',now())-interval '5 days'+interval '36 hours','Fictional separate port contract','Fictional accepted NOR',true,'Fictional terms review','Mara') returning id into pb;
 insert into port_calls(code,voyage_id,name,currency,allowed_minutes,demurrage_rate_cents)
 values('DEMO-FREMANTLE',vb,'Fremantle','AUD',1440,900000),('DEMO-HARBOUR-CALL',vc,'Auckland','NZD',2880,800000);
 insert into source_events(port_id,source_key,occurred_at,description,counts,factor)
 values(pa,'DEMO-E1',date_trunc('day',now())-interval '10 days','Reviewed commencement',true,'100'),(pa,'DEMO-E2',date_trunc('day',now())-interval '7 days','Cargo complete',true,'100');
 insert into notes(voyage_id,body,actor,created_at) values(vb,'Fictional counterparty asked for the signed statement of facts.','Eli',now()-interval '20 days');
end $$;
