// api/abreviaturas.js — Rutas para el catálogo de abreviaturas
// El frontend llama a estos endpoints con fetch()

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/abreviaturas
// Devuelve todas las abreviaturas, o filtra por ?q=HTA&seccion=diagnostico
router.get('/', async (req, res) => {
  try {
    const { q, seccion } = req.query;

    let sql    = 'SELECT * FROM abreviaturas WHERE 1=1';
    const params = [];

    // Filtrar por prefijo (lo que el usuario está escribiendo)
    if (q) {
      sql += ' AND (original LIKE ? OR expandido LIKE ?)';
      params.push(`${q}%`, `${q}%`);
    }

    // Filtrar por sección actual + términos generales
    if (seccion) {
      sql += ' AND (seccion = ? OR seccion = "general")';
      params.push(seccion);
    }

    sql += ' ORDER BY original ASC LIMIT 10';

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (error) {
    console.error('Error al buscar abreviaturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/abreviaturas
// Guarda una abreviatura nueva
// Body: { original: "HTA", expandido: "hipertensión arterial", seccion: "diagnostico" }
router.post('/', async (req, res) => {
  try {
    const { original, expandido, seccion } = req.body;

    if (!original || !expandido || !seccion) {
      return res.status(400).json({ error: 'Faltan campos: original, expandido, seccion' });
    }

    const [result] = await db.query(
      'INSERT INTO abreviaturas (original, expandido, seccion) VALUES (?, ?, ?)',
      [original, expandido, seccion]
    );

    res.status(201).json({ id: result.insertId, original, expandido, seccion });

  } catch (error) {
    console.error('Error al guardar abreviatura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/abreviaturas/:id
// Elimina una abreviatura por su id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM abreviaturas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Abreviatura eliminada' });
  } catch (error) {
    console.error('Error al eliminar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;