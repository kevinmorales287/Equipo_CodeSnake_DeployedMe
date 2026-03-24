const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runSQL() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cie10_ontologia',
        multipleStatements: true
    });

    const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
    
    try {
        await connection.query(sql);
        console.log('✅ SQL ejecutado con éxito');
    } catch (err) {
        console.error('❌ Error ejecutando SQL:', err);
    } finally {
        await connection.end();
    }
}

runSQL();
