// Runs automatically before `npm run build`: copies data/data.json into the
// app's user data folder (if nothing is there yet) so the built app starts
// with your existing entries.
const fs = require('fs');
const os = require('os');
const path = require('path');

const appData =
    process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') :
    process.platform === 'win32' ? process.env.APPDATA :
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');

const src = path.join(__dirname, '..', 'data', 'data.json');
const destDir = path.join(appData, 'Dieting App');
const dest = path.join(destDir, 'data.json');

if (fs.existsSync(dest)) {
    console.log('Data already in', dest);
} else if (fs.existsSync(src)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('Copied existing data to', dest);
} else {
    console.log('No existing data to migrate.');
}
