create table exception_voids (
 id uuid primary key default gen_random_uuid(), exception_id uuid not null unique references exceptions,
 reason text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table exception_voids enable row level security;
revoke all on exception_voids from public;
create trigger void_audit after insert on exception_voids for each row execute function audit_record();
create trigger void_immutable before update or delete on exception_voids for each row execute function immutable_record();
create view active_exceptions as select e.* from exceptions e where not exists(select 1 from exception_voids v where v.exception_id=e.id);
revoke all on active_exceptions from public;
create or replace function guard_exception() returns trigger language plpgsql as $$
declare p port_calls;
begin
 select * into p from port_calls where id=new.port_id for update;
 if (select status from voyages where id=p.voyage_id)='closed' then raise exception 'Voyage is closed'; end if;
 if exists(select 1 from active_exceptions where port_id=new.port_id and starts_at<new.ends_at and ends_at>new.starts_at) then raise exception 'Exception overlaps another interval'; end if;
 update port_calls set reviewed=false,review_ref='',reviewer='' where id=new.port_id;
 return new;
end $$;
create function invalidate_void() returns trigger language plpgsql as $$
begin
 update port_calls set reviewed=false,review_ref='',reviewer='' where id=(select port_id from exceptions where id=new.exception_id);
 return new;
end $$;
create trigger void_invalidates before insert on exception_voids for each row execute function invalidate_void();
