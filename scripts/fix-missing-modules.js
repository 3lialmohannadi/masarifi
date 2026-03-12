'use strict';

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    filePath: 'node_modules/expo/node_modules/@expo/cli/add-module.js',
    content: "'use strict';\nmodule.exports = (modulePath) => import(modulePath);\n",
    description: '@expo/cli add-module.js (ESM import bridge)',
  },
];

for (const fix of fixes) {
  const fullPath = path.join(__dirname, '..', fix.filePath);
  try {
    fs.accessSync(fullPath);
  } catch {
    try {
      fs.writeFileSync(fullPath, fix.content, 'utf-8');
      console.log(`[fix-missing-modules] Created missing file: ${fix.description}`);
    } catch (e) {
      console.warn(`[fix-missing-modules] Could not create ${fix.filePath}:`, e.message);
    }
  }
}
