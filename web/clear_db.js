const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL || "postgresql://keibai_user:keibai_password@localhost:5433/keibai_db");

async function run() {
  try {
    await client.connect();
    // Delete all dependent tables first to avoid foreign key constraints
    await client.query('DELETE FROM "AuctionHistory"');
    await client.query('DELETE FROM "Property"');
    await client.query('DELETE FROM "AuctionResult"');
    const res = await client.query('SELECT COUNT(*) FROM "Property"');
    console.log(`Database Status: ${res.rows[0].count} properties`);
  } catch (err) {
    console.error("Error wiping DB:", err);
  } finally {
    await client.end();
  }
}
run();
