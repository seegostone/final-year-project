const fs = require('fs');
const path = require('path');
const root = path.join(__dirname);
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(name.name)) files.push(full);
  }
}
walk(root);
const imports = {};
files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  const re = /import\s+[^\n]+from\s+['\"]([^\"']+)['\"]/g;
  let m;
  while ((m = re.exec(content))) {
    const imp = m[1];
    if (/(^|\/)ui\//.test(imp)) {
      const mod = imp.replace(/^.*ui\//, '');
      if (!imports[mod]) imports[mod] = new Set();
      imports[mod].add(path.relative(root, f));
    }
  }
});
const out = Object.keys(imports).sort().map((k) => `${k}\n${[...imports[k]].map((f) => '  ' + f).join('\n')}`).join('\n\n');
fs.writeFileSync(path.join(root, 'audit-ui-imports-output.txt'), out);
console.log('done');
