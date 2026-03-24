require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let isJsonMode = false;

async function init() {
  if (pool || isJsonMode) return;
  try {
    // Intentar conectar a MySQL
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 2000 // Timeout corto para detectar fallo rápido
    });
    // Test connection
    await pool.query('SELECT 1');
    console.log('--- ✅ Modo MySQL activo ---');
  } catch (err) {
    console.warn('--- 📁 Modo JSON (offline) activo ---');
    isJsonMode = true;
    pool = null;
  }
}

const db = {
  async query(table, filters = {}) {
    await init();
    
    if (!isJsonMode && pool) {
      try {
        // MySQL Mode
        let sql = `SELECT * FROM \`${table}\` WHERE 1=1`;
        const values = [];
        for (const [key, value] of Object.entries(filters)) {
          if (typeof value === 'string' && value.includes('%')) {
            sql += ` AND \`${key}\` LIKE ?`;
          } else {
            sql += ` AND \`${key}\` = ?`;
          }
          values.push(value);
        }
        const [rows] = await pool.query(sql, values);
        return rows;
      } catch (err) {
        console.error('Error en MySQL query, reintentando con JSON:', err.message);
        isJsonMode = true;
      }
    }

    // JSON Mode (si falla MySQL o ya está en modo JSON)
    const filePath = path.join(__dirname, 'database', `${table}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo JSON no encontrado para la tabla: ${table}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === 'string' && value.includes('%')) {
          const regex = new RegExp('^' + value.replace(/%/g, '.*') + '$', 'i');
          if (!regex.test(item[key])) return false;
        } else {
          if (item[key] != value) return false;
        }
      }
      return true;
    });
  },
  
  async getPool() {
    await init();
    if (isJsonMode) throw new Error('No hay conexión a MySQL disponible');
    return pool;
  },

  async getMode() {
    await init();
    return isJsonMode ? 'JSON' : 'MySQL';
  }
};

module.exports = db;
