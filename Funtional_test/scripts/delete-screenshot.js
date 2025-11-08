import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

// Crear interfaz readline para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listScreenshots() {
  try {
    await fs.access(screenshotsDir);
  } catch {
    console.log('📁 El directorio de screenshots no existe.');
    return [];
  }

  const files = await fs.readdir(screenshotsDir);
  const pngFiles = files.filter(file => file.endsWith('.png')).sort();
  return pngFiles;
}

async function deleteScreenshot(filename) {
  try {
    const filePath = path.join(screenshotsDir, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Buscando capturas de pantalla...\n');
  
  const screenshots = await listScreenshots();
  
  if (screenshots.length === 0) {
    console.log('✅ No hay capturas de pantalla para eliminar.');
    rl.close();
    return;
  }

  // Mostrar lista numerada
  console.log('📸 Capturas de pantalla disponibles:\n');
  for (const [index, file] of screenshots.entries()) {
    try {
      const stats = await fs.stat(path.join(screenshotsDir, file));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${index + 1}. ${file} (${sizeKB} KB)`);
    } catch {
      console.log(`  ${index + 1}. ${file}`);
    }
  }

  console.log('\n--- Opciones ---');
  console.log('  • Ingresa el número de la captura que deseas eliminar');
  console.log('  • Ingresa "all" para eliminar todas');
  console.log('  • Ingresa "cancel" o presiona Enter para cancelar');
  console.log('  • Ingresa parte del nombre para buscar (ej: "tareas_07")\n');

  const answer = await question('👉 Tu elección: ');

  if (!answer || answer.toLowerCase() === 'cancel') {
    console.log('❌ Operación cancelada.');
    rl.close();
    return;
  }

  if (answer.toLowerCase() === 'all') {
    const confirm = await question('⚠️  ¿Estás seguro de eliminar TODAS las capturas? (yes/no): ');
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      let deletedCount = 0;
      for (const file of screenshots) {
        if (await deleteScreenshot(file)) {
          deletedCount++;
          console.log(`🗑️  Eliminado: ${file}`);
        }
      }
      console.log(`\n✅ ${deletedCount} captura(s) eliminada(s) exitosamente.`);
    } else {
      console.log('❌ Operación cancelada.');
    }
    rl.close();
    return;
  }

  // Buscar por número
  const index = parseInt(answer) - 1;
  if (index >= 0 && index < screenshots.length) {
    const file = screenshots[index];
    const confirm = await question(`⚠️  ¿Eliminar "${file}"? (yes/no): `);
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      if (await deleteScreenshot(file)) {
        console.log(`✅ Captura "${file}" eliminada exitosamente.`);
      }
    } else {
      console.log('❌ Operación cancelada.');
    }
    rl.close();
    return;
  }

  // Buscar por nombre parcial
  const matchingFiles = screenshots.filter(file => 
    file.toLowerCase().includes(answer.toLowerCase())
  );

  if (matchingFiles.length === 0) {
    console.log(`❌ No se encontraron capturas que coincidan con "${answer}"`);
    rl.close();
    return;
  }

  if (matchingFiles.length === 1) {
    const file = matchingFiles[0];
    const confirm = await question(`⚠️  ¿Eliminar "${file}"? (yes/no): `);
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      if (await deleteScreenshot(file)) {
        console.log(`✅ Captura "${file}" eliminada exitosamente.`);
      }
    } else {
      console.log('❌ Operación cancelada.');
    }
    rl.close();
    return;
  }

  // Múltiples coincidencias
  console.log(`\n🔍 Se encontraron ${matchingFiles.length} coincidencias:\n`);
  matchingFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  const selection = await question('\n👉 Selecciona el número de la captura a eliminar (o "cancel"): ');
  
  if (!selection || selection.toLowerCase() === 'cancel') {
    console.log('❌ Operación cancelada.');
    rl.close();
    return;
  }

  const selectedIndex = parseInt(selection) - 1;
  if (selectedIndex >= 0 && selectedIndex < matchingFiles.length) {
    const file = matchingFiles[selectedIndex];
    const confirm = await question(`⚠️  ¿Eliminar "${file}"? (yes/no): `);
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      if (await deleteScreenshot(file)) {
        console.log(`✅ Captura "${file}" eliminada exitosamente.`);
      }
    } else {
      console.log('❌ Operación cancelada.');
    }
  } else {
    console.log('❌ Selección inválida.');
  }

  rl.close();
}

main();

