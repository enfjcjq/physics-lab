// Debug what require('electron') returns in Electron 31
const e = require('electron');
console.log('full value:', JSON.stringify(e).slice(0, 200));
console.log('type:', typeof e);
console.log('is string?', typeof e === 'string');
if (typeof e === 'string') {
  console.log('It is the electron.exe path!');
}

// Try the new Electron 28+ way
try {
  const process = require('process');
  console.log('process.electronBinding:', typeof process.electronBinding);
} catch(e2) { console.log('no electronBinding'); }

// Check if there's a global
console.log('global.require keys (sample):', Object.keys(global.require || {}).slice(0,5));
process.exit(0);
