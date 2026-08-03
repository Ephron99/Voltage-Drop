const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

async function initDatabase() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      multipleStatements: true,
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await conn.query(stmt);
    }

    console.log('[INIT-DB] Database created and schema applied successfully.');
    return true;
  } catch (err) {
    console.error('[INIT-DB] Failed:', err.message);
    return false;
  } finally {
    if (conn) await conn.end();
  }
}

if (require.main === module) {
  initDatabase().then((ok) => process.exit(ok ? 0 : 1));
}

module.exports = { initDatabase };
