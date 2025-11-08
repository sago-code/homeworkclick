import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

async function cleanScreenshots() {
  try {
    // Verificar si el directorio existe
    try {
      await fs.access(screenshotsDir);
    } catch {
      console.log('📁 El directorio de screenshots no existe. No hay nada que limpiar.');
      return;
    }

    // Leer todos los archivos en el directorio
    const files = await fs.readdir(screenshotsDir);
    
    // Filtrar solo archivos .png (excluir .gitkeep)
    const pngFiles = files.filter(file => file.endsWith('.png'));
    
    if (pngFiles.length === 0) {
      console.log('✅ No hay capturas de pantalla para eliminar.');
      return;
    }

    // Eliminar cada archivo
    let deletedCount = 0;
    for (const file of pngFiles) {
      const filePath = path.join(screenshotsDir, file);
      await fs.unlink(filePath);
      deletedCount++;
      console.log(`🗑️  Eliminado: ${file}`);
    }

    console.log(`\n✅ ${deletedCount} captura(s) de pantalla eliminada(s) exitosamente.`);
  } catch (error) {
    console.error('❌ Error al limpiar capturas de pantalla:', error.message);
    process.exit(1);
  }
}

cleanScreenshots();

