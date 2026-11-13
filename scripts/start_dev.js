const path = require('path');

process.on('uncaughtException', (err) => {
  if (err && err.code === 'EINVAL') {
    // Ignore console write errors on headless Windows
    return;
  }
  console.error('UNCAUGHT EXCEPTION:', err);
});

function safeWrap(stream) {
  const orig = stream.write.bind(stream);
  stream.write = function (chunk, encoding, cb) {
    try {
      return orig(chunk, encoding, cb);
    } catch (e) {
      if (typeof cb === 'function') cb();
      return true;
    }
  };
}

safeWrap(process.stdout);
safeWrap(process.stderr);

process.env.NODE_PATH = 'C:\\kigyou-list\\frontend\\node_modules;G:\\My Drive\\LapTrinh\\keibaiKoubai\\web\\node_modules';
process.env.NEXT_DIST_DIR = 'C:\\Users\\admin\\AppData\\Local\\Temp\\.next-keibai';
process.env.PORT = '3000';
process.env.CI = '1';

process.chdir(path.join(__dirname, '..', 'web'));

process.argv = [
  process.argv[0],
  'C:\\kigyou-list\\frontend\\node_modules\\next\\dist\\bin\\next',
  'dev',
  '--port',
  '3000',
  '--webpack'
];

require('C:\\kigyou-list\\frontend\\node_modules\\next\\dist\\bin\\next');
