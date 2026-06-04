const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Creating database...');

    // Drop existing database if it exists
    await pool.query(`DROP DATABASE IF EXISTS logoai`);

    // Create new database
    await pool.query(`CREATE DATABASE logoai`);

    console.log('Database created successfully');

    // Close connection to postgres database
    await pool.end();

    // Connect to logoai database
    const logoaiPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: 'logoai',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    console.log('Running schema...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await logoaiPool.query(schema);

    console.log('Schema executed successfully');

    await logoaiPool.end();

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();