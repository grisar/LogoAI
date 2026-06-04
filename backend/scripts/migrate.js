const { Pool } = require('pg');

async function migrateDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'logoai',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Checking database connection...');

    const result = await pool.query('SELECT NOW()');
    console.log('Connected to database at:', result.rows[0].now);

    await pool.end();

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error migrating database:', error);
    process.exit(1);
  }
}

migrateDatabase();