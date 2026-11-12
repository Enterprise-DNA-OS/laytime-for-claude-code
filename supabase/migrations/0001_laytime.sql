create table voyages (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 vessel text not null, counterparty text not null, owner text not null,
 time_bar_at timestamptz, deadline_ref text not null default '',
 status text not null default 'open' check(status in ('open','closed')),
 closed_ref text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(time_bar_at is null or length(trim(deadline_ref))>0)
);
create table imports (
 id uuid primary key default gen_random_uuid(), source_hash text not null unique, filename text not null,
 source_text text not null, parsed jsonb not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table port_calls (
 id uuid primary key default gen_random_uuid(), code text not null unique, voyage_id uuid not null references voyages,
 name text not null, import_id uuid references imports, currency text not null default 'USD' check(currency ~ '^[A-Z]{3}$'),
 allowed_minutes integer check(allowed_minutes>=0), demurrage_rate_cents bigint check(demurrage_rate_cents>=0 and demurrage_rate_cents<=100000000000),
 despatch_rate_cents bigint check(despatch_rate_cents>=0 and despatch_rate_cents<=100000000000),
 commenced_at timestamptz, completed_at timestamptz,
 contract_ref text not null default '', nor_ref text not null default '',
 reviewed boolean not null default false, review_ref text not null default '', reviewer text not null default '',
 revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(completed_at is null or commenced_at is null or completed_at>commenced_at),
 check(not reviewed or (allowed_minutes is not null and demurrage_rate_cents is not null and commenced_at is not null and completed_at is not null and length(trim(contract_ref))>0 and length(trim(nor_ref))>0 and length(trim(review_ref))>0 and length(trim(reviewer))>0))
);
create table exceptions (
 id uuid primary key default gen_random_uuid(), port_id uuid not null references port_calls,
 starts_at timestamptz not null, ends_at timestamptz not null, reason text not null, clause_ref text not null,
 on_demurrage boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table source_events (
 id uuid primary key default gen_random_uuid(), port_id uuid not null references port_calls,
 source_key text not null, occurred_at timestamptz not null, description text not null,
 counts boolean not null, factor text not null, unique(port_id,source_key),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table calculations (
 id uuid primary key default gen_random_uuid(), port_id uuid not null references port_calls, revision integer not null,
 currency text not null, used_minutes integer not null, excluded_minutes integer not null,
 demurrage_minutes integer not null, saved_minutes integer not null,
 direction text not null, amount_cents bigint, input jsonb not null, intervals jsonb not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), voyage_id uuid not null references voyages,
 body text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table claim_records (
 id uuid primary key default gen_random_uuid(), voyage_id uuid not null references voyages,
 kind text not null check(kind in ('submitted','agreed','disputed')), occurred_at timestamptz not null,
 reference text not null unique, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid not null,
 operation text not null, actor text not null, before_row jsonb, after_row jsonb,
 created_at timestamptz not null default now()
);
create function touch_record() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$
begin raise exception 'History is append-only'; end $$;
create function audit_record() returns trigger language plpgsql as $$
declare who text;
begin
 who=current_setting('app.actor',true);
 if who is null or length(trim(who))=0 then raise exception 'A named actor is required'; end if;
 insert into audit_log(entity,entity_id,operation,actor,before_row,after_row)
 values(TG_TABLE_NAME,new.id,TG_OP,who,case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
create function guard_port() returns trigger language plpgsql as $$
begin
 perform 1 from voyages where id=new.voyage_id for update;
 if (select status from voyages where id=new.voyage_id)='closed' then raise exception 'Voyage is closed'; end if;
 if TG_OP='UPDATE' then
   new.revision=old.revision+1;
   -- Terms cannot change and retain approval, even through direct SQL.
   if (to_jsonb(new)-array['reviewed','review_ref','reviewer','revision','updated_at']) is distinct from
      (to_jsonb(old)-array['reviewed','review_ref','reviewer','revision','updated_at']) then
     new.reviewed=false;new.review_ref='';new.reviewer='';
   end if;
 end if;
 return new;
end $$;
create trigger port_guard before insert or update on port_calls for each row execute function guard_port();
create function guard_exception() returns trigger language plpgsql as $$
declare p port_calls;
begin
 select * into p from port_calls where id=new.port_id for update;
 if (select status from voyages where id=p.voyage_id)='closed' then raise exception 'Voyage is closed'; end if;
 if exists(select 1 from exceptions where port_id=new.port_id and starts_at<new.ends_at and ends_at>new.starts_at) then raise exception 'Exception overlaps another interval'; end if;
 update port_calls set reviewed=false,review_ref='',reviewer='' where id=new.port_id;
 return new;
end $$;
create trigger exception_guard before insert on exceptions for each row execute function guard_exception();
create function guard_calculation() returns trigger language plpgsql as $$
begin
 if not exists(select 1 from port_calls where id=new.port_id and reviewed and revision=new.revision) then raise exception 'Calculation needs the current reviewed revision'; end if;
 return new;
end $$;
create trigger calculation_guard before insert on calculations for each row execute function guard_calculation();
do $$ declare t text; begin
 foreach t in array array['voyages','imports','port_calls','exceptions','source_events','calculations','notes','claim_records'] loop
   execute format('create trigger record_audit after insert or update on %I for each row execute function audit_record()',t);
   execute format('create trigger record_touch before update on %I for each row execute function touch_record()',t);
   execute format('create trigger record_no_delete before delete on %I for each row execute function immutable_record()',t);
   execute format('alter table %I enable row level security',t);
   execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['imports','exceptions','source_events','calculations','notes','claim_records'] loop
   execute format('create trigger record_no_update before update on %I for each row execute function immutable_record()',t);
 end loop;
end $$;
create trigger audit_immutable before update or delete on audit_log for each row execute function immutable_record();
alter table audit_log enable row level security;
revoke all on audit_log from public;

create view latest_calculations as
 select distinct on (port_id) * from calculations order by port_id,created_at desc,id desc;
create view claim_round as
 select v.code voyage,v.vessel,v.counterparty,v.owner,p.code port_call,p.name port,
 p.reviewed, p.currency, c.direction,
 case when c.revision=p.revision and p.reviewed then c.amount_cents end amount_cents,
 case when c.revision=p.revision and p.reviewed then c.used_minutes end used_minutes,
 case when c.revision=p.revision and p.reviewed then c.saved_minutes end saved_minutes,
 coalesce(c.revision=p.revision and p.reviewed,false) current_calculation,
 v.time_bar_at,v.status from voyages v join port_calls p on p.voyage_id=v.id
 left join latest_calculations c on c.port_id=p.id;
create view time_bars as
 select v.code,v.vessel,v.owner,v.time_bar_at,v.deadline_ref,
 case when v.time_bar_at is null then 'missing deadline' when v.time_bar_at<now() then 'past deadline' else 'approaching' end attention,
 exists(select 1 from claim_records c where c.voyage_id=v.id and c.kind='submitted') submission_recorded
 from voyages v where v.status='open' and (v.time_bar_at is null or v.time_bar_at<=now()+interval '14 days');
create view compliance_checks as
 select v.code voyage,p.code port_call,'REVIEW'::text rule,'Contract terms and commencement need operator review'::text issue from voyages v join port_calls p on p.voyage_id=v.id where v.status='open' and not p.reviewed
 union all select v.code,p.code,'CALCULATION','No calculation for the current approved inputs' from voyages v join port_calls p on p.voyage_id=v.id left join latest_calculations c on c.port_id=p.id where v.status='open' and p.reviewed and (c.id is null or c.revision<>p.revision)
 union all select v.code,p.code,'DESPATCH','Time saved but the agreed despatch rate is missing' from voyages v join port_calls p on p.voyage_id=v.id join latest_calculations c on c.port_id=p.id where v.status='open' and c.revision=p.revision and c.direction='REVIEW'
 union all select v.code,null,'TIME-BAR','No contract-backed claim deadline recorded' from voyages v where v.status='open' and v.time_bar_at is null
 union all select v.code,null,'TIME-BAR','Recorded claim deadline has passed without submission evidence' from voyages v where v.status='open' and v.time_bar_at<now() and not exists(select 1 from claim_records c where c.voyage_id=v.id and c.kind='submitted')
 union all select v.code,null,'EMPTY','Voyage has no port call records' from voyages v where v.status='open' and not exists(select 1 from port_calls p where p.voyage_id=v.id);
revoke all on latest_calculations,claim_round,time_bars,compliance_checks from public;
