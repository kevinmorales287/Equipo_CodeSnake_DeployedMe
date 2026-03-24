const express = require('express');
const router  = express.Router();
const db      = require('../Db');

router.get('/', async (req, res) => {
  try {
    const { q } = req.query; 
    if(!q || q.length < 2) return res.json([]);

    const concepts = await db.query('conceptos', { termino: `%${q}%` });
    
    // Mapear al formato esperado por el frontend
    res.json(concepts.slice(0, 15).map(c => ({
      codigo: c.cie10_code || c.codigo || 'S/C',
      descripcion: c.termino || c.descripcion || 'Sin descripción'
    })));
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
