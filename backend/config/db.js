const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'bus_management',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Helper to test the database connection and log status
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}, Database: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('================================================================');
    console.error('[Database Error] Failed to connect to MySQL database.');
    console.error(`Error details: ${error.message}`);
    console.error('----------------------------------------------------------------');
    console.error('Possible solutions:');
    console.error('1. Make sure your MySQL Server is running.');
    console.error('2. Verify your credentials in backend/.env.');
    console.error('3. Run the schema script in database/bus_management.sql using:');
    console.error('   mysql -u ' + dbConfig.user + ' -p < database/bus_management.sql');
    console.error('================================================================');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
