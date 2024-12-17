const fs = require('fs');
const path = require('path');
const { gzip } = require('zlib');
const { promisify } = require('util');

const gzipAsync = promisify(gzip);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

async function generateBuildReport(distPath) {
  const files = await walkDir(distPath);
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: 0,
    files: []
  };

  for (const file of files) {
    const stats = await statAsync(file);
    const relativePath = path.relative(distPath, file);
    const fileInfo = {
      path: relativePath,
      size: stats.size,
      gzipSize: 0
    };

    if (file.match(/\.(js|css|html|svg)$/)) {
      const content = await readFileAsync(file);
      const gzipped = await gzipAsync(content);
      fileInfo.gzipSize = gzipped.length;
    }

    report.totalSize += stats.size;
    report.files.push(fileInfo);
  }

  await writeFileAsync(
    path.join(distPath, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\nBuild Report:');
  console.log('--------------');
  console.log(`Total Size: ${formatSize(report.totalSize)}`);
  console.log('\nLargest Files:');
  report.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach(file => {
      console.log(
        `${file.path}: ${formatSize(file.size)}${
          file.gzipSize ? ` (gzipped: ${formatSize(file.gzipSize)})` : ''
        }`
      );
    });
}

async function walkDir(dir) {
  const files = [];
  const entries = await readdirAsync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Main execution
const distPath = path.resolve(__dirname, '../dist');

generateBuildReport(distPath)
  .then(() => {
    console.log('\nPost-build tasks completed successfully.');
  })
  .catch(error => {
    console.error('Error during post-build tasks:', error);
    process.exit(1);
  }); 