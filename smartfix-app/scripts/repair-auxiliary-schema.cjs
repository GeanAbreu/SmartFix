// Restore auxiliary tables on databases that already have the SmartFix DER tables.
// Run from smartfix-app: node scripts/repair-auxiliary-schema.cjs [--inspect|--apply]
const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');
const fs = require('node:fs');

loadEnvConfig(process.cwd(), true);
const mode = process.argv[2] || '--inspect';
if (!['--inspect', '--apply'].includes(mode)) throw new Error('Use --inspect or --apply');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente');
  const ssl = process.env.DB_SSL === 'false' ? false : {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(process.env.DB_SSL_CA_FILE ? { ca: fs.readFileSync(process.env.DB_SSL_CA_FILE, 'utf8') } : {}),
  };
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl, connectionTimeoutMillis: 10000 });
  try {
    await db.connect();
    const expected = ['clients','partner','client_addresses','devices','repair_orders','reviews','partner_services'];
    const present = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)", [expected])).rows.map(row => row.table_name);
    const missing = expected.filter(name => !present.includes(name));
    if (missing.length) throw new Error(`DER incompleto: ${missing.join(', ')}`);
    const names = ['workflow_records', 'support_messages'];
    const status = async () => (await db.query("SELECT relname, relrowsecurity AS rls FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1) ORDER BY relname", [names])).rows;
    console.log('Tabelas auxiliares:', await status());
    if (mode === '--inspect') return;
    await db.query('BEGIN');
    try {
      await db.query("SET LOCAL lock_timeout = '10s'");
      await db.query(`CREATE TABLE IF NOT EXISTS public.workflow_records (
        id uuid PRIMARY KEY,
        kind varchar(20) NOT NULL CHECK (kind IN ('notification', 'reset', 'google', 'service')),
        owner_id uuid NOT NULL,
        data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object')
      )`);
      await db.query('CREATE INDEX IF NOT EXISTS workflow_owner_kind ON public.workflow_records(owner_id, kind)');
      await db.query("CREATE UNIQUE INDEX IF NOT EXISTS workflow_google_identity ON public.workflow_records ((data->>'subject')) WHERE kind = 'google'");
      await db.query(`CREATE TABLE IF NOT EXISTS public.support_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
        recipient_role varchar(10) NOT NULL CHECK (recipient_role IN ('smartfix', 'partner')),
        partner_id uuid REFERENCES public.partner(id) ON DELETE CASCADE,
        sender_role varchar(10) NOT NULL CHECK (sender_role IN ('client', 'admin', 'partner')),
        sender_id uuid NOT NULL,
        body varchar(2000) NOT NULL CHECK (length(btrim(body)) > 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT support_recipient_match CHECK ((recipient_role = 'smartfix' AND partner_id IS NULL) OR (recipient_role = 'partner' AND partner_id IS NOT NULL))
      )`);
      await db.query('CREATE INDEX IF NOT EXISTS support_messages_client_created_idx ON public.support_messages(client_id, recipient_role, partner_id, created_at, id)');
      await db.query('CREATE INDEX IF NOT EXISTS support_messages_partner_created_idx ON public.support_messages(partner_id, client_id, created_at, id) WHERE partner_id IS NOT NULL');
      for (const table of names) {
        await db.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
        await db.query(`REVOKE ALL ON public.${table} FROM PUBLIC`);
        const roles = (await db.query("SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated')")).rows;
        for (const role of roles) await db.query(`REVOKE ALL ON public.${table} FROM ${role.rolname}`);
      }
      // Exercise the exact read that failed without modifying any session record.
      await db.query("SELECT id FROM public.workflow_records WHERE kind='reset' LIMIT 0");
      await db.query('SELECT id FROM public.support_messages LIMIT 0');
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    console.log('Tabelas auxiliares após correção:', await status());
  } finally { await db.end().catch(() => {}); }
}
main().catch(error => { console.error('Correção falhou:', error.code || error.message); process.exitCode = 1; });
