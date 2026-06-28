// Test correct Electron 31 import patterns
try {
  const { app, BrowserWindow } = require('electron/main');
  console.log('✅ require("electron/main") works!');
  console.log('   app:', typeof app, app ? 'exists' : 'null');
  console.log('   BrowserWindow:', typeof BrowserWindow);
} catch(err) {
  console.error('❌ electron/main failed:', err.message);
}

// Also try common alternative
try {
  const e = require('electron');
  console.log('\nrequire("electron") returns:', typeof e, String(e).slice(0, 60));
} catch(err) {
  console.error('electron failed:', err.message);
}
process.exit(0);
