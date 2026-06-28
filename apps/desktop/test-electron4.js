// Test if electron APIs are available as globals or via process
console.log('=== Environment Check ===');
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron || 'NOT FOUND');
console.log('process.type:', process.type || 'NOT FOUND');

// Check all ways to access electron
const candidates = [
  'app', 'BrowserWindow', 'ipcMain', 'session',
  'dialog', 'shell', 'Menu', 'Tray', 'nativeTheme'
];
console.log('\n=== Global check ===');
for (const name of candidates) {
  console.log(`  global.${name}:`, typeof global[name]);
}

console.log('\n=== require("electron") check ===');
try {
  const e = require('electron');
  console.log('  type:', typeof e);
  console.log('  value (first 80):', String(e).slice(0, 80));
} catch(err) {
  console.log('  error:', err.message);
}

process.exit(0);
