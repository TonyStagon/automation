import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SRC_DIR = path.join(__dirname, '../src');
const BUILD_DIR = path.join(__dirname, '../build');

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function generateManifest() {
  const manifest: Record<string, {
    source: string | null;
    build: string;
    hash: string;
  }> = {};

  // Process all build files
  function processDirectory(dir: string, relativePath = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const relPath = path.join(relativePath, file);

      if (stat.isDirectory()) {
        processDirectory(fullPath, relPath);
      } else if (file.endsWith('.js') || file.endsWith('.json')) {
        const srcPath = path.join(SRC_DIR, relPath);
        const buildPath = path.join(BUILD_DIR, relPath);
        
        if (fs.existsSync(buildPath)) {
          manifest[relPath] = {
            source: fs.existsSync(srcPath) ? srcPath : null,
            build: buildPath,
            hash: hashFile(buildPath)
          };
        }
      }
    });
  }

  processDirectory(BUILD_DIR);
  
  const manifestData = {
    timestamp: new Date().toISOString(),
    files: manifest
  };

  fs.writeFileSync(
    path.join(BUILD_DIR, 'build-manifest.json'),
    JSON.stringify(manifestData, null, 2)
  );
}

generateManifest();