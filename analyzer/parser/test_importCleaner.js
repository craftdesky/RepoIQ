const path = require('path');
const { cleanImports } = require('./importCleaner');

function runCase(desc, baseFile, imports, options) {
  console.log(`\n=== ${desc} ===`);
  console.log(JSON.stringify(cleanImports(baseFile, imports, options), null, 2));
}

const baseFile = path.join(__dirname, 'fileParser.js');

// Non-relative specifier
runCase('Non-relative specifier', baseFile, ['importExtractor.js']);

// Relative specifier
runCase('Relative specifier', baseFile, ['./importExtractor.js']);

// Resolve non-relative by setting projectRoot
runCase('Resolve non-relative with projectRoot', baseFile, ['importExtractor.js'], { resolveNonRelative: true, projectRoot: __dirname });

// Multiple mixed entries
runCase('Mixed entries', baseFile, ['fs', './importExtractor.js', 'some-module'], { resolveNonRelative: true, projectRoot: __dirname });
