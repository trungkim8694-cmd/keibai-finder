const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/href=["']\/(en|vi|zh)[\/"']/g);
  if (matches) {
    console.log('Found old lang link in', path.relative(path.join(__dirname, '..'), filePath), matches);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) checkFile(full);
  });
}

walk(srcDir);
console.log('Check finished.');
