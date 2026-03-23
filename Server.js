// server.js — Punto de entrada del servidor
// Corre con: node server.js

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const abreviaturasRouter = require('./api/abreviaturas');

const app  = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Sirve los archivos de la carpeta public (tu HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/abreviaturas', abreviaturasRouter);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});