// 最小化测试主进程
console.log('=== Minimal Main Process Test ===');
console.log('process.type:', process.type);
console.log('process.version:', process.version);

try {
  const electron = require('electron');
  console.log('require("electron") type:', typeof electron);
  console.log('has app:', !!electron.app);
  console.log('has BrowserWindow:', !!electron.BrowserWindow);
  
  if (electron.app) {
    console.log('SUCCESS: electron.app is available!');
    electron.app.whenReady().then(() => {
      console.log('app.whenReady() resolved!');
      const { BrowserWindow } = electron;
      const win = new BrowserWindow({ width: 400, height: 300 });
      win.loadURL('data:text/html,<h1>It Works!</h1>');
      // 3秒后退出
      setTimeout(() => win.close(), 3000);
    });
  } else {
    console.error('FAIL: electron.app is undefined!');
    console.error('electron value:', String(electron).substring(0, 100));
    process.exit(1);
  }
} catch (e) {
  console.error('require error:', e.message);
  process.exit(1);
}
