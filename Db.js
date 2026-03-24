require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let isJsonMode = false;

async function init() {
  if (pool || isJsonMode) return;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 2000
    });
    await pool.query('SELECT 1');
    console.log('--- ✅ Modo MySQL activo ---');
  } catch (err) {
    console.warn('--- 📁 Modo JSON (offline) activo ---');
    isJsonMode = true;
    pool = null;
  }
}

const db = {
  async query(tableOrSql, paramsOrFilters = {}) {
    await init();
    const isSql = typeof tableOrSql === 'string' && tableOrSql.trim().toUpperCase().startsWith('SELECT');
    
    if (!isJsonMode && pool) {
      try {
        let sql, values;
        if (isSql) {
          sql = tableOrSql;
          values = Array.isArray(paramsOrFilters) ? paramsOrFilters : [];
        } else {
          sql = `SELECT * FROM \`${tableOrSql}\` WHERE 1=1`;
          values = [];
          for (const [key, value] of Object.entries(paramsOrFilters)) {
            if (typeof value === 'string' && value.includes('%')) {
              sql += ` AND \`${key}\` LIKE ?`;
            } else {
              sql += ` AND \`${key}\` = ?`;
            }
            values.push(value);
          }
        }
        const [rows] = await pool.query(sql, values);
        return rows;
      } catch (err) {
        console.error('Error MySQL query reintentando JSON:', err.message);
        // Only fallback if we can determine the table
      }
    }

    // JSON Fallback
    let table = tableOrSql;
    let filters = paramsOrFilters;

    if (isSql) {
      const match = tableOrSql.match(/FROM\s+`?([a-zA-Z0-9_]+)`?/i);
      table = match ? match[1].toLowerCase() : null;
      filters = {}; // Raw SQL filters are hard to map to JSON fallback without a parser
    }

    if (!table) throw new Error("No se pudo determinar la tabla para el fallback JSON");

    const filePath = path.join(__dirname, 'database', `${table}.json`);
    if (!fs.existsSync(filePath)) {
      if (table === 'auditoria') return [];
      throw new Error(`Archivo JSON no encontrado para: ${table}`);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (isSql) return data.slice(0, 100); // Return first 100 for raw SQL fallback

    return data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === 'string' && value.includes('%')) {
          const regex = new RegExp('^' + value.replace(/%/g, '.*') + '$', 'i');
          if (!regex.test(item[key])) return false;
        } else if (item[key] != value) return false;
      }
      return true;
    });
  },

  async insert(table, data) {
    await init();
    if (!isJsonMode && pool) {
      try {
        const keys = Object.keys(data), values = Object.values(data);
        const sql = `INSERT INTO \`${table}\` (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
        const [result] = await pool.query(sql, values);
        return { id: result.insertId, ...data };
      } catch (err) { console.error('Error insert MySQL fallback JSON:', err.message); }
    }
    const filePath = path.join(__dirname, 'database', `${table}.json`);
    let list = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    const newItem = { id: Date.now(), ...data };
    list.push(newItem);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    return newItem;
  },

  async update(table, id, data) {
    await init();
    if (!isJsonMode && pool) {
      try {
        const keys = Object.keys(data), values = Object.values(data);
        const sql = `UPDATE \`${table}\` SET ${keys.map(k=>`\`${k}\`=?`).join(',')} WHERE id=?`;
        await pool.query(sql, [...values, id]);
        return { id, ...data };
      } catch (err) { console.error('Error update MySQL fallback JSON:', err.message); }
    }
    const filePath = path.join(__dirname, 'database', `${table}.json`);
    let list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const idx = list.findIndex(i => i.id == id);
    if (idx!==-1) {
      list[idx] = { ...list[idx], ...data };
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
      return list[idx];
    }
    throw new Error('Registro no encontrado para actualizar');
  },

  async getPool() { await init(); return pool; },
  async getMode() { await init(); return isJsonMode ? 'JSON' : 'MySQL'; }
};

module.exports = db;
