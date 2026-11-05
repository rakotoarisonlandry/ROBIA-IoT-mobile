const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const src = path.resolve(__dirname, '../src');
const permitted = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  presentation: ['presentation', 'application', 'domain', 'composition'],
  composition: ['composition', 'infrastructure', 'application', 'domain'],
  app: ['app', 'presentation', 'composition'],
};
let imports = 0;
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { inspect(file); continue; }
    if (!/\.[jt]sx?$/.test(file)) continue;
    const layer = path.relative(src, file).split(path.sep)[0];
    const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      let target;
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) target = node.moduleSpecifier.text;
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) target = node.arguments[0]?.text;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') target = node.arguments[0]?.text;
      if (target) {
        imports++;
        if (target.startsWith('.') || target.startsWith('@/')) {
          const resolved = target.startsWith('@/') ? path.join(src, target.slice(2)) : path.resolve(path.dirname(file), target);
          const dependencyLayer = path.relative(src, resolved).split(path.sep)[0];
          if (layer === 'domain' || layer === 'application') {
            assert.ok(permitted[dependencyLayer], `${file}: core dependency must remain in a declared source layer: ${target}`);
          }
          // Styles and asset declarations may remain at the source root.
          if (permitted[dependencyLayer]) assert.ok(permitted[layer]?.includes(dependencyLayer), `${file}: ${layer} cannot import ${target}`);
          if (layer === 'presentation' && dependencyLayer === 'composition') {
            assert.ok(resolved.endsWith('app-services-provider'), 'UI can access the injected context, not instantiate adapters');
          }
        } else if (layer === 'domain' || layer === 'application') {
          assert.fail(`${file}: core must not import external package ${target}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
}
inspect(src);
console.log(`Architecture dependency rules: ${imports} imports checked — OK`);
