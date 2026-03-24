const express = require('express');
const router  = express.Router();
const db      = require('../Db');

// GET /api/notas-medicas?paciente_id=123
router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    const notes = await db.query('notas_medicas', { paciente_id });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notas-medicas
router.post('/', async (req, res) => {
  try {
    const note = await db.insert('notas_medicas', req.body);
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/notas-medicas/:id
router.get('/:id', async (req, res) => {
  try {
    const note = await db.query('notas_medicas', { id: req.params.id });
    res.json(note[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
