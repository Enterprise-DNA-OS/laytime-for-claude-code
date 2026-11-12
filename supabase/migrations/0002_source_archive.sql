alter table imports add column original_base64 text not null;
alter table calculations alter column created_at set default clock_timestamp();
