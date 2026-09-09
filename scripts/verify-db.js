import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const sched = await sql`SELECT value->'2026-09-12' as sep12, value->'2026-09-13' as sep13, value->'2026-09-14' as sep14 FROM admin_settings WHERE key = 'schedules'`;
  console.log('2026-09-12 (토) schedule:', sched[0]?.sep12);
  console.log('2026-09-13 (일) schedule:', sched[0]?.sep13);
  console.log('2026-09-14 (월) schedule:', sched[0]?.sep14);
}
main().catch(console.error);
