const express = require('express');
const cors    = require('cors');
const path    = require('path');

const abreviaturasRouter = require('./api/abreviaturas');
const auditoriaRouter = require('./api/auditoria').router;
const auditMiddleware = require('./api/auditoria').middleware;
const usuariosRouter = require('./api/usuarios');
const conceptosRouter = require('./api/conceptos');
const notasMedicasRouter = require('./api/notas-medicas');
const notasEnfermeriaRouter = require('./api/notas-enfermeria');

const app  = express();
app.use(cors());
app.use(express.json());
app.use(auditMiddleware);
app.use(express.static(path.join(__dirname)));

app.use('/api/abreviaturas', abreviaturasRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/conceptos', conceptosRouter);
app.use('/api/notas-medicas', notasMedicasRouter);
app.use('/api/notas-enfermeria', notasEnfermeriaRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('--- 🚨 SERVER ERROR:', err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('ClinData Server http://localhost:3000'));