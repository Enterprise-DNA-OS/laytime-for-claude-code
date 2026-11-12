create or replace view claim_round as
 select v.code voyage,v.vessel,v.counterparty,v.owner,p.code port_call,p.name port,
 p.reviewed, p.currency, case when c.revision=p.revision and p.reviewed then c.direction end direction,
 case when c.revision=p.revision and p.reviewed then c.amount_cents end amount_cents,
 case when c.revision=p.revision and p.reviewed then c.used_minutes end used_minutes,
 case when c.revision=p.revision and p.reviewed then c.saved_minutes end saved_minutes,
 coalesce(c.revision=p.revision and p.reviewed,false) current_calculation,
 v.time_bar_at,v.status from voyages v join port_calls p on p.voyage_id=v.id
 left join latest_calculations c on c.port_id=p.id;
