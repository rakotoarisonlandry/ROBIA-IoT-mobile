const { execFileSync } = require('node:child_process');
const path = require('node:path');
for (const script of ['test-booking.cjs', 'test-google-maps.cjs', 'test-guide.cjs', 'check-architecture.cjs']) {
  execFileSync(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit' });
}
