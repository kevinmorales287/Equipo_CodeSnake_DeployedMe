// db.js — Conexión a MySQL
// Cambia los valores de user y password por los tuyos

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',          // tu usuario de MySQL
  password: 't0mmy_2026', // la contraseña que pusiste al instalar MySQL
  database: 'expediente_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;