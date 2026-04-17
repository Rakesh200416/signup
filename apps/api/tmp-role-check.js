const { Client } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((line) => line.startsWith('DATABASE_URL='));
const databaseUrl = env.split('=')[1].replace(/^"|"$/g, '');
(async () => {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const query = `SELECT enumlabel FROM pg_enum WHERE enumtypid = '"Role"'::regtype;`;
  const res = await client.query(query);
  console.log(res.rows);
  await client.end();
})();
