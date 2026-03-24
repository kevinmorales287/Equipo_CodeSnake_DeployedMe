const express = require('express');
const router  = express.Router();
const db      = require('../Db');

router.get('/', async (req, res) => {
  try { res.json(await db.query('usuarios')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await db.insert('usuarios', req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await db.update('usuarios', req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await db.getPool().catch(()=>null);
    if(pool) await pool.query('DELETE FROM usuarios WHERE id=?', [req.params.id]);
    else {
      const fs=require('fs'), p=require('path');
      const f=p.join(__dirname,'..','database','usuarios.json');
      let l=JSON.parse(fs.readFileSync(f,'utf8'));
      fs.writeFileSync(f, JSON.stringify(l.filter(u=>u.id!=req.params.id),null,2));
    }
    res.json({success:true});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
