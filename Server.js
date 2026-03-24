const express = require('express');
const cors    = require('cors');
const path    = require('path');

const abreviaturasRouter = require('./api/abreviaturas');
const { router: auditoriaRouter, middleware: auditMiddleware } = require('./api/auditoria');
const usuariosRouter = require('./api/usuarios');
const conceptosRouter = require('./api/conceptos');

const app  = express();
app.use(cors());
app.use(express.json());
app.use(auditMiddleware);
app.use(express.static(path.join(__dirname)));

app.use('/api/abreviaturas', abreviaturasRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/conceptos', conceptosRouter);

app.listen(3000, () => console.log('ClinData Server http://localhost:3000'));