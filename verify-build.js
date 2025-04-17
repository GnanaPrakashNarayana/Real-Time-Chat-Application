const fs = require('fs');
const path = require('path');

// Check potential frontend build paths
const potentialPaths = [
  path.join(__dirname, 'frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
  '/opt/render/project/src/frontend/dist',
  '/opt/render/project/frontend/dist'
];

console.log('Checking for frontend build directory...');

potentialPaths.forEach(dirPath => {
  const exists = fs.existsSync(dirPath);
  console.log(`${dirPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  
  if (exists) {
    const indexPath = path.join(dirPath, 'index.html');
    const indexExists = fs.existsSync(indexPath);
    console.log(`  - index.html: ${indexExists ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (indexExists) {
      const files = fs.readdirSync(dirPath);
      console.log(`  - Directory contents (${files.length} files):`);
      files.slice(0, 10).forEach(file => console.log(`    - ${file}`));
      if (files.length > 10) {
        console.log(`    - ... and ${files.length - 10} more files`);
      }
    }
  }
});