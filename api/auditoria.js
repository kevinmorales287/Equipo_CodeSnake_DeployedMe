const express = require('express');
const router  = express.Router();
const db      = require('../Db');

const auditoriaMiddleware = async (req, res, next) => {
  const metodosAuditables = ['POST', 'PUT', 'DELETE'];
  if (!metodosAuditables.includes(req.method)) return next();
  const originalJson = res.json;
  res.json = function(body) { res.locals.responseBody = body; return originalJson.call(this, body); };
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await db.insert('auditoria', {
          usuario: req.headers['x-user-id'] || 'sistema',
          accion: req.method,
          entidad: req.originalUrl.split('/')[2] || 'general',
          entidad_id: res.locals.responseBody?.id || req.params.id || null,
          datos_anteriores: JSON.stringify(req.body._oldData || {}),
          datos_nuevos: JSON.stringify(req.body),
          ip: req.ip || req.connection.remoteAddress,
          fecha_hora: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
      } catch (err) { console.error('Audit Error:', err.message); }
    }
  });
  next();
};

router.get('/', async (req, res) => {
  try {
    const allowed = ['usuario', 'accion', 'entidad', 'id'];
    const filters = {};
    Object.keys(req.query).forEach(k => { if(allowed.includes(k)) filters[k] = req.query[k]; });
    const logs = await db.query('auditoria', filters);
    res.json(logs.reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, middleware: auditoriaMiddleware };
