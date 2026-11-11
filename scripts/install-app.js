// Runs automatically after `npm run build` on macOS: copies the built
// "Dieting App.app" into /Applications so it can be launched from
// Launchpad / Spotlight / the Dock like any other app.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') process.exit(0);

const distDir = path.join(__dirname, '..', 'dist');
const macDir = fs.readdirSync(distDir).find(d => d.startsWith('mac'));
const src = macDir && path.join(distDir, macDir, 'Dieting App.app');
if (!src || !fs.existsSync(src)) {
    console.error('Built app not found in dist/mac*/');
    process.exit(1);
}

const dest = '/Applications/Dieting App.app';
// Quit a running copy so it can be replaced.
try { execFileSync('osascript', ['-e', 'quit app "Dieting App"'], { stdio: 'ignore' }); } catch {}
fs.rmSync(dest, { recursive: true, force: true });
execFileSync('ditto', [src, dest]);
console.log('Installed', dest);
