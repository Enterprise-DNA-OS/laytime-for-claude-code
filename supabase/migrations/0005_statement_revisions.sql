alter table port_calls add column superseded_by uuid references port_calls;
alter table port_calls add column superseded_ref text;
alter table port_calls add constraint superseded_reason check(superseded_by is null or (superseded_by<>id and length(trim(superseded_ref))>0));
create function guard_supersession() returns trigger language plpgsql as $$
begin
 if TG_OP='UPDATE' and old.superseded_by is not null then raise exception 'Port call has been superseded'; end if;
 if new.superseded_by is not null then
   if not exists(select 1 from port_calls where id=new.superseded_by and voyage_id=new.voyage_id and superseded_by is null) then raise exception 'Replacement must be an active call on the same voyage'; end if;
 end if;
 return new;
end $$;
create trigger supersession_guard before insert or update on port_calls for each row execute function guard_supersession();
create or replace view claim_round as
 select v.code voyage,v.vessel,v.counterparty,v.owner,p.code port_call,p.name port,
 p.reviewed, p.currency, case when c.revision=p.revision and p.reviewed then c.direction end direction,
 case when c.revision=p.revision and p.reviewed then c.amount_cents end amount_cents,
 case when c.revision=p.revision and p.reviewed then c.used_minutes end used_minutes,
 case when c.revision=p.revision and p.reviewed then c.saved_minutes end saved_minutes,
 coalesce(c.revision=p.revision and p.reviewed,false) current_calculation,
 v.time_bar_at,v.status from voyages v join port_calls p on p.voyage_id=v.id
 left join latest_calculations c on c.port_id=p.id where p.superseded_by is null;
alter view compliance_checks rename to historical_compliance_checks;
create view compliance_checks as select c.* from historical_compliance_checks c
 where c.port_call is null or exists(select 1 from port_calls p where p.code=c.port_call and p.superseded_by is null);
revoke all on compliance_checks from public;
