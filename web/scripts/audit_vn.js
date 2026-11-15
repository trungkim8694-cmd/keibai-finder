const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Check if it's NOT a pure comment line
        if (!trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
          if (vnRegex.test(line)) {
            results.push({ file: path.relative(path.join(__dirname, '..'), full), line: idx + 1, text: trimmed });
          }
        }
      });
    }
  });
  return results;
}

const hits = walk(srcDir);
console.log('--- USER-FACING OR CODE LOGIC HITS (NON-COMMENT) ---', hits.length);
hits.forEach(h => console.log(`${h.file}:${h.line} -> ${h.text}`));
