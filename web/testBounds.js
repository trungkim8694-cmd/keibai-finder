const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL || "postgresql://keibai_user:keibai_password@localhost:5433/keibai_db");
async function run() {
  await client.connect();
  const res = await client.query('SELECT MIN(lat) as min_lat, MAX(lat) as max_lat, MIN(lng) as min_lng, MAX(lng) as max_lng FROM "Property"');
  console.log(res.rows[0]);
  await client.end();
}
run();
