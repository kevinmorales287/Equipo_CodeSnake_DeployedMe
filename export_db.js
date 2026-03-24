const db = require('./Db.js');
const fs = require('fs');
const path = require('path');

async function exportToJSON() {
  const tables = ['conceptos', 'descripciones', 'relaciones', 'base_clinica'];
  const outputDir = path.join(__dirname, 'database');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    const pool = await db.getPool();
    console.log('Iniciando exportación de base de datos...');

    for (const table of tables) {
      console.log(`Exportando tabla: ${table}...`);
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      
      const filePath = path.join(outputDir, `${table}.json`);
      const content = JSON.stringify(rows, null, 2);
      
      // Control de tamaño: si es el script de exportación, lo guardamos. 
      // El usuario mencionó omitir axiomas si supera 50MB, pero axiomas no está en mi lista de exportación.
      
      fs.writeFileSync(filePath, content);
      
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ ${table} guardado (${sizeMB} MB)`);
    }

    console.log('\n✨ Exportación completada con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante la exportación:', err.message);
    process.exit(1);
  }
}

exportToJSON();
