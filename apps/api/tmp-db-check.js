const { Client } = require('pg');
const fs = require('fs');
const envLine = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((line) => line.startsWith('DATABASE_URL='));
const databaseUrl = envLine.split('=')[1].replace(/^"|"$/g, '');
(async () => {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const roles = await client.query("SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' ORDER BY e.enumsortorder;");
  console.log('types', roles.rows);
  const cols = await client.query("SELECT table_schema, table_name, column_name, udt_name FROM information_schema.columns WHERE table_name='User' AND column_name='role';");
  console.log('cols', cols.rows);
  await client.end();
})();
