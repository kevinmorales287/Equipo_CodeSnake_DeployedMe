const express = require('express');
const router  = express.Router();
const db      = require('../Db');

// GET /api/notas-enfermeria?paciente_id=123
router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    const notes = await db.query('notas_enfermeria', { paciente_id });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notas-enfermeria
router.post('/', async (req, res) => {
  try {
    const note = await db.insert('notas_enfermeria', req.body);
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
