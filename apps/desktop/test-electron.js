// Minimal Electron main process test
const electron = require('electron');
console.log('electron type:', typeof electron);
console.log('electron keys count:', Object.keys(electron).length);
console.log('first 5 keys:', Object.keys(electron).slice(0, 5));
console.log('app type:', typeof electron.app);
console.log('app value:', electron.app);

if (!electron.app) {
  console.error('FATAL: electron.app is undefined!');
  console.error('This means the electron module did not load correctly.');
  process.exit(1);
}

console.log('SUCCESS: electron.app is available');
process.exit(0);
