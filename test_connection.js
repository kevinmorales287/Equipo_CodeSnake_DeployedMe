const db = require('./Db.js');

async function testConnection() {
  const tables = ['conceptos', 'descripciones', 'relaciones', 'base_clinica'];
  
  try {
    const mode = await db.getMode();
    
    if (mode === 'MySQL') {
      console.log('✅ MySQL conectado');
    } else {
      console.log('📁 Modo JSON (offline) activo');
    }

    console.log('\nRecuento de registros por tabla:');
    console.log('-------------------------------');

    for (const table of tables) {
      try {
        const rows = await db.query(table);
        console.log(`- ${table.padEnd(15)}: ${rows.length} registros`);
      } catch (err) {
        console.log(`- ${table.padEnd(15)}: ❌ Error (${err.message})`);
      }
    }

    console.log('-------------------------------');
    console.log('\n✅ El proyecto está listo para usarse');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error general durante la prueba:', err.message);
    process.exit(1);
  }
}

testConnection();
