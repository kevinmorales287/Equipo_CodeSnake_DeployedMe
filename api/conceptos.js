const express = require('express');
const router  = express.Router();
const db      = require('../Db');
const fs      = require('fs');
const path    = require('path');

let conceptosMemoria = null;

// Cargar conceptos en memoria al iniciar (Caché Problem 1)
function cargarEnMemoria() {
  if (conceptosMemoria) return;
  try {
    const jsonPath = path.join(__dirname, '..', 'database', 'conceptos.json');
    if (fs.existsSync(jsonPath)) {
      const start = Date.now();
      conceptosMemoria = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`--- 🧠 CIE-10 cargado en memoria (${conceptosMemoria.length} registros) en ${Date.now() - start}ms ---`);
    } else {
      console.warn('--- ⚠️ No se encontró conceptos.json para cargar en memoria ---');
      conceptosMemoria = [];
    }
  } catch (err) {
    console.error('Error cargando conceptos en memoria:', err);
    conceptosMemoria = [];
  }
}

// Inicializar carga
cargarEnMemoria();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const term = q.toLowerCase();
    
    // Búsqueda instantánea en memoria
    const results = conceptosMemoria.filter(c => 
      (c.cie10_code || '').toLowerCase().startsWith(term) || 
      (c.termino || '').toLowerCase().includes(term)
    );

    // Mapear al formato esperado y limitar a 15
    const mapped = results.slice(0, 15).map(c => ({
      codigo: c.cie10_code,
      descripcion: c.termino,
      tipo: 'CIE-10'
    }));

    res.json(mapped);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
