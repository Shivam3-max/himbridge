// Production entry point. Hostinger's Node.js log viewer reads JSON lines ({timestamp, level, message}),
// so startup details and any crash are written that way before the real server loads.
import { createServer } from 'node:http';

const log = (level, message) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));
log('INFO', `Starting Himbridge on Node ${process.version}, port ${process.env.PORT || 3870}, data dir ${process.env.HIMBRIDGE_DATA_DIR || '(default)'}`);

// No top-level await: Hostinger's runner loads the entry file with require(), which rejects async ES modules.
import('./server.js').then(() => log('INFO', 'Himbridge server loaded')).catch((err) => {
  log('ERROR', `Startup failed: ${err && err.stack ? err.stack : err}`);
  // Keep a minimal responder up so the failure is visible in the logs instead of a silent restart loop.
  createServer((req, res) => { res.writeHead(503, { 'Content-Type': 'text/plain' }); res.end('Himbridge is starting up. Please try again shortly.'); })
    .listen(Number(process.env.PORT) || 3870);
});
