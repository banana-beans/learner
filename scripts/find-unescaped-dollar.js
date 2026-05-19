const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'snippets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
const hits = [];
const re = /(?<!\\)\$\{/g;
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = src.split('\n');
  let inBacktick = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // crude state: count unescaped backticks
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '`' && line[j-1] !== '\\') inBacktick = !inBacktick;
    }
    if (!inBacktick && !line.includes('`')) continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      hits.push(`${f}:${i+1}: ${line.slice(Math.max(0, m.index-30), m.index+80)}`);
    }
  }
}
console.log('total:', hits.length);
for (const h of hits) console.log(h);
