#!/usr/bin/env node
// Loads the demo data (supabase/seed.sql). Write seed.sql so a second run does nothing:
// wrap it in a do $$ block that returns early when a known demo row already exists.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { saveCalculation } from './laytime.mjs';

export async function seed(db) {
  await db.exec('BEGIN');
  try {
    await db.exec(readFileSync(path.join(REPO_ROOT, 'supabase', 'seed.sql'), 'utf8'));
    for (const p of await db.query("select * from port_calls where code in ('DEMO-TAURANGA','DEMO-NAPIER') and reviewed and not exists(select 1 from calculations c where c.port_id=port_calls.id)")) {
      await saveCalculation(db, p, await db.query('select * from exceptions where port_id=$1 order by starts_at', [p.id]), 'Fictional demo seed');
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const db = await getDb();
  try {
    if (db.mode === 'postgres' && !process.argv.includes('--demo-database')) {
      throw new Error('Shared database seed requires --demo-database. Use only an empty disposable demo database.');
    }
    await seed(db);
    console.log(`seed: demo data ready (${db.mode})`);
  } finally {
    await db.close();
  }
}
