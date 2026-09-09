import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const roles = await sql`SELECT value FROM admin_settings WHERE key = 'duty_roles'`;
  const sched = await sql`SELECT value->'2026-09-09' as sep9 FROM admin_settings WHERE key = 'schedules'`;
  console.log('ROLES in DB:', roles[0]?.value);
  console.log('2026-09-09 schedule in DB:', sched[0]?.sep9);
}
main().catch(console.error);
